import { supabase } from '@/integrations/supabase/client';

export interface PaymentMethodValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export const validatePaymentMethodAccountMapping = async (tenantId: string): Promise<PaymentMethodValidation> => {
  const result: PaymentMethodValidation = {
    isValid: true,
    errors: [],
    warnings: []
  };

  try {
    // Get all active payment methods
    const { data: paymentMethods, error: pmError } = await supabase
      .from('payment_methods')
      .select('id, name, type, account_id, is_active')
      .eq('tenant_id', tenantId)
      .eq('is_active', true);

    if (pmError) {
      result.isValid = false;
      result.errors.push('Failed to fetch payment methods');
      return result;
    }

    if (!paymentMethods || paymentMethods.length === 0) {
      result.warnings.push('No payment methods configured');
      return result;
    }

    // Check each payment method for account mapping
    for (const method of paymentMethods) {
      if (!method.account_id) {
        result.isValid = false;
        result.errors.push(`Payment method "${method.name}" (${method.type}) has no asset account assigned`);
      } else {
        // Verify the account exists and is an asset account
        const { data: account, error: accountError } = await supabase
          .from('accounts')
          .select(`
            id, 
            name, 
            code, 
            is_active,
            account_types!inner(category)
          `)
          .eq('id', method.account_id)
          .eq('tenant_id', tenantId)
          .single();

        if (accountError || !account) {
          result.isValid = false;
          result.errors.push(`Payment method "${method.name}" references non-existent account`);
        } else if (!account.is_active) {
          result.warnings.push(`Payment method "${method.name}" references inactive account "${account.name}"`);
        } else if (account.account_types.category !== 'assets') {
          result.isValid = false;
          result.errors.push(`Payment method "${method.name}" references non-asset account "${account.name}" (${account.account_types.category})`);
        }
      }
    }

  } catch (error) {
    console.error('Error validating payment method account mapping:', error);
    result.isValid = false;
    result.errors.push('Failed to validate payment method account mapping');
  }

  return result;
};
