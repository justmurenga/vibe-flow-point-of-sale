import { useNavigate, useLocation } from 'react-router-dom';
import { navigationService } from '@/services/NavigationService';
import { useAuth } from '@/contexts/AuthContext';

export const useNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userRole } = useAuth();

  const navigateTo = (path: string) => {
    const url = navigationService.getInstance().getNavigationUrl(path);
    navigate(url);
  };

  const navigateToAuth = () => {
    const authUrl = navigationService.getInstance().getAuthUrl();
    if (authUrl.startsWith('http')) {
      window.location.href = authUrl;
    } else {
      navigate(authUrl);
    }
  };

  const navigateToSignup = () => {
    const signupUrl = navigationService.getInstance().getSignupUrl();
    if (signupUrl.startsWith('http')) {
      window.location.href = signupUrl;
    } else {
      navigate(signupUrl);
    }
  };

  const navigateToMain = () => {
    navigationService.getInstance().navigateToMain();
  };

  const navigateToTenant = async (tenantId: string) => {
    await navigationService.getInstance().navigateToTenant(tenantId);
  };

  const getDefaultRedirectUrl = () => {
    return navigationService.getInstance().getDefaultRedirectUrl(userRole);
  };

  const hasRouteAccess = (path: string) => {
    return navigationService.getInstance().hasRouteAccess(path, userRole);
  };

  const isRouteProtected = (path: string) => {
    return navigationService.getInstance().isRouteProtected(path);
  };

  const isRoutePublic = (path: string) => {
    return navigationService.getInstance().isRoutePublic(path);
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
    isMainDomain: navigationService.getInstance().isMainDomain(),
    isSubdomain: navigationService.getInstance().isSubdomain(),
    isDevelopmentDomain: navigationService.getInstance().isDevelopmentDomain(),
  };
};
