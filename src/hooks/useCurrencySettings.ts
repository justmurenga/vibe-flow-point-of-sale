import * as React from 'react';
import { getCurrencySettings, formatCurrencySync, clearCurrencyCache } from '@/lib/currency';

interface CurrencySettings {
  currency_code: string;
  currency_symbol: string;
}

/**
 * React hook to get currency settings
 */
export function useCurrencySettings() {
  const [settings, setSettings] = React.useState<CurrencySettings>({ 
    currency_code: 'USD', 
    currency_symbol: '$' 
  });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getCurrencySettings().then(settings => {
      setSettings(settings);
      setLoading(false);
    });
  }, []);

  const formatAmount = React.useCallback((amount: number) => {
    return formatCurrencySync(amount, settings.currency_code, settings.currency_symbol);
  }, [settings]);

  const refreshSettings = React.useCallback(async () => {
    clearCurrencyCache();
    const newSettings = await getCurrencySettings();
    setSettings(newSettings);
  }, []);

  return { settings, loading, formatAmount, refreshSettings };
}
