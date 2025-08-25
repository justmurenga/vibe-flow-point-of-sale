import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ErrorHandler, ErrorType, ErrorSeverity } from '@/lib/error-handling';
import { LoggingService, LogLevel, LogCategory } from '@/services/LoggingService';

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
  private logger = LoggingService.getInstance();

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
    const timeEnd = this.logger.time(LogCategory.AUTHENTICATION, 'user_signup');
    
    try {
      this.logger.info(LogCategory.AUTHENTICATION, 'Signup started', {
        email: data.email,
        businessName: data.businessName,
        isGoogleUser: data.isGoogleUser
      });

      // Validate input
      const validationError = this.validateSignupData(data);
      if (validationError) {
        throw new Error(validationError);
      }

      // Check if user already exists
      const { data: existingUser, error: checkError } = await supabase.auth.admin.listUsers();
      if (checkError) {
        throw checkError;
      }

      const userExists = existingUser.users.some(user => user.email === data.email);
      if (userExists) {
        throw new Error('User with this email already exists');
      }

      // Create user
      const { data: authData, error } = await supabase.auth.admin.createUser({
        email: data.email,
        password: data.password!,
        email_confirm: true, // Auto-confirm for now
        user_metadata: {
          full_name: data.fullName,
          business_name: data.businessName,
          business_type: data.businessType,
          country: data.country,
          currency: data.currency,
          timezone: data.timezone,
          phone: data.phone
        }
      });

      if (error) {
        throw error;
      }

      // Create tenant
      const tenantResult = await this.createTenant(authData.user.id, data);

      this.logger.info(LogCategory.AUTHENTICATION, 'Signup completed successfully', {
        userId: authData.user.id,
        tenantId: tenantResult.tenant.id
      });

      timeEnd();

      return {
        success: true,
        user: authData.user,
        tenant: tenantResult.tenant
      };

    } catch (error: any) {
      timeEnd();
      
      const appError = ErrorHandler.handleAuthError(error, {
        action: 'signup',
        component: 'AuthService'
      });

      this.logger.error(LogCategory.AUTHENTICATION, 'Signup failed', {
        error: appError.message,
        email: data.email
      });

      return { success: false, error: appError.userMessage };
    }
  }

  /**
   * Unified signin process
   */
  async signin(email: string, password: string): Promise<AuthResult> {
    const timeEnd = this.logger.time(LogCategory.AUTHENTICATION, 'user_signin');
    
    try {
      this.logger.info(LogCategory.AUTHENTICATION, 'Signin started', { email });

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      this.logger.info(LogCategory.AUTHENTICATION, 'Signin completed successfully', {
        userId: data.user.id
      });

      timeEnd();

      return { success: true, user: data.user };

    } catch (error: any) {
      timeEnd();
      
      const appError = ErrorHandler.handleAuthError(error, {
        action: 'signin',
        component: 'AuthService'
      });

      this.logger.error(LogCategory.AUTHENTICATION, 'Signin failed', {
        error: appError.message,
        email
      });

      return { success: false, error: appError.userMessage };
    }
  }

  /**
   * Unified password reset process
   */
  async resetPassword(email: string): Promise<AuthResult> {
    const timeEnd = this.logger.time(LogCategory.AUTHENTICATION, 'password_reset');
    
    try {
      this.logger.info(LogCategory.AUTHENTICATION, 'Password reset started', { email });

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        throw error;
      }

      this.logger.info(LogCategory.AUTHENTICATION, 'Password reset email sent', { email });

      timeEnd();

      return { success: true };

    } catch (error: any) {
      timeEnd();
      
      const appError = ErrorHandler.handleAuthError(error, {
        action: 'reset_password',
        component: 'AuthService'
      });

      this.logger.error(LogCategory.AUTHENTICATION, 'Password reset failed', {
        error: appError.message,
        email
      });

      return { success: false, error: appError.userMessage };
    }
  }

  /**
   * Send OTP with comprehensive error handling
   */
  async sendOTP(email: string, type: 'email_verification' | 'password_reset' | 'login_verification'): Promise<AuthResult> {
    const timeEnd = this.logger.time(LogCategory.AUTHENTICATION, 'send_otp');
    
    try {
      this.logger.info(LogCategory.AUTHENTICATION, 'OTP sending started', { email, type });

      const { data, error } = await supabase.functions.invoke('unified-otp', {
        body: { email, otpType: type }
      });

      if (error) {
        throw error;
      }

      this.logger.info(LogCategory.AUTHENTICATION, 'OTP sent successfully', { email, type });

      timeEnd();

      return { success: true };

    } catch (error: any) {
      timeEnd();
      
      const appError = ErrorHandler.createError(
        ErrorType.OTP,
        error.message || 'Failed to send OTP',
        'Failed to send verification code. Please try again.',
        ErrorSeverity.MEDIUM,
        {
          action: 'send_otp',
          component: 'AuthService'
        },
        error
      );

      this.logger.error(LogCategory.AUTHENTICATION, 'OTP sending failed', {
        error: appError.message,
        email,
        type
      });

      return { success: false, error: appError.userMessage };
    }
  }

  /**
   * Verify OTP with comprehensive error handling
   */
  async verifyOTP(email: string, otpCode: string, type: 'email_verification' | 'password_reset' | 'login_verification'): Promise<AuthResult> {
    const timeEnd = this.logger.time(LogCategory.AUTHENTICATION, 'verify_otp');
    
    try {
      this.logger.info(LogCategory.AUTHENTICATION, 'OTP verification started', { email, type });

      const { data, error } = await supabase.functions.invoke('unified-verify-otp', {
        body: { email, otpCode, otpType: type }
      });

      if (error) {
        throw error;
      }

      this.logger.info(LogCategory.AUTHENTICATION, 'OTP verified successfully', { email, type });

      timeEnd();

      return { success: true, user: data.user };

    } catch (error: any) {
      timeEnd();
      
      const appError = ErrorHandler.createError(
        ErrorType.OTP,
        error.message || 'Failed to verify OTP',
        'Invalid verification code. Please check and try again.',
        ErrorSeverity.MEDIUM,
        {
          action: 'verify_otp',
          component: 'AuthService'
        },
        error
      );

      this.logger.error(LogCategory.AUTHENTICATION, 'OTP verification failed', {
        error: appError.message,
        email,
        type
      });

      return { success: false, error: appError.userMessage };
    }
  }

  /**
   * Send user invitation with comprehensive error handling
   */
  async sendInvitation(email: string, role: string, tenantId: string, invitedBy: string): Promise<AuthResult> {
    const timeEnd = this.logger.time(LogCategory.AUTHENTICATION, 'send_invitation');
    
    try {
      this.logger.info(LogCategory.AUTHENTICATION, 'Invitation sending started', { 
        email, 
        role, 
        tenantId, 
        invitedBy 
      });

      const { data, error } = await supabase.functions.invoke('unified-user-invitation', {
        body: { email, role, tenantId, invitedBy }
      });

      if (error) {
        throw error;
      }

      this.logger.info(LogCategory.AUTHENTICATION, 'Invitation sent successfully', { 
        email, 
        role, 
        tenantId 
      });

      timeEnd();

      return { success: true };

    } catch (error: any) {
      timeEnd();
      
      const appError = ErrorHandler.createError(
        ErrorType.INVITATION,
        error.message || 'Failed to send invitation',
        'Failed to send invitation email. Please try again.',
        ErrorSeverity.MEDIUM,
        {
          action: 'send_invitation',
          component: 'AuthService'
        },
        error
      );

      this.logger.error(LogCategory.AUTHENTICATION, 'Invitation sending failed', {
        error: appError.message,
        email,
        role,
        tenantId
      });

      return { success: false, error: appError.userMessage };
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

  private validateSignupData(data: SignupData): string | null {
    if (!data.email || !data.email.includes('@')) {
      return 'Valid email is required';
    }
    if (!data.password || data.password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!data.fullName || data.fullName.trim().length < 2) {
      return 'Full name is required';
    }
    if (!data.businessName || data.businessName.trim().length < 2) {
      return 'Business name is required';
    }
    return null;
  }

  private async createTenant(userId: string, businessData: SignupData): Promise<{ tenant: any }> {
    const timeEnd = this.logger.time(LogCategory.AUTHENTICATION, 'create_tenant');
    
    try {
      // Get highest billing plan
      const { data: plans, error: plansError } = await supabase
        .from('billing_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: false })
        .limit(1);

      if (plansError || !plans?.[0]) {
        throw new Error('No active billing plan found');
      }
      
      const highestPlan = plans[0];
      const subdomain = this.sanitizeSubdomain(businessData.businessName);

      // Create tenant
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: businessData.businessName,
          subdomain,
          status: 'trial',
          billing_plan_id: highestPlan.id,
          created_by: userId
        })
        .select()
        .single();

      if (tenantError) {
        throw tenantError;
      }

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          tenant_id: tenant.id,
          role: 'admin',
          full_name: businessData.fullName,
          auth_method: businessData.isGoogleUser ? 'google' : 'email'
        })
        .eq('user_id', userId);

      if (profileError) {
        throw profileError;
      }

      timeEnd();

      return { tenant };

    } catch (error: any) {
      timeEnd();
      throw error;
    }
  }

  private sanitizeSubdomain(businessName: string): string {
    return businessName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 30);
  }
}

export const authService = AuthService.getInstance();
