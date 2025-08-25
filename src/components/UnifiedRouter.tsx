import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDomainContext } from '@/hooks/useDomainContext';
import { navigationService } from '@/services/NavigationService';
import { useToast } from '@/hooks/use-toast';

// Import all components
import LandingPage from '@/pages/LandingPage';
import Demo from '@/pages/Demo';
import Auth from '@/pages/Auth';
import { UnifiedAuthCallback } from '@/components/UnifiedAuthCallback';
import { UnifiedSignup } from '@/components/UnifiedSignup';
import { UnifiedUserInvitation } from '@/components/UnifiedUserInvitation';
import ResetPassword from '@/pages/ResetPassword';
import VerifyEmail from '@/pages/VerifyEmail';
import ForgotPassword from '@/pages/ForgotPassword';
import Success from '@/pages/Success';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import TermsOfService from '@/pages/TermsOfService';
import { SuperAdminLayout } from '@/components/SuperAdminLayout';
import SuperAdminDashboard from '@/pages/SuperAdminDashboard';
import TenantManagement from '@/pages/TenantManagement';
import SuperAdminUserManagement from '@/pages/SuperAdminUserManagement';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AppProvider } from '@/contexts/AppContext';
import { TenantSetupCompletion } from '@/components/TenantSetupCompletion';
import Sales from '@/pages/Sales';
import StockManagement from '@/pages/StockManagement';
import Customers from '@/pages/Customers';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';
import { PageLoader } from '@/components/PageLoader';
import ExternalIntegrationsManager from '@/components/integrations/ExternalIntegrationsManager';

interface UnifiedRouterProps {
  children?: React.ReactNode;
}

export function UnifiedRouter({ children }: UnifiedRouterProps) {
  const { user, loading: authLoading, userRole } = useAuth();
  const { domainConfig, loading: domainLoading } = useDomainContext();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [subdomainError, setSubdomainError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(true);

  // Validate subdomain access
  useEffect(() => {
    const validateAccess = async () => {
      if (domainLoading) return;
      
      const validation = await navigationService.validateSubdomainAccess();
      if (!validation.valid) {
        setSubdomainError(validation.error || 'Invalid subdomain access');
      }
      setIsValidating(false);
    };

    validateAccess();
  }, [domainLoading]);

  // Handle OAuth fragments and routing
  useEffect(() => {
    if (typeof window === 'undefined' || isValidating) return;
    
    const hash = window.location.hash;
    const searchParams = new URLSearchParams(location.search || '');
    
    // Handle OAuth fragments
    if (hash && /access_token|error|type=/.test(hash)) {
      const callbackUrl = navigationService.handleOAuthCallback(searchParams, hash);
      window.location.replace(callbackUrl);
      return;
    }
  }, [location, isValidating]);

  // Handle authentication redirects
  useEffect(() => {
    if (authLoading || isValidating) return;
    
    if (user) {
      const currentPath = location.pathname;
      const routeConfig = navigationService.getRouteConfig(currentPath);
      
      // Check if user has access to current route
      if (routeConfig && !navigationService.hasRouteAccess(currentPath, userRole)) {
        const redirectUrl = navigationService.getUnauthorizedRedirectUrl();
        navigate(redirectUrl, { replace: true });
        return;
      }
      
      // Handle default redirects after login
      const isPublicRoute = navigationService.isRoutePublic(currentPath);
      if (isPublicRoute && currentPath !== '/') {
        const redirectUrl = navigationService.getDefaultRedirectUrl(userRole);
        navigate(redirectUrl, { replace: true });
      }
    } else {
      // Handle unauthenticated access to protected routes
      const currentPath = location.pathname;
      if (navigationService.isRouteProtected(currentPath)) {
        const redirectUrl = navigationService.getUnauthorizedRedirectUrl();
        navigate(redirectUrl, { replace: true });
      }
    }
  }, [user, authLoading, userRole, location, navigate, isValidating]);

  // Show loading while validating
  if (isValidating || domainLoading) {
    return <PageLoader />;
  }

  // Show subdomain error
  if (subdomainError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Workspace Not Found</h1>
          <p className="text-gray-600 mb-6">{subdomainError}</p>
          <button
            onClick={() => navigationService.navigateToMain()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Main Website
          </button>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/demo" element={<Demo />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/auth/callback" element={<UnifiedAuthCallback />} />
      <Route path="/signup" element={<UnifiedSignup mode="trial" />} />
      <Route path="/invite" element={<UnifiedUserInvitation />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      
      {/* Success Pages */}
      <Route path="/success" element={<Success />} />
      
      {/* Legal Pages */}
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
      
      {/* Super Admin Routes */}
      <Route 
        path="/superadmin/*" 
        element={
          <ProtectedRoute allowedRoles={['superadmin']}>
            <SuperAdminLayout>
              <Routes>
                <Route path="/" element={<SuperAdminDashboard />} />
                <Route path="/tenants" element={<TenantManagement />} />
                <Route path="/users" element={<SuperAdminUserManagement />} />
                <Route path="*" element={<Navigate to="/superadmin" replace />} />
              </Routes>
            </SuperAdminLayout>
          </ProtectedRoute>
        } 
      />
      
      {/* Protected Routes */}
      <Route 
        path="/*" 
        element={
          <ProtectedRoute>
            <AppProvider>
              <Routes>
                <Route path="/dashboard" element={<TenantSetupCompletion />} />
                <Route path="/sales" element={<Sales />} />
                <Route path="/inventory" element={<StockManagement />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/integrations" element={<ExternalIntegrationsManager />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </AppProvider>
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}
