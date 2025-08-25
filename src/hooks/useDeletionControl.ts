import { useAuth } from '@/contexts/AuthContext';
import { useActivityLogger } from './useActivityLogger';

export const useDeletionControl = () => {
  const { user, userRole } = useAuth();
  const { logDelete } = useActivityLogger();

  // Check if user can delete based on role and resource type
  const canDelete = (resourceType: string) => {
    // Superadmin can delete anything
    if (userRole === 'superadmin') return true;
    
    // Admin can delete most resources except tenants
    if (userRole === 'admin' && resourceType !== 'tenant') return true;
    
    // Manager can delete non-critical resources
    if (userRole === 'manager' && ['product', 'category', 'supplier'].includes(resourceType)) return true;
    
    // Regular users cannot delete
    return false;
  };

  const logDeletionAttempt = (resourceType: string, resourceId: string, resourceName?: string) => {
    logDelete(resourceType, resourceId, {
      attempted_by: user?.id,
      resource_name: resourceName,
      action_prevented: true,
      reason: 'Deletion disabled for audit trail'
    });
  };

  return {
    canDelete,
    logDeletionAttempt
  };
};