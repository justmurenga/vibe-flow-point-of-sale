import { supabase } from '@/integrations/supabase/client';
import { domainManager } from '@/lib/domain-manager';

export interface NavigationConfig {
  mainDomain: string;
  subdomainPattern: string;
  customDomainPattern?: string;
  developmentDomains: string[];
}

export interface RouteConfig {
  path: string;
  requiresAuth: boolean;
  allowedRoles?: string[];
  isPublic: boolean;
  redirectTo?: string;
}

export class NavigationService {
  private static instance: NavigationService;
  private config: NavigationConfig = {
    mainDomain: 'vibenet.online',
    subdomainPattern: '*.vibenet.online',
    customDomainPattern: undefined,
    developmentDomains: ['localhost', '127.0.0.1']
  };

  // Route configurations - simplified to avoid duplication with React Router
  private routes: Record<string, RouteConfig> = {
    // Public routes
    '/': { path: '/', requiresAuth: false, isPublic: true },
    '/demo': { path: '/demo', requiresAuth: false, isPublic: true },
    '/auth': { path: '/auth', requiresAuth: false, isPublic: true },
    '/auth/callback': { path: '/auth/callback', requiresAuth: false, isPublic: true },
    '/signup': { path: '/signup', requiresAuth: false, isPublic: true },
    '/invite': { path: '/invite', requiresAuth: false, isPublic: true },
    '/reset-password': { path: '/reset-password', requiresAuth: false, isPublic: true },
    '/verify-email': { path: '/verify-email', requiresAuth: false, isPublic: true },
    '/forgot-password': { path: '/forgot-password', requiresAuth: false, isPublic: true },
    '/success': { path: '/success', requiresAuth: false, isPublic: true },
    '/privacy-policy': { path: '/privacy-policy', requiresAuth: false, isPublic: true },
    '/terms-of-service': { path: '/terms-of-service', requiresAuth: false, isPublic: true },
    
    // Super admin routes
    '/superadmin': { path: '/superadmin', requiresAuth: true, allowedRoles: ['superadmin'], isPublic: false },
    '/superadmin/tenants': { path: '/superadmin/tenants', requiresAuth: true, allowedRoles: ['superadmin'], isPublic: false },
    '/superadmin/users': { path: '/superadmin/users', requiresAuth: true, allowedRoles: ['superadmin'], isPublic: false },
    
    // Tenant admin routes - using /admin prefix
    '/admin': { path: '/admin', requiresAuth: true, isPublic: false },
    '/admin/products': { path: '/admin/products', requiresAuth: true, isPublic: false },
    '/admin/sales': { path: '/admin/sales', requiresAuth: true, isPublic: false },
    '/admin/customers': { path: '/admin/customers', requiresAuth: true, isPublic: false },
    '/admin/reports': { path: '/admin/reports', requiresAuth: true, isPublic: false },
    '/admin/settings': { path: '/admin/settings', requiresAuth: true, isPublic: false },
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
   * Check if current domain is development domain
   */
  isDevelopmentDomain(): boolean {
    const domain = this.getCurrentDomain();
    return this.config.developmentDomains.includes(domain);
  }

  /**
   * Get tenant ID from subdomain
   */
  async getTenantFromSubdomain(): Promise<string | null> {
    const domain = this.getCurrentDomain();
    
    if (!this.isSubdomain()) return null;

    try {
      const subdomain = domain.split('.')[0];
      
      console.log('🔍 [NAVIGATION] Looking for tenant with subdomain:', subdomain);
      
      // First, try the direct subdomain lookup
      const { data: tenant, error } = await supabase
        .from('tenants')
        .select('id, name, status, subdomain')
        .eq('subdomain', subdomain)
        .in('status', ['active', 'trial'])
        .maybeSingle();

      if (error) {
        console.error('Error fetching tenant from subdomain:', error);
        return null;
      }

      if (tenant) {
        console.log('✅ [NAVIGATION] Found tenant via direct subdomain lookup:', tenant.name, 'with status:', tenant.status);
        return tenant.id;
      }

      // If direct lookup fails, try using the domain manager's logic
      console.log('🔄 [NAVIGATION] Direct lookup failed, trying domain manager logic...');
      
      try {
        const domainConfig = await domainManager.getInstance().getCurrentDomainConfig();
        if (domainConfig?.tenantId) {
          console.log('✅ [NAVIGATION] Found tenant via domain manager:', domainConfig.tenantId);
          return domainConfig.tenantId;
        }
      } catch (domainError) {
        console.error('Error using domain manager:', domainError);
      }

      console.log('❌ [NAVIGATION] No tenant found for subdomain:', subdomain);
      return null;
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
        const tenantUrl = `https://${tenant.subdomain}.${this.config.mainDomain}/admin`;
        window.location.href = tenantUrl;
      } else {
        // Fallback to main domain dashboard
        window.location.href = `https://${this.config.mainDomain}/admin`;
      }
    } catch (error) {
      console.error('Error navigating to tenant:', error);
      // Fallback to main domain
      window.location.href = `https://${this.config.mainDomain}/admin`;
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
    if (this.isMainDomain() || this.isDevelopmentDomain()) {
      return '/auth';
    } else {
      return `https://${this.config.mainDomain}/auth`;
    }
  }

  /**
   * Get appropriate signup URL based on current domain
   */
  getSignupUrl(): string {
    if (this.isMainDomain() || this.isDevelopmentDomain()) {
      return '/signup';
    } else {
      return `https://${this.config.mainDomain}/signup`;
    }
  }

  /**
   * Get route configuration for a path
   */
  getRouteConfig(path: string): RouteConfig | null {
    return this.routes[path] || null;
  }

  /**
   * Check if route requires authentication
   */
  isRouteProtected(path: string): boolean {
    const routeConfig = this.getRouteConfig(path);
    return routeConfig?.requiresAuth || false;
  }

  /**
   * Check if route is public
   */
  isRoutePublic(path: string): boolean {
    const routeConfig = this.getRouteConfig(path);
    return routeConfig?.isPublic || false;
  }

  /**
   * Check if user has access to route based on role
   */
  hasRouteAccess(path: string, userRole?: string): boolean {
    const routeConfig = this.getRouteConfig(path);
    if (!routeConfig) return false;
    
    if (!routeConfig.requiresAuth) return true;
    if (!userRole) return false;
    
    if (routeConfig.allowedRoles) {
      return routeConfig.allowedRoles.includes(userRole);
    }
    
    return true;
  }

  /**
   * Get redirect URL for unauthorized access
   */
  getUnauthorizedRedirectUrl(): string {
    if (this.isMainDomain() || this.isDevelopmentDomain()) {
      return '/auth';
    } else {
      return `https://${this.config.mainDomain}/auth`;
    }
  }

  /**
   * Get default redirect URL after login
   */
  getDefaultRedirectUrl(userRole?: string): string {
    if (userRole === 'superadmin') {
      return '/superadmin';
    }
    
    if (this.isSubdomain()) {
      return '/dashboard';
    }
    
    return '/dashboard';
  }

  /**
   * Handle OAuth callback routing
   */
  handleOAuthCallback(searchParams: URLSearchParams, hash: string): string {
    const callbackType = searchParams.get('type');
    const isSignup = searchParams.get('signup') === 'true';
    const isInvite = searchParams.get('from') === 'invite';
    
    let callbackUrl = '/auth/callback';
    
    if (callbackType) {
      callbackUrl += `?type=${callbackType}`;
    }
    
    if (isSignup) {
      callbackUrl += callbackUrl.includes('?') ? '&signup=true' : '?signup=true';
    }
    
    if (isInvite) {
      callbackUrl += callbackUrl.includes('?') ? '&from=invite' : '?from=invite';
    }
    
    if (hash) {
      callbackUrl += hash;
    }
    
    return callbackUrl;
  }

  /**
   * Validate subdomain access
   */
  async validateSubdomainAccess(): Promise<{ valid: boolean; error?: string }> {
    if (!this.isSubdomain()) {
      return { valid: true };
    }

    console.log(' [NAVIGATION] Validating subdomain access for:', this.getCurrentDomain());
    
    const tenantId = await this.getTenantFromSubdomain();
    if (!tenantId) {
      console.log('❌ [NAVIGATION] Subdomain validation failed - no tenant found');
      return { 
        valid: false, 
        error: 'This business workspace does not exist. Please check the URL or sign up on our main website.' 
      };
    }

    console.log('✅ [NAVIGATION] Subdomain validation successful for tenant:', tenantId);
    return { valid: true };
  }

  /**
   * Get appropriate navigation URL for a route
   */
  getNavigationUrl(path: string): string {
    if (this.isMainDomain() || this.isDevelopmentDomain()) {
      return path;
    } else {
      // For subdomains, check if it's a public route
      const routeConfig = this.getRouteConfig(path);
      if (routeConfig?.isPublic) {
        return `https://${this.config.mainDomain}${path}`;
      }
      return path;
    }
  }
}

// Change from:
// export const navigationService = NavigationService.getInstance();

// To: Lazy initialization
let _navigationService: NavigationService | null = null;

export const navigationService = {
  getInstance(): NavigationService {
    if (!_navigationService) {
      _navigationService = NavigationService.getInstance();
    }
    return _navigationService;
  }
};
