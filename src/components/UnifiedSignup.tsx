import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { authService, SignupData } from '@/services/AuthService';
import { Loader2, Building2, User, Mail, Lock, Globe, Phone } from 'lucide-react';

interface UnifiedSignupProps {
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
  mode?: 'trial' | 'invitation' | 'regular';
  defaultPlan?: string;
}

export function UnifiedSignup({ 
  onSuccess, 
  onError, 
  mode = 'trial',
  defaultPlan 
}: UnifiedSignupProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'verification' | 'success'>('form');
  const [isGoogleUser, setIsGoogleUser] = useState(false);

  const [formData, setFormData] = useState<SignupData>({
    email: '',
    password: '',
    fullName: '',
    businessName: '',
    businessType: 'retail',
    country: 'Kenya',
    currency: 'KES',
    timezone: 'Africa/Nairobi',
    phone: '',
    isGoogleUser: false
  });

  const handleInputChange = (field: keyof SignupData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.email || !formData.fullName || !formData.businessName) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return false;
    }

    if (!isGoogleUser && !formData.password) {
      toast({
        title: "Validation Error",
        description: "Password is required for email signup",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const result = await authService.signup({
        ...formData,
        isGoogleUser: false
      });

      if (result.success) {
        if (result.requiresVerification) {
          setStep('verification');
          toast({
            title: "Verification Required",
            description: "Please check your email to verify your account",
          });
        } else {
          setStep('success');
          toast({
            title: "Welcome to VibePOS!",
            description: "Your account has been created successfully",
          });
          onSuccess?.(result);
        }
      } else {
        toast({
          title: "Signup Failed",
          description: result.error || "Failed to create account",
          variant: "destructive"
        });
        onError?.(result.error || "Failed to create account");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
      onError?.(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsGoogleUser(true);
    setLoading(true);
    
    try {
      const result = await authService.signup({
        ...formData,
        isGoogleUser: true
      });

      if (result.success) {
        // Google OAuth will handle the redirect
        console.log('Google OAuth initiated');
      } else {
        toast({
          title: "Google Signup Failed",
          description: result.error || "Failed to initiate Google signup",
          variant: "destructive"
        });
        onError?.(result.error || "Failed to initiate Google signup");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
      onError?.(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'verification') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Check Your Email</CardTitle>
          <CardDescription>
            We've sent a verification link to {formData.email}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              Click the link in your email to verify your account and complete setup.
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setStep('form')}
            className="w-full"
          >
            Back to Signup
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === 'success') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Welcome to VibePOS!</CardTitle>
          <CardDescription>
            Your account has been created successfully
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <Building2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <p className="text-sm text-muted-foreground">
              You can now sign in to access your dashboard.
            </p>
          </div>
          <Button 
            onClick={() => navigate('/auth')}
            className="w-full"
          >
            Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Create Your Account</CardTitle>
        <CardDescription>
          {mode === 'trial' ? 'Start your 14-day free trial' : 'Join VibePOS'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Google Sign In */}
        <GoogleSignInButton
          onSuccess={handleGoogleSignup}
          onError={(error) => {
            toast({
              title: "Google Sign In Failed",
              description: error,
              variant: "destructive"
            });
          }}
          buttonText="Continue with Google"
        />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with email
            </span>
          </div>
        </div>

        {/* Email Signup Form */}
        <form onSubmit={handleEmailSignup} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.fullName.split(' ')[0] || ''}
                onChange={(e) => {
                  const firstName = e.target.value;
                  const lastName = formData.fullName.split(' ').slice(1).join(' ') || '';
                  handleInputChange('fullName', `${firstName} ${lastName}`.trim());
                }}
                placeholder="John"
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.fullName.split(' ').slice(1).join(' ') || ''}
                onChange={(e) => {
                  const firstName = formData.fullName.split(' ')[0] || '';
                  const lastName = e.target.value;
                  handleInputChange('fullName', `${firstName} ${lastName}`.trim());
                }}
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="john@example.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="businessName">Business Name *</Label>
            <Input
              id="businessName"
              value={formData.businessName}
              onChange={(e) => handleInputChange('businessName', e.target.value)}
              placeholder="My Business"
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="Create a strong password"
              required
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="+254 700 000 000"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Button 
            variant="link" 
            className="p-0 h-auto font-normal"
            onClick={() => navigate('/auth')}
          >
            Sign in
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
