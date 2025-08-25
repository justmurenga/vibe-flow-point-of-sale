import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { navigationService } from '@/services/NavigationService';
import { 
  Mail, 
  Link, 
  Copy, 
  ExternalLink, 
  CheckCircle, 
  XCircle,
  Globe,
  Building2
} from 'lucide-react';

interface LinkTest {
  name: string;
  description: string;
  generateUrl: (email: string) => string;
  expectedBehavior: string;
}

export function EmailRedirectLinkTester() {
  const { toast } = useToast();
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [copied, setCopied] = useState<string | null>(null);

  const linkTests: LinkTest[] = [
    {
      name: 'Email Verification Link',
      description: 'Link sent to verify user email address',
      generateUrl: (email: string) => {
        const baseUrl = navigationService.isMainDomain() 
          ? 'https://vibenet.online' 
          : `https://${navigationService.getCurrentDomain()}`;
        return `${baseUrl}/verify-email?email=${encodeURIComponent(email)}`;
      },
      expectedBehavior: 'Should redirect to email verification page with pre-filled email'
    },
    {
      name: 'Password Reset Link',
      description: 'Link sent to reset user password',
      generateUrl: (email: string) => {
        const baseUrl = navigationService.isMainDomain() 
          ? 'https://vibenet.online' 
          : `https://${navigationService.getCurrentDomain()}`;
        return `${baseUrl}/reset-password?email=${encodeURIComponent(email)}`;
      },
      expectedBehavior: 'Should redirect to password reset page with pre-filled email'
    },
    {
      name: 'User Invitation Link',
      description: 'Link sent to invite new users to workspace',
      generateUrl: (email: string) => {
        const baseUrl = navigationService.isMainDomain() 
          ? 'https://vibenet.online' 
          : `https://${navigationService.getCurrentDomain()}`;
        return `${baseUrl}/invite?email=${encodeURIComponent(email)}`;
      },
      expectedBehavior: 'Should redirect to invitation acceptance page with pre-filled email'
    },
    {
      name: 'OAuth Callback Link (Google)',
      description: 'Link for Google OAuth callback after signup',
      generateUrl: (email: string) => {
        const baseUrl = navigationService.isMainDomain() 
          ? 'https://vibenet.online' 
          : `https://${navigationService.getCurrentDomain()}`;
        return `${baseUrl}/auth/callback?type=google&signup=true&email=${encodeURIComponent(email)}`;
      },
      expectedBehavior: 'Should handle Google OAuth callback and create user account'
    },
    {
      name: 'Email Verification Callback',
      description: 'Link for email verification callback',
      generateUrl: (email: string) => {
        const baseUrl = navigationService.isMainDomain() 
          ? 'https://vibenet.online' 
          : `https://${navigationService.getCurrentDomain()}`;
        return `${baseUrl}/auth/callback?type=email&email=${encodeURIComponent(email)}`;
      },
      expectedBehavior: 'Should handle email verification and mark email as verified'
    },
    {
      name: 'Invitation Callback',
      description: 'Link for invitation acceptance callback',
      generateUrl: (email: string) => {
        const baseUrl = navigationService.isMainDomain() 
          ? 'https://vibenet.online' 
          : `https://${navigationService.getCurrentDomain()}`;
        return `${baseUrl}/auth/callback?from=invite&email=${encodeURIComponent(email)}`;
      },
      expectedBehavior: 'Should handle invitation acceptance and add user to workspace'
    }
  ];

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const testLink = (url: string) => {
    window.open(url, '_blank');
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const getDomainInfo = () => {
    const currentDomain = navigationService.getCurrentDomain();
    const isMain = navigationService.isMainDomain();
    const isSub = navigationService.isSubdomain();
    const isDev = navigationService.isDevelopmentDomain();

    return {
      currentDomain,
      isMain,
      isSub,
      isDev,
      type: isDev ? 'Development' : isMain ? 'Main Domain' : 'Subdomain'
    };
  };

  const domainInfo = getDomainInfo();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-6 w-6" />
            Email Redirect Link Tester
          </CardTitle>
          <CardDescription>
            Test and validate all email redirect links for proper domain handling and functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Environment Info */}
          <Alert>
            <Globe className="h-4 w-4" />
            <AlertDescription>
              <strong>Current Environment:</strong> {domainInfo.type}<br />
              <strong>Domain:</strong> {domainInfo.currentDomain}<br />
              <strong>Main Domain:</strong> {domainInfo.isMain ? 'Yes' : 'No'}<br />
              <strong>Subdomain:</strong> {domainInfo.isSub ? 'Yes' : 'No'}<br />
              <strong>Development:</strong> {domainInfo.isDev ? 'Yes' : 'No'}
            </AlertDescription>
          </Alert>

          {/* Test Email Input */}
          <div>
            <Label htmlFor="testEmail">Test Email Address</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="testEmail"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
                className="flex-1"
              />
              <Button 
                variant="outline"
                onClick={() => setTestEmail('test@example.com')}
              >
                Reset
              </Button>
            </div>
            {!validateEmail(testEmail) && (
              <p className="text-sm text-red-500 mt-1">Please enter a valid email address</p>
            )}
          </div>

          {/* Link Tests */}
          <div className="space-y-4">
            {linkTests.map((test, index) => {
              const generatedUrl = test.generateUrl(testEmail);
              const isValidEmail = validateEmail(testEmail);
              
              return (
                <Card key={index} className="border-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Link className="h-5 w-5" />
                        <CardTitle className="text-lg">{test.name}</CardTitle>
                      </div>
                      <Badge variant={isValidEmail ? "default" : "secondary"}>
                        {isValidEmail ? "Ready" : "Invalid Email"}
                      </Badge>
                    </div>
                    <CardDescription>{test.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Expected Behavior:</Label>
                      <p className="text-sm text-muted-foreground mt-1">{test.expectedBehavior}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Generated URL:</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={generatedUrl}
                          readOnly
                          className="flex-1 font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(generatedUrl, test.name)}
                          disabled={!isValidEmail}
                        >
                          <Copy className="h-4 w-4" />
                          {copied === test.name ? 'Copied!' : 'Copy'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testLink(generatedUrl)}
                          disabled={!isValidEmail}
                        >
                          <ExternalLink className="h-4 w-4" />
                          Test
                        </Button>
                      </div>
                    </div>

                    {/* URL Analysis */}
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-xs font-medium">URL Analysis:</Label>
                        <div className="mt-1 space-y-1">
                          <div className="flex items-center gap-2">
                            {generatedUrl.startsWith('https://') ? (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            ) : (
                              <XCircle className="h-3 w-3 text-red-500" />
                            )}
                            <span>HTTPS Protocol</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {generatedUrl.includes('email=') ? (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            ) : (
                              <XCircle className="h-3 w-3 text-red-500" />
                            )}
                            <span>Email Parameter</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {generatedUrl.includes(encodeURIComponent(testEmail)) ? (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            ) : (
                              <XCircle className="h-3 w-3 text-red-500" />
                            )}
                            <span>Email Encoded</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-xs font-medium">Domain Handling:</Label>
                        <div className="mt-1 space-y-1">
                          <div className="flex items-center gap-2">
                            {domainInfo.isMain ? (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            ) : (
                              <XCircle className="h-3 w-3 text-red-500" />
                            )}
                            <span>Main Domain Detection</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {domainInfo.isSub ? (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            ) : (
                              <XCircle className="h-3 w-3 text-red-500" />
                            )}
                            <span>Subdomain Detection</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {generatedUrl.includes(domainInfo.currentDomain) || domainInfo.isMain ? (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            ) : (
                              <XCircle className="h-3 w-3 text-red-500" />
                            )}
                            <span>Correct Domain</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    const allUrls = linkTests.map(test => test.generateUrl(testEmail)).join('\n\n');
                    copyToClipboard(allUrls, 'All URLs');
                  }}
                  disabled={!validateEmail(testEmail)}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy All URLs
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    linkTests.forEach(test => {
                      setTimeout(() => {
                        testLink(test.generateUrl(testEmail));
                      }, Math.random() * 1000);
                    });
                  }}
                  disabled={!validateEmail(testEmail)}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Test All Links
                </Button>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
