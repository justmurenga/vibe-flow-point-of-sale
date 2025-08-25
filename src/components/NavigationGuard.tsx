import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@/hooks/useNavigation';
import { navigationService } from '@/services/NavigationService';

interface NavigationGuardProps {
  children: React.ReactNode;
}

export function NavigationGuard({ children }: NavigationGuardProps) {
  const { user, userRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { hasRouteAccess, isRouteProtected } = useNavigation();

  useEffect(() => {
    const currentPath = location.pathname;
    
    // Check if route requires authentication
    if (isRouteProtected(currentPath) && !user) {
      const authUrl = navigationService.getAuthUrl();
      if (authUrl.startsWith('http')) {
        window.location.href = authUrl;
      } else {
        navigate(authUrl, { replace: true });
      }
      return;
    }

    // Check if user has access to route
    if (user && !hasRouteAccess(currentPath)) {
      const redirectUrl = navigationService.getDefaultRedirectUrl(userRole);
      navigate(redirectUrl, { replace: true });
      return;
    }
  }, [user, userRole, location, navigate, hasRouteAccess, isRouteProtected]);

  return <>{children}</>;
}
