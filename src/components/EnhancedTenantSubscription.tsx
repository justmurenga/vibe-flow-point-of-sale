import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUnifiedBilling } from '@/hooks/useUnifiedBilling';
import { useCurrencyConversion } from '@/hooks/useCurrencyConversion';
import { useCurrencyUpdate } from '@/hooks/useCurrencyUpdate';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';
import { useToast } from '@/hooks/use-toast';
import { unifiedBillingService } from '@/lib/unified-billing-service';
import { supabase } from '@/integrations/supabase/client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Loader2,
  ExternalLink,
  DollarSign,
  Percent,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  Settings,
  Users,
  Zap,
  Shield,
  Star,
  Plus
} from 'lucide-react';

interface TenantSubscriptionProps {
  tenantId: string;
  tenantName: string;
  onSubscriptionUpdated?: () => void;
}

interface Feature {
  name: string;
  included: boolean;
  limit?: string | number;
  description?: string;
}

interface BillingPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  badge: string;
  badge_color: string;
  features: Feature[];
  description?: string;
  annual_discount_percentage?: number;
  annual_discount_months?: number;
}

interface CustomPricing {
  id: string;
  custom_amount: number;
  original_amount: number;
  discount_percentage?: number;
  reason?: string;
  setup_fee?: number;
  effective_date: string;
  expires_at?: string;
  is_active: boolean;
}

export default function EnhancedTenantSubscription({ 
  tenantId, 
  tenantName, 
  onSubscriptionUpdated 
}: TenantSubscriptionProps) {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const { formatPrice, currencyCode } = useCurrencyUpdate();
  const { convertFromKES } = useCurrencyConversion();
  const { currency } = useBusinessSettings();

  // Unified billing state
  const {
    subscription: currentSubscription,
    billingPlans,
    effectivePricing,
    loading,
    upgrading,
    handleUpgrade,
    syncSubscriptionStatus
  } = useUnifiedBilling();

  // Local state
  const [selectedPlan, setSelectedPlan] = useState<BillingPlan | null>(null);
  const [customPricing, setCustomPricing] = useState<CustomPricing | null>(null);
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [customPricingDialogOpen, setCustomPricingDialogOpen] = useState(false);
  const [manualPaymentDialogOpen, setManualPaymentDialogOpen] = useState(false);
  const [savingManualPayment, setSavingManualPayment] = useState(false);
  const [convertedPrices, setConvertedPrices] = useState<Map<string, number>>(new Map());

  // Manual payment state
  const [manualPayment, setManualPayment] = useState({
    amount: '',
    currency: currencyCode,
    paymentDate: new Date().toISOString().split('T')[0],
    method: 'manual',
    reference: '',
    planId: '',
    notes: '',
    email: ''
  });

  // Custom pricing state
  const [newCustomPricing, setNewCustomPricing] = useState({
    custom_amount: '',
    discount_percentage: '',
    reason: '',
    setup_fee: '',
    effective_date: new Date().toISOString().split('T')[0],
    expires_at: ''
  });

  // Check if user has admin permissions
  const hasAdminAccess = userRole === 'superadmin' || userRole === 'admin';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Enhanced Subscription Management
          </CardTitle>
          <CardDescription>
            Unified billing system for {tenantName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Enhanced subscription component will be implemented here...</p>
        </CardContent>
      </Card>
    </div>
  );
}
