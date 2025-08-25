import React, { useEffect, useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';
import { PageLoader } from '@/components/PageLoader';
import { 
  CheckCircle, 
  AlertCircle, 
  Settings, 
  Users, 
  Store, 
  CreditCard,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

interface SetupStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
  icon: React.ReactNode;
}

export function TenantSetupCompletion() {
  const { user, tenantId } = useAuth();
  const { businessSettings, isLoading: settingsLoading } = useBusinessSettings();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [setupSteps, setSetupSteps] = useState<SetupStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    checkSetupStatus();
  }, [user, businessSettings, settingsLoading]);

  const checkSetupStatus = async () => {
    if (!user || settingsLoading) {
      setLoading(false);
      return;
    }

    try {
      // Check if tenant has basic setup completed
      const { data: tenant, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single();

      if (error) throw error;

      // Define setup steps
      const steps: SetupStep[] = [
        {
          id: 'business-info',
          title: 'Business Information',
          description: 'Basic business details and contact information',
          completed: !!(businessSettings?.company?.name && businessSettings?.company?.email),
          required: true,
          icon: <Store className="h-5 w-5" />
        },
        {
          id: 'locations',
          title: 'Store Locations',
          description: 'Add your business locations',
          completed: !!(businessSettings?.locations && businessSettings.locations.length > 0),
          required: true,
          icon: <Settings className="h-5 w-5" />
        },
        {
          id: 'payment-methods',
          title: 'Payment Methods',
          description: 'Configure accepted payment methods',
          completed: !!(businessSettings?.pos?.defaultPaymentMethod),
          required: true,
          icon: <CreditCard className="h-5 w-5" />
        },
        {
          id: 'users',
          title: 'Team Members',
          description: 'Invite team members to your workspace',
          completed: false, // Will be checked separately
          required: false,
          icon: <Users className="h-5 w-5" />
        }
      ];

      // Check if users exist
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id')
        .eq('tenant_id', tenantId);

      if (!usersError && users && users.length > 1) {
        steps[3].completed = true;
      }

      setSetupSteps(steps);
      
      // Check if setup is needed
      const incompleteRequiredSteps = steps.filter(step => step.required && !step.completed);
      setShowSetup(incompleteRequiredSteps.length > 0);
      
      // Calculate completion percentage
      const completedSteps = steps.filter(step => step.completed).length;
      const totalSteps = steps.length;
      const completionPercentage = Math.round((completedSteps / totalSteps) * 100);
      
      setCurrentStep(completionPercentage);

    } catch (error) {
      console.error('Error checking setup status:', error);
      toast({
        title: "Setup Check Failed",
        description: "Unable to verify your setup status. Please refresh and try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContinueToDashboard = () => {
            navigate('/admin');
  };

  const handleCompleteSetup = () => {
    navigate('/settings');
  };

  const handleRefresh = () => {
    setLoading(true);
    checkSetupStatus();
  };

  if (loading) {
    return <PageLoader message="Checking your setup..." />;
  }

  // If setup is complete, show dashboard
  if (!showSetup) {
    const TenantAdminDashboard = lazy(() => import('../pages/TenantAdminDashboard'));
    return (
      <div className="min-h-screen bg-background">
        <Suspense fallback={<PageLoader />}>
          <TenantAdminDashboard />
        </Suspense>
      </div>
    );
  }

  // Show setup completion interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Settings className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Complete Your Setup</CardTitle>
          <CardDescription>
            Let's get your business fully configured to start using Vibe POS
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Setup Progress</span>
              <span>{currentStep}% Complete</span>
            </div>
            <Progress value={currentStep} className="h-2" />
          </div>

          {/* Setup Steps */}
          <div className="space-y-4">
            {setupSteps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center p-4 rounded-lg border ${
                  step.completed 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-muted/50 border-border'
                }`}
              >
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  step.completed ? 'bg-green-100' : 'bg-muted'
                }`}>
                  {step.completed ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <div className="text-muted-foreground">
                      {step.icon}
                    </div>
                  )}
                </div>
                
                <div className="ml-4 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{step.title}</h3>
                    {step.required && (
                      <Badge variant="secondary" className="text-xs">Required</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
                
                <div className="flex-shrink-0">
                  {step.completed ? (
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      Complete
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-orange-600 border-orange-200">
                      Pending
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleRefresh}
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Status
            </Button>
            
            <Button
              onClick={handleCompleteSetup}
              className="flex-1"
            >
              Complete Setup
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {/* Skip Option */}
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={handleContinueToDashboard}
              className="text-sm"
            >
              Continue to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TenantSetupCompletion;