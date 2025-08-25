import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SignupData {
  email: string;
  password?: string; // Optional for Google OAuth
  fullName: string;
  businessName: string;
  businessType?: string;
  country?: string;
  currency?: string;
  timezone?: string;
  phone?: string;
  isGoogleUser?: boolean;
}

export interface AuthResult {
  success: boolean;
  user?: any;
  tenant?: any;
  error?: string;
  requiresVerification?: boolean;
}

export interface InvitationData {
  email: string;
  fullName: string;
  password: string;
}

export class AuthService {
  private static instance: AuthService;
  private toast = useToast();

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Unified signup process for both email and Google OAuth
   */
  async signup(data: SignupData): Promise<AuthResult> {
    try {
      console.log('🔐 Starting unified signup process:', { email: data.email, isGoogleUser: data.isGoogleUser });

      let user;
      
      if (data.isGoogleUser) {
        // Google OAuth flow
        const { data: authData, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback?type=google&signup=true`,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          }
        });

        if (error) throw error;
        
        // OAuth will redirect, so we return early
        return { success: true, requiresVerification: true };
      } else {
        // Email/password signup
        const { data: authData, error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password!,
          options: {
            data: {
              full_name: data.fullName,
              business_name: data.businessName,
              business_type: data.businessType,
              country: data.country,
              currency: data.currency,
              timezone: data.timezone,
              phone: data.phone
            }
          }
        });

        if (error) throw error;
        
        user = authData.user;
        
        if (authData.user && !authData.user.email_confirmed_at) {
          // Send verification email
          await this.sendVerificationEmail(data.email);
          return { success: true, user, requiresVerification: true };
        }
      }

      // Create tenant if user is confirmed
      if (user) {
        const tenantResult = await this.createTenant(user.id, data);
        return { success: true, user, tenant: tenantResult.tenant };
      }

      return { success: true, requiresVerification: true };
    } catch (error: any) {
      console.error('Signup error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Unified signin process
   */
  async signin(email: string, password: string): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      return { success: true, user: data.user };
    } catch (error: any) {
      console.error('Signin error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Unified password reset process
   */
  async resetPassword(email: string): Promise<AuthResult> {
    try {
      const { error } = await supabase.functions.invoke('send-otp-verification', {
        body: {
          email: email.trim(),
          otpType: 'password_reset'
        }
      });

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Password reset error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Unified tenant creation
   */
  private async createTenant(userId: string, businessData: SignupData): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.functions.invoke('create-tenant-trial', {
        body: {
          userId,
          businessData: {
            businessName: businessData.businessName,
            ownerName: businessData.fullName,
            ownerEmail: businessData.email,
            businessEmail: businessData.email,
            businessType: businessData.businessType,
            country: businessData.country,
            currency: businessData.currency,
            timezone: businessData.timezone,
            phone: businessData.phone
          },
          planType: 'highest',
          isGoogleUser: businessData.isGoogleUser || false
        }
      });

      if (error) throw error;

      return { success: true, tenant: data };
    } catch (error: any) {
      console.error('Tenant creation error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send verification email
   */
  private async sendVerificationEmail(email: string): Promise<void> {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending verification email:', error);
    }
  }

  /**
   * Handle OAuth callback
   */
  async handleOAuthCallback(): Promise<AuthResult> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      if (!session?.user) {
        return { success: false, error: 'No session found' };
      }

      // Check if user has a profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (!profile) {
        // New Google user - create profile and tenant
        const businessData = {
          email: session.user.email!,
          fullName: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
          businessName: session.user.user_metadata?.business_name || 'My Business',
          isGoogleUser: true
        };

        const tenantResult = await this.createTenant(session.user.id, businessData);
        return { success: true, user: session.user, tenant: tenantResult.tenant };
      }

      return { success: true, user: session.user };
    } catch (error: any) {
      console.error('OAuth callback error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Accept user invitation
   */
  async acceptInvitation(data: InvitationData): Promise<AuthResult> {
    try {
      console.log('🔐 Accepting invitation for:', data.email);

      // Create user account
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName
          }
        }
      });

      if (error) throw error;

      if (authData.user) {
        // Accept the invitation
        const { error: inviteError } = await supabase.functions.invoke('accept-user-invitation', {
          body: {
            userId: authData.user.id,
            email: data.email
          }
        });

        if (inviteError) throw inviteError;

        return { success: true, user: authData.user };
      }

      return { success: false, error: 'Failed to create user account' };
    } catch (error: any) {
      console.error('Accept invitation error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send user invitation
   */
  async sendInvitation(email: string, role: string = 'user'): Promise<AuthResult> {
    try {
      console.log(' Sending invitation to:', email);

      const { error } = await supabase.functions.invoke('send-user-invitation', {
        body: {
          email,
          role
        }
      });

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Send invitation error:', error);
      return { success: false, error: error.message };
    }
  }
}

export const authService = AuthService.getInstance();
