import React from 'react';
import { StockManagement as StockManagementComponent } from '@/components/StockManagement';
import { TenantAdminLayout } from '@/components/TenantAdminLayout'; // Fixed import path

export function StockManagement() {
  return (
    <TenantAdminLayout>
      <StockManagementComponent />
    </TenantAdminLayout>
  );
}

export default StockManagement;
