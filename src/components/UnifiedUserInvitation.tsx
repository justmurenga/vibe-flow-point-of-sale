import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/services/AuthService';
import { Loader2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

export function UnifiedUserInvitation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'success'>('form');
  
  // Form data
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    password: '',
    confirmPassword: ''
  });
  
  // Error states
  const [emailError, setEmailError] = useState('');
  const [fullNameError, setFullNameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // Pre-fill email from URL params
  React.useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setFormData(prev => ({ ...prev, email: emailParam }));
    }
  }, [searchParams]);

  const validateEmail = (email: string): string => {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return '';
  };

  const validateFullName = (fullName: string): string => {
    if (!fullName) return 'Full name is required';
    if (fullName.length < 2) return 'Full name must be at least 2 characters';
    return '';
  };

  const validatePassword = (password: string): string => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/(?=.*[a-z])/.test(password)) return 'Password must contain at least one lowercase letter';
    if (!/(?=.*[A-Z])/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/(?=.*\d)/.test(password)) return 'Password must contain at least one number';
    return '';
  };

  const validateConfirmPassword = (confirmPassword: string): string => {
    if (!confirmPassword) return 'Please confirm your password';
    if (confirmPassword !== formData.password) return 'Passwords do not match';
    return '';
  };

  const handleAcceptInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setEmailError('');
    setFullNameError('');
    setPasswordError('');
    setConfirmPasswordError('');

    // Validate all fields
    const emailValidation = validateEmail(formData.email);
    const fullNameValidation = validateFullName(formData.fullName);
    const passwordValidation = validatePassword(formData.password);
    const confirmPasswordValidation = validateConfirmPassword(formData.confirmPassword);

    if (emailValidation) {
      setEmailError(emailValidation);
      return;
    }

    if (fullNameValidation) {
      setFullNameError(fullNameValidation);
      return;
    }

    if (passwordValidation) {
      setPasswordError(passwordValidation);
      return;
    }

    if (confirmPasswordValidation) {
      setConfirmPasswordError(confirmPasswordValidation);
      return;
    }

    setLoading(true);

    try {
      // Accept invitation and create account
      const result = await authService.acceptInvitation({
        email: formData.email,
        fullName: formData.fullName,
        password: formData.password
      });
      
      if (result.success) {
        setStep('success');
        toast({
          title: "Welcome to the Team!",
          description: "Your account has been created successfully",
        });

        setTimeout(() => {
          navigate('/admin');
        }, 3000);
      } else {
        toast({
          title: "Invitation Failed",
          description: result.error || "Failed to accept invitation",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Accept invitation error:', error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Success step
  if (step === 'success') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Welcome to the Team!</CardTitle>
          <CardDescription>
            Your account has been created successfully
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <p className="text-sm text-muted-foreground">
              You can now access your workspace.
            </p>
          </div>
          
          <Button 
            onClick={() => navigate('/admin')}
            className="w-full"
          >
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Form step
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/auth')}
          className="absolute left-4 top-4"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <CardTitle>Accept Invitation</CardTitle>
        <CardDescription>
          Complete your account setup to join the workspace
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleAcceptInvitation} className="space-y-4">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Enter your email"
              required
              disabled
            />
            {emailError && <p className="text-sm text-red-500 mt-1">{emailError}</p>}
          </div>

          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
              placeholder="Enter your full name"
              required
            />
            {fullNameError && <p className="text-sm text-red-500 mt-1">{fullNameError}</p>}
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Create a strong password"
              required
            />
            {passwordError && <p className="text-sm text-red-500 mt-1">{passwordError}</p>}
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              placeholder="Confirm your password"
              required
            />
            {confirmPasswordError && <p className="text-sm text-red-500 mt-1">{confirmPasswordError}</p>}
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
              'Accept Invitation'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
