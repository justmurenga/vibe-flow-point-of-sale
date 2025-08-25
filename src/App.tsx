import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Suspense, lazy, useEffect, useState, useRef } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { useDomainContext, isDevelopmentDomain, isSubdomain, getBaseDomain } from "@/lib/domain-manager";
import { tabStabilityManager } from "@/lib/tab-stability-manager";
import ProtectedRoute from "./components/ProtectedRoute";
import { SubscriptionGuard } from "./components/SubscriptionGuard";
import { FeatureGuard } from "./components/FeatureGuard";
import { TenantAdminLayout } from "./components/TenantAdminLayout";
import { SuperAdminLayout } from "./components/SuperAdminLayout";
import { StockManagement } from "./components/StockManagement";
import PerformanceMonitor from "./components/PerformanceMonitor";
import CookieConsent from "./components/CookieConsent";
import { AuthSessionFix } from "./components/AuthSessionFix";
import { AppOptimizer } from "./components/AppOptimizer";
import { supabase } from "@/integrations/supabase/client";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { TabStabilityProvider } from "./components/TabStabilityProvider";
import { UnifiedSignup } from '@/components/UnifiedSignup';
import { UnifiedAuthCallback } from '@/components/UnifiedAuthCallback';
import { UnifiedUserInvitation } from '@/components/UnifiedUserInvitation';

// Import critical components directly to avoid dynamic import failures
import LandingPage from "./pages/LandingPage";
const Auth = lazy(() => import("./pages/Auth"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const CurrencyDebug = lazy(() => import("./pages/CurrencyDebug"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const TrialSignup = lazy(() => import("./pages/TrialSignup"));
const TenantRedirect = lazy(() => import("./pages/TenantRedirect"));

// AI Components for Phase 5
const AIDashboard = lazy(() => import("./components/ai/AIDashboard"));
const AIAutomationRules = lazy(() => import("./components/ai/AIAutomationRules"));
const AIPerformanceMetrics = lazy(() => import("./components/ai/AIPerformanceMetrics"));

// Mobile Components for Phase 6
const CashierPWA = lazy(() => import("./components/mobile/CashierPWA"));

// Advanced Analytics & Integrations for Phase 7
const AdvancedAnalyticsDashboard = lazy(() => import("./components/analytics/AdvancedAnalyticsDashboard"));
const ExternalIntegrationsManager = lazy(() => import("./components/integrations/ExternalIntegrationsManager"));

// Advanced Customer Management for Phase 8.5
const AdvancedCustomerManagementDashboard = lazy(() => import("./components/crm/AdvancedCustomerManagementDashboard"));

const Success = lazy(() => import("./pages/Success"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Demo = lazy(() => import("./pages/Demo"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const CompanyInfo = lazy(() => import("./pages/CompanyInfo"));
const Careers = lazy(() => import("./pages/Careers"));
const AccountsReceivablePayable = lazy(() => import("./components/AccountsReceivablePayable"));

// Dashboards
const SuperAdminDashboard = lazy(() => import("./pages/SuperAdminDashboard"));
import TenantAdminDashboard from "./pages/TenantAdminDashboard";
import { TenantSetupCompletion } from "./components/TenantSetupCompletion";

// Admin Pages
const TenantManagement = lazy(() => import("./pages/TenantManagement"));
const SuperAdminUserManagement = lazy(() => import("./pages/SuperAdminUserManagement"));
const SuperAdminAnalytics = lazy(() => import("./pages/SuperAdminAnalytics"));
const SuperAdminRevenue = lazy(() => import("./pages/SuperAdminRevenue"));
const SuperAdminSystemHealth = lazy(() => import("./pages/SuperAdminSystemHealth"));
const SuperAdminDatabase = lazy(() => import("./pages/SuperAdminDatabase"));
const SuperAdminSecurity = lazy(() => import("./pages/SuperAdminSecurity"));
const Settings = lazy(() => import("./pages/Settings"));
const TenantSettings = lazy(() => import("./pages/TenantSettings"));
const TenantCommunications = lazy(() => import("./pages/TenantCommunications"));
const SuperAdminSettings = lazy(() => import("./pages/SuperAdminSettings"));
const SuperAdminCommunications = lazy(() => import("./pages/SuperAdminCommunications"));
const SuperAdminPlanManagement = lazy(() => import("./pages/SuperAdminPlanManagement"));
import Products from "./pages/Products";
const Reports = lazy(() => import("./pages/Reports"));
const Team = lazy(() => import("./pages/Team"));
const Customers = lazy(() => import("./pages/Customers"));
const Sales = lazy(() => import("./pages/Sales"));
const Purchases = lazy(() => import("./pages/Purchases"));
const Accounting = lazy(() => import("./pages/Accounting"));
const Profile = lazy(() => import("./pages/Profile"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

// Simplified auth wrapper - no automatic redirects to prevent loops
const AuthPageWrapper = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
    <div className="text-center space-y-4 animate-fade-in">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// Comprehensive error suppression for external errors and warnings
window.addEventListener('error', (event) => {
  const message = event.message?.toLowerCase() || '';
  const filename = event.filename?.toLowerCase() || '';
  
  if (message.includes('firebase') || 
      message.includes('firestore') || 
      message.includes('googleapis') ||
      message.includes('unrecognized feature') ||
      message.includes('iframe') ||
      message.includes('sandbox') ||
      message.includes('message channel closed') ||
      message.includes('listener indicated an asynchronous response') ||
      filename.includes('firebase') ||
      filename.includes('firestore') ||
      message.includes('webchannelconnection') ||
      message.includes('quic_protocol_error')) {
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason?.message?.toLowerCase() || 
                event.reason?.toString?.()?.toLowerCase() || '';
  
  if (reason.includes('firebase') || 
      reason.includes('firestore') || 
      reason.includes('googleapis') ||
      reason.includes('webchannelconnection') ||
      reason.includes('message channel closed') ||
      reason.includes('listener indicated an asynchronous response') ||
      reason.includes('quic_protocol_error')) {
    event.preventDefault();
    return false;
  }
});

// Suppress Firebase and other noisy logs in production
if (process.env.NODE_ENV !== 'development') {
  const originalError = console.error;
  const originalWarn = console.warn;
  
  console.error = function(...args) {
    const message = args.join(' ').toLowerCase();
    if (message.includes('firebase') || 
        message.includes('firestore') || 
        message.includes('googleapis') ||
        message.includes('webchannelconnection') ||
        message.includes('unrecognized feature') ||
        message.includes('iframe') ||
        message.includes('message channel closed') ||
        message.includes('sandbox')) {
      return;
    }
    originalError.apply(console, args);
  };

  console.warn = function(...args) {
    const message = args.join(' ').toLowerCase();
    if (message.includes('firebase') || 
        message.includes('firestore') || 
        message.includes('googleapis') ||
        message.includes('multiple gotrueclient') ||
        message.includes('sandbox')) {
      return;
    }
    originalWarn.apply(console, args);
  };
}

// Optimized query client configuration for better performance with tab stability
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 120000, // 2 minutes
      gcTime: 300000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false, // Disabled to prevent performance issues
      refetchOnMount: false, // Disabled to prevent unnecessary refetches
      refetchOnReconnect: false, // Disabled to prevent network spam
      // Custom refetch condition that respects tab stability
      queryFn: undefined, // Will be set per query
    },
    mutations: {
      retry: 1, // Limit mutation retries
    },
  },
});

const DomainRouter = () => {
  const { domainConfig, loading } = useDomainContext();
  const { user, loading: authLoading, userRole } = useAuth();
  const location = useLocation();
  
  // Simplified routing logic
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const hash = window.location.hash;
    const searchParams = new URLSearchParams(location.search || '');
    
    // Handle OAuth fragments
    if (hash && /access_token|error|type=/.test(hash)) {
      const callbackUrl = `/auth/callback${location.search}${hash}`;
      window.location.replace(callbackUrl);
      return;
    }
    
    // Handle auth redirects
    if (user && !authLoading) {
      const domain = window.location.hostname;
      const isMainDomain = domain === 'vibenet.online' || domain === 'www.vibenet.online';
      
      if (!isMainDomain && userRole !== 'superadmin') {
        // Redirect to dashboard on tenant subdomains
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 100);
      } else if (isMainDomain && userRole === 'superadmin') {
        // Redirect superadmins to superadmin dashboard
        setTimeout(() => {
          navigate('/superadmin', { replace: true });
        }, 100);
      }
    }
  }, [user, authLoading, userRole, location]);

  return (
    <Suspense fallback={<PageLoader />}>
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
                </Routes>
              </AppProvider>
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Suspense>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <TabStabilityProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
             <AppProvider>
               <TooltipProvider>
                 <>
                   <Toaster />
                   <Sonner />
                   <PerformanceMonitor />
                   <AppOptimizer />
                   <CookieConsent />
                   <BrowserRouter>
                     <DomainRouter />
                   </BrowserRouter>
                 </>
               </TooltipProvider>
             </AppProvider>
          </AuthProvider>
        </QueryClientProvider>
      </TabStabilityProvider>
    </ErrorBoundary>
  );
};

export default App;