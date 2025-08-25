import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDomainContext } from '@/hooks/useDomainContext';
import { navigationService } from '@/services/NavigationService';
import { PageLoader } from '@/components/PageLoader';

// Import all page components
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
import SuperAdminDashboard from '@/pages/SuperAdminDashboard';
import TenantManagement from '@/pages/TenantManagement';
import SuperAdminUserManagement from '@/pages/SuperAdminUserManagement';
import Sales from '@/pages/Sales';
import StockManagement from '@/pages/StockManagement';
import Customers from '@/pages/Customers';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';
import ProtectedRoute from '@/components/ProtectedRoute';
import ExternalIntegrationsManager from '@/components/integrations/ExternalIntegrationsManager';

export function UnifiedRouter() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading, userRole } = useAuth();
  const { loading: domainLoading } = useDomainContext();
  
  const [isValidating, setIsValidating] = useState(true);
  const [subdomainError, setSubdomainError] = useState<string | null>(null);

  console.log('🛣️ [ROUTER] UnifiedRouter component rendering...');
  console.log('✅ [ROUTER] All hooks initialized successfully');

  // Validate subdomain access
  useEffect(() => {
    const validateAccess = async () => {
      if (domainLoading) return;
      
      const validation = await navigationService.getInstance().validateSubdomainAccess();
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
      const callbackUrl = navigationService.getInstance().handleOAuthCallback(searchParams, hash);
      window.location.replace(callbackUrl);
      return;
    }
  }, [location, isValidating]);

  // Handle authentication redirects
  useEffect(() => {
    if (authLoading || isValidating) return;
    
    if (user) {
      const currentPath = location.pathname;
      const routeConfig = navigationService.getInstance().getRouteConfig(currentPath);
      
      // Check if user has access to current route
      if (routeConfig && !navigationService.getInstance().hasRouteAccess(currentPath, userRole)) {
        const redirectUrl = navigationService.getInstance().getUnauthorizedRedirectUrl();
        navigate(redirectUrl, { replace: true });
        return;
      }
      
      // Handle default redirects after login
      const isPublicRoute = navigationService.getInstance().isRoutePublic(currentPath);
      if (isPublicRoute && currentPath !== '/') {
        const redirectUrl = navigationService.getInstance().getDefaultRedirectUrl(userRole);
        navigate(redirectUrl, { replace: true });
      }
    } else {
      // Handle unauthenticated access to protected routes
      const currentPath = location.pathname;
      if (navigationService.getInstance().isRouteProtected(currentPath)) {
        const redirectUrl = navigationService.getInstance().getUnauthorizedRedirectUrl();
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
            onClick={() => navigationService.getInstance().navigateToMain()}
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
      <Route path="/success" element={<Success />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
      
      {/* Super Admin Routes */}
      <Route 
        path="/superadmin" 
        element={
          <ProtectedRoute allowedRoles={['superadmin']}>
            <SuperAdminDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/superadmin/tenants" 
        element={
          <ProtectedRoute allowedRoles={['superadmin']}>
            <TenantManagement />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/superadmin/users" 
        element={
          <ProtectedRoute allowedRoles={['superadmin']}>
            <SuperAdminUserManagement />
          </ProtectedRoute>
        } 
      />
      
      {/* Protected Routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Sales />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/sales" 
        element={
          <ProtectedRoute>
            <Sales />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/inventory" 
        element={
          <ProtectedRoute>
            <StockManagement />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/customers" 
        element={
          <ProtectedRoute>
            <Customers />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/reports" 
        element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/integrations" 
        element={
          <ProtectedRoute>
            <ExternalIntegrationsManager />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}
