import { useNavigate, useLocation } from 'react-router-dom';
import { navigationService } from '@/services/NavigationService';
import { useAuth } from '@/contexts/AuthContext';

export const useNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userRole } = useAuth();

  const navigateTo = (path: string) => {
    const url = navigationService.getNavigationUrl(path);
    navigate(url);
  };

  const navigateToAuth = () => {
    const authUrl = navigationService.getAuthUrl();
    if (authUrl.startsWith('http')) {
      window.location.href = authUrl;
    } else {
      navigate(authUrl);
    }
  };

  const navigateToSignup = () => {
    const signupUrl = navigationService.getSignupUrl();
    if (signupUrl.startsWith('http')) {
      window.location.href = signupUrl;
    } else {
      navigate(signupUrl);
    }
  };

  const navigateToMain = () => {
    navigationService.navigateToMain();
  };

  const navigateToTenant = async (tenantId: string) => {
    await navigationService.navigateToTenant(tenantId);
  };

  const getDefaultRedirectUrl = () => {
    return navigationService.getDefaultRedirectUrl(userRole);
  };

  const hasRouteAccess = (path: string) => {
    return navigationService.hasRouteAccess(path, userRole);
  };

  const isRouteProtected = (path: string) => {
    return navigationService.isRouteProtected(path);
  };

  const isRoutePublic = (path: string) => {
    return navigationService.isRoutePublic(path);
  };

  return {
    navigateTo,
    navigateToAuth,
    navigateToSignup,
    navigateToMain,
    navigateToTenant,
    getDefaultRedirectUrl,
    hasRouteAccess,
    isRouteProtected,
    isRoutePublic,
    currentPath: location.pathname,
    isMainDomain: navigationService.isMainDomain(),
    isSubdomain: navigationService.isSubdomain(),
    isDevelopmentDomain: navigationService.isDevelopmentDomain(),
  };
};
