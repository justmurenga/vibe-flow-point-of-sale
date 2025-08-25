import { supabase } from '@/integrations/supabase/client';

export interface NavigationConfig {
  mainDomain: string;
  subdomainPattern: string;
  customDomainPattern?: string;
}

export class NavigationService {
  private static instance: NavigationService;
  private config: NavigationConfig = {
    mainDomain: 'vibenet.online',
    subdomainPattern: '*.vibenet.online',
    customDomainPattern: undefined
  };

  static getInstance(): NavigationService {
    if (!NavigationService.instance) {
      NavigationService.instance = new NavigationService();
    }
    return NavigationService.instance;
  }

  /**
   * Get current domain configuration
   */
  getCurrentDomain(): string {
    return window.location.hostname;
  }

  /**
   * Check if current domain is main domain
   */
  isMainDomain(): boolean {
    const domain = this.getCurrentDomain();
    return domain === this.config.mainDomain || domain === `www.${this.config.mainDomain}`;
  }

  /**
   * Check if current domain is subdomain
   */
  isSubdomain(): boolean {
    const domain = this.getCurrentDomain();
    return domain.endsWith(`.${this.config.mainDomain}`);
  }

  /**
   * Get tenant ID from subdomain
   */
  async getTenantFromSubdomain(): Promise<string | null> {
    const domain = this.getCurrentDomain();
    
    if (!this.isSubdomain()) return null;

    try {
      const subdomain = domain.split('.')[0];
      
      const { data: tenant, error } = await supabase
        .from('tenants')
        .select('id')
        .eq('subdomain', subdomain)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        console.error('Error fetching tenant from subdomain:', error);
        return null;
      }

      return tenant?.id || null;
    } catch (error) {
      console.error('Error getting tenant from subdomain:', error);
      return null;
    }
  }

  /**
   * Navigate to tenant dashboard
   */
  async navigateToTenant(tenantId: string): Promise<void> {
    try {
      const { data: tenant, error } = await supabase
        .from('tenants')
        .select('subdomain, name')
        .eq('id', tenantId)
        .single();

      if (error) throw error;

      if (tenant?.subdomain) {
        const tenantUrl = `https://${tenant.subdomain}.${this.config.mainDomain}/dashboard`;
        window.location.href = tenantUrl;
      } else {
        // Fallback to main domain dashboard
        window.location.href = `https://${this.config.mainDomain}/dashboard`;
      }
    } catch (error) {
      console.error('Error navigating to tenant:', error);
      // Fallback to main domain
      window.location.href = `https://${this.config.mainDomain}/dashboard`;
    }
  }

  /**
   * Navigate to main domain
   */
  navigateToMain(): void {
    window.location.href = `https://${this.config.mainDomain}`;
  }

  /**
   * Get appropriate auth URL based on current domain
   */
  getAuthUrl(): string {
    if (this.isMainDomain()) {
      return '/auth';
    } else {
      return `https://${this.config.mainDomain}/auth`;
    }
  }

  /**
   * Get appropriate signup URL based on current domain
   */
  getSignupUrl(): string {
    if (this.isMainDomain()) {
      return '/signup';
    } else {
      return `https://${this.config.mainDomain}/signup`;
    }
  }
}

export const navigationService = NavigationService.getInstance();
