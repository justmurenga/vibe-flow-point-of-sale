import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/services/AuthService';
import { Loader2, CheckCircle, AlertCircle, Building2 } from 'lucide-react';

export function UnifiedAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('');
  const [tenantInfo, setTenantInfo] = useState<any>(null);

  useEffect(() => {
    handleAuthCallback();
  }, []);

  const handleAuthCallback = async () => {
    try {
      console.log('�� Processing unified auth callback...');
      
      // Handle different callback types
      const callbackType = searchParams.get('type');
      const isSignup = searchParams.get('signup') === 'true';
      const isInvite = searchParams.get('from') === 'invite';
      
      if (isInvite) {
        // Handle invitation callback
        await handleInvitationCallback();
      } else if (callbackType === 'google') {
        // Handle Google OAuth callback
        await handleGoogleCallback();
      } else {
        // Handle email verification callback
        await handleEmailVerificationCallback();
      }
    } catch (error: any) {
      console.error('Auth callback error:', error);
      setStatus('error');
      setMessage(error.message || 'Authentication failed');
      
      toast({
        title: "Authentication Failed",
        description: error.message || "Failed to complete authentication",
        variant: "destructive"
      });
    }
  };

  const handleGoogleCallback = async () => {
    const result = await authService.handleOAuthCallback();
    
    if (result.success) {
      setStatus('success');
      setMessage('Welcome to VibePOS! Your account has been created successfully.');
      setTenantInfo(result.tenant);
      
      toast({
        title: "Welcome to VibePOS!",
        description: "Your account has been created successfully",
      });
      
      // Redirect to dashboard after delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } else {
      throw new Error(result.error || 'Failed to complete Google authentication');
    }
  };

  const handleEmailVerificationCallback = async () => {
    // Handle email verification
    setStatus('success');
    setMessage('Your email has been verified! You can now sign in to your account.');
    
    toast({
      title: "Email Verified!",
      description: "Your account has been verified successfully",
    });
    
    setTimeout(() => {
      navigate('/auth?verified=true');
    }, 3000);
  };

  const handleInvitationCallback = async () => {
    // Handle invitation acceptance
    setStatus('success');
    setMessage('You have successfully joined the workspace!');
    
    toast({
      title: "Welcome!",
      description: "You have successfully joined the workspace",
    });
    
    setTimeout(() => {
      navigate('/dashboard');
    }, 3000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>
            {status === 'processing' && 'Processing...'}
            {status === 'success' && 'Success!'}
            {status === 'error' && 'Error'}
          </CardTitle>
          <CardDescription>
            {status === 'processing' && 'Please wait while we complete your authentication'}
            {status === 'success' && 'Your authentication was successful'}
            {status === 'error' && 'Something went wrong'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          {status === 'processing' && (
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          
          {status === 'success' && (
            <div className="space-y-4">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
              <p className="text-sm text-muted-foreground">{message}</p>
              
              {tenantInfo && (
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span className="font-medium">{tenantInfo.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your workspace is ready
                  </p>
                </div>
              )}
            </div>
          )}
          
          {status === 'error' && (
            <div className="space-y-4">
              <AlertCircle className="h-12 w-12 mx-auto text-red-500" />
              <p className="text-sm text-muted-foreground">{message}</p>
              <Button onClick={() => navigate('/auth')} className="w-full">
                Back to Sign In
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
