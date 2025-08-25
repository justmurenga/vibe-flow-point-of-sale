import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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

// Super Admin Components
import SuperAdminDashboard from '@/pages/SuperAdminDashboard';
import TenantManagement from '@/pages/TenantManagement';
import SuperAdminUserManagement from '@/pages/SuperAdminUserManagement';
import SuperAdminAnalytics from '@/pages/SuperAdminAnalytics';
import SuperAdminRevenue from '@/pages/SuperAdminRevenue';
import SuperAdminPlanManagement from '@/pages/SuperAdminPlanManagement';
import SuperAdminSystemHealth from '@/pages/SuperAdminSystemHealth';
import SuperAdminDatabase from '@/pages/SuperAdminDatabase';
import SuperAdminSecurity from '@/pages/SuperAdminSecurity';
import SuperAdminCommunications from '@/pages/SuperAdminCommunications';
import SuperAdminSettings from '@/pages/SuperAdminSettings';
import { SuperAdminLayout } from '@/components/SuperAdminLayout';

// Tenant Layout Component
import { TenantAdminLayout } from '@/components/TenantAdminLayout';

// Protected Components
import Sales from '@/pages/Sales';
import StockManagement from '@/pages/StockManagement';
import Customers from '@/pages/Customers';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';
import ExternalIntegrationsManager from '@/components/integrations/ExternalIntegrationsManager';

// Tenant Admin Components
import TenantAdminDashboard from '@/pages/TenantAdminDashboard';
import Products from '@/pages/Products';
import Purchases from '@/pages/Purchases';
import Accounting from '@/pages/Accounting';
import Team from '@/pages/Team';
import Communications from '@/pages/Communications';

// Protected Route Component
import ProtectedRoute from '@/components/ProtectedRoute';

export function UnifiedRouter() {
  const { user, loading: authLoading } = useAuth();
  const { domainLoading } = useDomainContext();
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    const validateSubdomain = async () => {
      if (authLoading || domainLoading) return;
      
      const validation = await navigationService.getInstance().validateSubdomainAccess();
      if (!validation.valid) {
        console.log('❌ [ROUTER] Subdomain validation failed:', validation.error);
        // Handle invalid subdomain - could redirect to main domain or show error
        return;
      }
      
      setIsValidating(false);
    };

    validateSubdomain();
  }, [authLoading, domainLoading]);

  // Show loading while auth or domain is loading
  if (authLoading || domainLoading || isValidating) {
    return <PageLoader />;
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
            <SuperAdminLayout>
              <SuperAdminDashboard />
            </SuperAdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/superadmin/tenants" 
        element={
          <ProtectedRoute allowedRoles={['superadmin']}>
            <SuperAdminLayout>
              <TenantManagement />
            </SuperAdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/superadmin/users" 
        element={
          <ProtectedRoute allowedRoles={['superadmin']}>
            <SuperAdminLayout>
              <SuperAdminUserManagement />
            </SuperAdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/superadmin/analytics" 
        element={
          <ProtectedRoute allowedRoles={['superadmin']}>
            <SuperAdminLayout>
              <SuperAdminAnalytics />
            </SuperAdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/superadmin/revenue" 
        element={
          <ProtectedRoute allowedRoles={['superadmin']}>
            <SuperAdminLayout>
              <SuperAdminRevenue />
            </SuperAdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/superadmin/plans" 
        element={
          <ProtectedRoute allowedRoles={['superadmin']}>
            <SuperAdminLayout>
              <SuperAdminPlanManagement />
            </SuperAdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/superadmin/system" 
        element={
          <ProtectedRoute allowedRoles={['superadmin']}>
            <SuperAdminLayout>
              <SuperAdminSystemHealth />
            </SuperAdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/superadmin/database" 
        element={
          <ProtectedRoute allowedRoles={['superadmin']}>
            <SuperAdminLayout>
              <SuperAdminDatabase />
            </SuperAdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/superadmin/security" 
        element={
          <ProtectedRoute allowedRoles={['superadmin']}>
            <SuperAdminLayout>
              <SuperAdminSecurity />
            </SuperAdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/superadmin/communications" 
        element={
          <ProtectedRoute allowedRoles={['superadmin']}>
            <SuperAdminLayout>
              <SuperAdminCommunications />
            </SuperAdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/superadmin/settings" 
        element={
          <ProtectedRoute allowedRoles={['superadmin']}>
            <SuperAdminLayout>
              <SuperAdminSettings />
            </SuperAdminLayout>
          </ProtectedRoute>
        } 
      />
      
      {/* Tenant Admin Routes - Main Dashboard */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute>
            <TenantAdminLayout>
              <TenantAdminDashboard />
            </TenantAdminLayout>
          </ProtectedRoute>
        } 
      />
      
      {/* Tenant Admin Routes - Business Management */}
      <Route 
        path="/admin/products" 
        element={
          <ProtectedRoute>
            <TenantAdminLayout>
              <Products />
            </TenantAdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/sales" 
        element={
          <ProtectedRoute>
            <TenantAdminLayout>
              <Sales />
            </TenantAdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/purchases" 
        element={
          <ProtectedRoute>
            <TenantAdminLayout>
              <Purchases />
            </TenantAdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/customers" 
        element={
          <ProtectedRoute>
            <TenantAdminLayout>
              <Customers />
            </TenantAdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/customer-management" 
        element={
          <ProtectedRoute>
            <TenantAdminLayout>
              <Customers />
            </TenantAdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/accounting" 
        element={
          <ProtectedRoute>
            <TenantAdminLayout>
              <Accounting />
            </TenantAdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/reports" 
        element={
          <ProtectedRoute>
            <TenantAdminLayout>
              <Reports />
            </TenantAdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/integrations" 
        element={
          <ProtectedRoute>
            <TenantAdminLayout>
              <ExternalIntegrationsManager />
            </TenantAdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/team" 
        element={
          <ProtectedRoute>
            <TenantAdminLayout>
              <Team />
            </TenantAdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/communications" 
        element={
          <ProtectedRoute>
            <TenantAdminLayout>
              <Communications />
            </TenantAdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/settings" 
        element={
          <ProtectedRoute>
            <TenantAdminLayout>
              <Settings />
            </TenantAdminLayout>
          </ProtectedRoute>
        } 
      />
      
      {/* AI Routes */}
      <Route 
        path="/admin/ai-dashboard" 
        element={
          <ProtectedRoute>
            <TenantAdminLayout>
              <TenantAdminDashboard />
            </TenantAdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/ai-automation" 
        element={
          <ProtectedRoute>
            <TenantAdminLayout>
              <TenantAdminDashboard />
            </TenantAdminLayout>
          </ProtectedRoute>
        } 
      />
      
      {/* Legacy Routes - Keep for backward compatibility */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <TenantAdminLayout>
              <TenantAdminDashboard />
            </TenantAdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/sales" 
        element={
          <ProtectedRoute>
            <TenantAdminLayout>
              <Sales />
            </TenantAdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/inventory" 
        element={
          <ProtectedRoute>
            <TenantAdminLayout>
              <StockManagement />
            </TenantAdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/customers" 
        element={
          <ProtectedRoute>
            <TenantAdminLayout>
              <Customers />
            </TenantAdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/reports" 
        element={
          <ProtectedRoute>
            <TenantAdminLayout>
              <Reports />
            </TenantAdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute>
            <TenantAdminLayout>
              <Settings />
            </TenantAdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/integrations" 
        element={
          <ProtectedRoute>
            <TenantAdminLayout>
              <ExternalIntegrationsManager />
            </TenantAdminLayout>
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}
