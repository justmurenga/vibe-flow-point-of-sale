import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';
import { useToast } from '@/hooks/use-toast';

export interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
  requires_reference: boolean;
  display_order: number;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export const usePaymentMethods = () => {
  const { tenantId } = useAuth();
  const { pos } = useBusinessSettings();
  const { toast } = useToast();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch payment methods from database
  const fetchPaymentMethods = async () => {
    if (!tenantId) {
      setPaymentMethods([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setPaymentMethods(data);
      } else {
        // Use fallback methods based on business settings
        const fallbackMethods = getFallbackPaymentMethods(pos.defaultPaymentMethod);
        setPaymentMethods(fallbackMethods);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      setError('Failed to load payment methods');
      
      // Use fallback methods
      const fallbackMethods = getFallbackPaymentMethods(pos.defaultPaymentMethod);
      setPaymentMethods(fallbackMethods);
      
      toast({
        title: "Warning",
        description: "Could not load payment methods. Using defaults.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get fallback payment methods based on business settings
  const getFallbackPaymentMethods = (defaultMethod: string): PaymentMethod[] => {
    const baseMethods = [
      { 
        id: 'default-cash', 
        name: 'Cash', 
        type: 'cash', 
        is_active: true, 
        requires_reference: false, 
        display_order: 1,
        tenant_id: tenantId || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      { 
        id: 'default-card', 
        name: 'Card', 
        type: 'card', 
        is_active: true, 
        requires_reference: true, 
        display_order: 2,
        tenant_id: tenantId || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      { 
        id: 'default-credit', 
        name: 'Credit Sale', 
        type: 'credit', 
        is_active: true, 
        requires_reference: true, 
        display_order: 3,
        tenant_id: tenantId || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    // Reorder based on default payment method
    if (defaultMethod && defaultMethod !== 'cash') {
      const defaultMethodIndex = baseMethods.findIndex(m => m.type === defaultMethod);
      if (defaultMethodIndex > 0) {
        const defaultMethodItem = baseMethods.splice(defaultMethodIndex, 1)[0];
        baseMethods.unshift(defaultMethodItem);
        // Update display order
        baseMethods.forEach((method, index) => {
          method.display_order = index + 1;
        });
      }
    }

    return baseMethods;
  };

  // Get default payment method
  const getDefaultPaymentMethod = (): PaymentMethod | null => {
    if (paymentMethods.length === 0) return null;
    
    // First try to find the method matching business settings default
    const defaultMethod = paymentMethods.find(m => m.type === pos.defaultPaymentMethod);
    if (defaultMethod) return defaultMethod;
    
    // Fallback to first available method
    return paymentMethods[0];
  };

  // Filter payment methods for specific use cases
  const getPaymentMethodsForSales = () => {
    return paymentMethods; // All methods for sales
  };

  const getPaymentMethodsForPurchases = () => {
    return paymentMethods.filter(m => m.type !== 'credit'); // Exclude credit for purchases
  };

  const getPaymentMethodsForAccounting = () => {
    return paymentMethods.filter(m => m.is_active); // Only active methods
  };

  // Refresh payment methods
  const refreshPaymentMethods = () => {
    fetchPaymentMethods();
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, [tenantId]);

  return {
    paymentMethods,
    isLoading,
    error,
    getDefaultPaymentMethod,
    getPaymentMethodsForSales,
    getPaymentMethodsForPurchases,
    getPaymentMethodsForAccounting,
    refreshPaymentMethods,
    fetchPaymentMethods
  };
};
