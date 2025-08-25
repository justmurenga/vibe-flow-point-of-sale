import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDomainContext } from '@/hooks/useDomainContext';
import { PageLoader } from '@/components/PageLoader';
import { TenantAdminLayout } from './TenantAdminLayout';
import ProtectedRoute from './ProtectedRoute';
import { SubscriptionGuard } from './SubscriptionGuard';

// Lazy load pages
const TenantAdminDashboard = lazy(() => import('../pages/TenantAdminDashboard'));
const Products = lazy(() => import('../pages/Products'));
const Customers = lazy(() => import('../pages/Customers'));
const Sales = lazy(() => import('../pages/Sales'));
const Purchases = lazy(() => import('../pages/Purchases'));
const Accounting = lazy(() => import('../pages/Accounting'));
const Reports = lazy(() => import('../pages/Reports'));
const Settings = lazy(() => import('../pages/Settings'));
const Team = lazy(() => import('../pages/Team'));
const Communications = lazy(() => import('../pages/Communications'));

export function SimplifiedTenantRoutes() {
  const { user, loading, userRole } = useAuth();
  const { domainConfig } = useDomainContext();

  return (
    <ProtectedRoute requireAuth={true}>
      <SubscriptionGuard>
        <TenantAdminLayout>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<TenantAdminDashboard />} />
              <Route path="/dashboard" element={<TenantAdminDashboard />} />
              <Route path="/admin" element={<TenantAdminDashboard />} />
              <Route path="/admin/products" element={<Products />} />
              <Route path="/admin/customers" element={<Customers />} />
              <Route path="/admin/sales" element={<Sales />} />
              <Route path="/admin/purchases" element={<Purchases />} />
              <Route path="/admin/accounting" element={<Accounting />} />
              <Route path="/admin/reports" element={<Reports />} />
              <Route path="/admin/settings" element={<Settings />} />
              <Route path="/admin/team" element={<Team />} />
              <Route path="/admin/communications" element={<Communications />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </TenantAdminLayout>
      </SubscriptionGuard>
    </ProtectedRoute>
  );
}