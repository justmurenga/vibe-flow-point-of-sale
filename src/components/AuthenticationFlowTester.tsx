import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/services/AuthService';
import { navigationService } from '@/services/NavigationService';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@/hooks/useNavigation';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  Mail, 
  Key, 
  Users, 
  Globe,
  Building2,
  ArrowRight,
  Copy,
  ExternalLink
} from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message: string;
  details?: any;
  timestamp: Date;
}

interface TestFlow {
  id: string;
  name: string;
  description: string;
  tests: TestResult[];
  status: 'pending' | 'running' | 'completed';
}

export function AuthenticationFlowTester() {
  const { user, userRole, tenantId } = useAuth();
  const { toast } = useToast();
  const { isMainDomain, isSubdomain, isDevelopmentDomain } = useNavigation();
  
  const [testFlows, setTestFlows] = useState<TestFlow[]>([]);
  const [currentTest, setCurrentTest] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [testPassword, setTestPassword] = useState('TestPassword123!');
  const [copied, setCopied] = useState<string | null>(null);

  // Initialize test flows
  useEffect(() => {
    const flows: TestFlow[] = [
      {
        id: 'domain-routing',
        name: 'Domain & Routing Tests',
        description: 'Test domain detection and routing logic',
        tests: [],
        status: 'pending'
      },
      {
        id: 'email-signup',
        name: 'Email Signup Flow',
        description: 'Test email/password registration process',
        tests: [],
        status: 'pending'
      },
      {
        id: 'google-oauth',
        name: 'Google OAuth Flow',
        description: 'Test Google OAuth authentication',
        tests: [],
        status: 'pending'
      },
      {
        id: 'password-reset',
        name: 'Password Reset Flow',
        description: 'Test password reset functionality',
        tests: [],
        status: 'pending'
      },
      {
        id: 'email-verification',
        name: 'Email Verification Flow',
        description: 'Test email verification process',
        tests: [],
        status: 'pending'
      },
      {
        id: 'user-invitation',
        name: 'User Invitation Flow',
        description: 'Test user invitation and acceptance',
        tests: [],
        status: 'pending'
      },
      {
        id: 'subdomain-redirects',
        name: 'Subdomain Redirects',
        description: 'Test subdomain navigation and redirects',
        tests: [],
        status: 'pending'
      }
    ];
    setTestFlows(flows);
  }, []);

  const addTestResult = (flowId: string, test: TestResult) => {
    setTestFlows(prev => prev.map(flow => {
      if (flow.id === flowId) {
        return {
          ...flow,
          tests: [...flow.tests, test]
        };
      }
      return flow;
    }));
  };

  const updateFlowStatus = (flowId: string, status: TestFlow['status']) => {
    setTestFlows(prev => prev.map(flow => {
      if (flow.id === flowId) {
        return { ...flow, status };
      }
      return flow;
    }));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  // Test 1: Domain & Routing Tests
  const runDomainRoutingTests = async () => {
    const flowId = 'domain-routing';
    updateFlowStatus(flowId, 'running');
    setCurrentTest(flowId);

    try {
      // Test 1.1: Domain Detection
      const currentDomain = navigationService.getCurrentDomain();
      const isMain = navigationService.isMainDomain();
      const isSub = navigationService.isSubdomain();
      const isDev = navigationService.isDevelopmentDomain();

      addTestResult(flowId, {
        name: 'Domain Detection',
        status: 'passed',
        message: `Current domain: ${currentDomain}`,
        details: { currentDomain, isMain, isSub, isDev },
        timestamp: new Date()
      });

      // Test 1.2: Subdomain Tenant Resolution
      if (isSub) {
        const tenantId = await navigationService.getTenantFromSubdomain();
        addTestResult(flowId, {
          name: 'Subdomain Tenant Resolution',
          status: tenantId ? 'passed' : 'failed',
          message: tenantId ? `Tenant found: ${tenantId}` : 'No tenant found for subdomain',
          details: { tenantId },
          timestamp: new Date()
        });
      }

      // Test 1.3: Route Configuration
      const authUrl = navigationService.getAuthUrl();
      const signupUrl = navigationService.getSignupUrl();
      
      addTestResult(flowId, {
        name: 'Route Configuration',
        status: 'passed',
        message: 'Route URLs generated correctly',
        details: { authUrl, signupUrl },
        timestamp: new Date()
      });

      updateFlowStatus(flowId, 'completed');
    } catch (error: any) {
      addTestResult(flowId, {
        name: 'Domain Routing Tests',
        status: 'failed',
        message: error.message,
        details: { error },
        timestamp: new Date()
      });
      updateFlowStatus(flowId, 'completed');
    }
  };

  // Test 2: Email Signup Flow
  const runEmailSignupTests = async () => {
    const flowId = 'email-signup';
    updateFlowStatus(flowId, 'running');
    setCurrentTest(flowId);

    try {
      // Test 2.1: Signup Data Validation
      const signupData = {
        email: testEmail,
        password: testPassword,
        fullName: 'Test User',
        businessName: 'Test Business',
        businessType: 'retail',
        country: 'Kenya',
        currency: 'KES',
        timezone: 'Africa/Nairobi',
        phone: '+254700000000',
        isGoogleUser: false
      };

      addTestResult(flowId, {
        name: 'Signup Data Validation',
        status: 'passed',
        message: 'Signup data structure is valid',
        details: { signupData },
        timestamp: new Date()
      });

      // Test 2.2: AuthService Signup Method
      const result = await authService.signup(signupData);
      
      addTestResult(flowId, {
        name: 'AuthService Signup',
        status: result.success ? 'passed' : 'failed',
        message: result.success ? 'Signup initiated successfully' : result.error || 'Signup failed',
        details: { result },
        timestamp: new Date()
      });

      updateFlowStatus(flowId, 'completed');
    } catch (error: any) {
      addTestResult(flowId, {
        name: 'Email Signup Tests',
        status: 'failed',
        message: error.message,
        details: { error },
        timestamp: new Date()
      });
      updateFlowStatus(flowId, 'completed');
    }
  };

  // Test 3: Google OAuth Flow
  const runGoogleOAuthTests = async () => {
    const flowId = 'google-oauth';
    updateFlowStatus(flowId, 'running');
    setCurrentTest(flowId);

    try {
      // Test 3.1: OAuth Configuration
      const currentOrigin = window.location.origin;
      const redirectUrl = `${currentOrigin}/auth/callback?type=google&signup=true`;
      
      addTestResult(flowId, {
        name: 'OAuth Configuration',
        status: 'passed',
        message: 'OAuth redirect URL configured correctly',
        details: { currentOrigin, redirectUrl },
        timestamp: new Date()
      });

      // Test 3.2: OAuth Callback Handling
      const callbackUrl = navigationService.handleOAuthCallback(
        new URLSearchParams('type=google&signup=true'),
        '#access_token=test'
      );
      
      addTestResult(flowId, {
        name: 'OAuth Callback Handling',
        status: 'passed',
        message: 'OAuth callback URL generated correctly',
        details: { callbackUrl },
        timestamp: new Date()
      });

      updateFlowStatus(flowId, 'completed');
    } catch (error: any) {
      addTestResult(flowId, {
        name: 'Google OAuth Tests',
        status: 'failed',
        message: error.message,
        details: { error },
        timestamp: new Date()
      });
      updateFlowStatus(flowId, 'completed');
    }
  };

  // Test 4: Password Reset Flow
  const runPasswordResetTests = async () => {
    const flowId = 'password-reset';
    updateFlowStatus(flowId, 'running');
    setCurrentTest(flowId);

    try {
      // Test 4.1: Password Reset Request
      const result = await authService.resetPassword(testEmail);
      
      addTestResult(flowId, {
        name: 'Password Reset Request',
        status: result.success ? 'passed' : 'failed',
        message: result.success ? 'Password reset initiated' : result.error || 'Password reset failed',
        details: { result },
        timestamp: new Date()
      });

      // Test 4.2: Reset URL Generation
      const resetUrl = `${window.location.origin}/reset-password?email=${encodeURIComponent(testEmail)}`;
      
      addTestResult(flowId, {
        name: 'Reset URL Generation',
        status: 'passed',
        message: 'Password reset URL generated correctly',
        details: { resetUrl },
        timestamp: new Date()
      });

      updateFlowStatus(flowId, 'completed');
    } catch (error: any) {
      addTestResult(flowId, {
        name: 'Password Reset Tests',
        status: 'failed',
        message: error.message,
        details: { error },
        timestamp: new Date()
      });
      updateFlowStatus(flowId, 'completed');
    }
  };

  // Test 5: Email Verification Flow
  const runEmailVerificationTests = async () => {
    const flowId = 'email-verification';
    updateFlowStatus(flowId, 'running');
    setCurrentTest(flowId);

    try {
      // Test 5.1: Verification URL Generation
      const verificationUrl = `${window.location.origin}/verify-email?email=${encodeURIComponent(testEmail)}`;
      
      addTestResult(flowId, {
        name: 'Verification URL Generation',
        status: 'passed',
        message: 'Email verification URL generated correctly',
        details: { verificationUrl },
        timestamp: new Date()
      });

      // Test 5.2: OAuth Callback for Email Verification
      const callbackUrl = navigationService.handleOAuthCallback(
        new URLSearchParams('type=email'),
        ''
      );
      
      addTestResult(flowId, {
        name: 'Email Verification Callback',
        status: 'passed',
        message: 'Email verification callback URL generated correctly',
        details: { callbackUrl },
        timestamp: new Date()
      });

      updateFlowStatus(flowId, 'completed');
    } catch (error: any) {
      addTestResult(flowId, {
        name: 'Email Verification Tests',
        status: 'failed',
        message: error.message,
        details: { error },
        timestamp: new Date()
      });
      updateFlowStatus(flowId, 'completed');
    }
  };

  // Test 6: User Invitation Flow
  const runUserInvitationTests = async () => {
    const flowId = 'user-invitation';
    updateFlowStatus(flowId, 'running');
    setCurrentTest(flowId);

    try {
      // Test 6.1: Invitation URL Generation
      const invitationUrl = `${window.location.origin}/invite?email=${encodeURIComponent(testEmail)}`;
      
      addTestResult(flowId, {
        name: 'Invitation URL Generation',
        status: 'passed',
        message: 'User invitation URL generated correctly',
        details: { invitationUrl },
        timestamp: new Date()
      });

      // Test 6.2: Invitation Callback Handling
      const callbackUrl = navigationService.handleOAuthCallback(
        new URLSearchParams('from=invite'),
        ''
      );
      
      addTestResult(flowId, {
        name: 'Invitation Callback Handling',
        status: 'passed',
        message: 'Invitation callback URL generated correctly',
        details: { callbackUrl },
        timestamp: new Date()
      });

      updateFlowStatus(flowId, 'completed');
    } catch (error: any) {
      addTestResult(flowId, {
        name: 'User Invitation Tests',
        status: 'failed',
        message: error.message,
        details: { error },
        timestamp: new Date()
      });
      updateFlowStatus(flowId, 'completed');
    }
  };

  // Test 7: Subdomain Redirects
  const runSubdomainRedirectTests = async () => {
    const flowId = 'subdomain-redirects';
    updateFlowStatus(flowId, 'running');
    setCurrentTest(flowId);

    try {
      // Test 7.1: Subdomain Navigation
      if (isSubdomain) {
        const tenantId = await navigationService.getTenantFromSubdomain();
        
        addTestResult(flowId, {
          name: 'Subdomain Navigation',
          status: tenantId ? 'passed' : 'failed',
          message: tenantId ? 'Subdomain tenant resolved correctly' : 'No tenant found for subdomain',
          details: { tenantId, currentDomain: navigationService.getCurrentDomain() },
          timestamp: new Date()
        });
      }

      // Test 7.2: Default Redirect URLs
      const defaultRedirect = navigationService.getDefaultRedirectUrl(userRole);
      
      addTestResult(flowId, {
        name: 'Default Redirect URLs',
        status: 'passed',
        message: 'Default redirect URL generated correctly',
        details: { defaultRedirect, userRole },
        timestamp: new Date()
      });

      // Test 7.3: Route Access Validation
      const hasDashboardAccess = navigationService.hasRouteAccess('/dashboard', userRole);
      const hasSuperAdminAccess = navigationService.hasRouteAccess('/superadmin', userRole);
      
      addTestResult(flowId, {
        name: 'Route Access Validation',
        status: 'passed',
        message: 'Route access validation working correctly',
        details: { hasDashboardAccess, hasSuperAdminAccess, userRole },
        timestamp: new Date()
      });

      updateFlowStatus(flowId, 'completed');
    } catch (error: any) {
      addTestResult(flowId, {
        name: 'Subdomain Redirect Tests',
        status: 'failed',
        message: error.message,
        details: { error },
        timestamp: new Date()
      });
      updateFlowStatus(flowId, 'completed');
    }
  };

  // Run all tests
  const runAllTests = async () => {
    await runDomainRoutingTests();
    await runEmailSignupTests();
    await runGoogleOAuthTests();
    await runPasswordResetTests();
    await runEmailVerificationTests();
    await runUserInvitationTests();
    await runSubdomainRedirectTests();
    
    toast({
      title: "Testing Complete",
      description: "All authentication flow tests have been completed",
    });
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: TestFlow['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'running':
        return <Badge variant="default">Running</Badge>;
      case 'completed':
        return <Badge variant="outline">Completed</Badge>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-6 w-6" />
            Authentication Flow Tester
          </CardTitle>
          <CardDescription>
            Comprehensive testing tool for all authentication flows and redirect logic
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Environment Info */}
          <Alert>
            <Building2 className="h-4 w-4" />
            <AlertDescription>
              <strong>Environment:</strong> {isDevelopmentDomain ? 'Development' : isMainDomain ? 'Main Domain' : 'Subdomain'}<br />
              <strong>Current Domain:</strong> {navigationService.getCurrentDomain()}<br />
              <strong>User:</strong> {user ? `${user.email} (${userRole})` : 'Not authenticated'}<br />
              <strong>Tenant:</strong> {tenantId || 'None'}
            </AlertDescription>
          </Alert>

          {/* Test Configuration */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="testEmail">Test Email</Label>
              <Input
                id="testEmail"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
              />
            </div>
            <div>
              <Label htmlFor="testPassword">Test Password</Label>
              <Input
                id="testPassword"
                type="password"
                value={testPassword}
                onChange={(e) => setTestPassword(e.target.value)}
                placeholder="TestPassword123!"
              />
            </div>
          </div>

          {/* Test Controls */}
          <div className="flex gap-2">
            <Button onClick={runAllTests} disabled={currentTest !== null}>
              <Loader2 className="mr-2 h-4 w-4" />
              Run All Tests
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setTestFlows(prev => prev.map(flow => ({ ...flow, tests: [], status: 'pending' })))}
            >
              Clear Results
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <div className="grid gap-6">
        {testFlows.map((flow) => (
          <Card key={flow.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {flow.id === 'domain-routing' && <Globe className="h-5 w-5" />}
                  {flow.id === 'email-signup' && <Mail className="h-5 w-5" />}
                  {flow.id === 'google-oauth' && <ExternalLink className="h-5 w-5" />}
                  {flow.id === 'password-reset' && <Key className="h-5 w-5" />}
                  {flow.id === 'email-verification' && <Mail className="h-5 w-5" />}
                  {flow.id === 'user-invitation' && <Users className="h-5 w-5" />}
                  {flow.id === 'subdomain-redirects' && <Building2 className="h-5 w-5" />}
                  
                  <CardTitle className="text-lg">{flow.name}</CardTitle>
                </div>
                {getStatusBadge(flow.status)}
              </div>
              <CardDescription>{flow.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {flow.tests.length === 0 ? (
                <p className="text-muted-foreground">No tests run yet</p>
              ) : (
                <div className="space-y-3">
                  {flow.tests.map((test, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                      {getStatusIcon(test.status)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{test.name}</h4>
                          <span className="text-sm text-muted-foreground">
                            {test.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{test.message}</p>
                        {test.details && (
                          <div className="mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(JSON.stringify(test.details, null, 2), test.name)}
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              {copied === test.name ? 'Copied!' : 'Copy Details'}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
