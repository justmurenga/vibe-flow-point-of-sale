import * as React from 'react';
import { domainManager } from '@/lib/domain-manager';

console.log(' [DOMAIN] useDomainContext module loading...');
console.log('🌐 [DOMAIN] React object:', React);
console.log(' [DOMAIN] React.useState available:', typeof React.useState);

interface DomainConfig {
  tenantId: string | null;
  domain: string;
  isCustomDomain: boolean;
  isSubdomain: boolean;
}

// Global state variables
let globalDomainConfig: DomainConfig | null = null;
let globalLoading = true;
let globalInitialized = false;
let globalPromise: Promise<DomainConfig> | null = null;

export function useDomainContext() {
  console.log(' [DOMAIN] useDomainContext hook called');
  
  try {
    const [domainConfig, setDomainConfig] = React.useState<DomainConfig | null>(globalDomainConfig);
    const [loading, setLoading] = React.useState(globalLoading);
    const [initialized, setInitialized] = React.useState(globalInitialized);

    console.log('✅ [DOMAIN] useState hooks initialized successfully');

    React.useEffect(() => {
      // If already initialized globally, use the cached result
      if (globalInitialized && globalDomainConfig) {
        setDomainConfig(globalDomainConfig);
        setLoading(false);
        setInitialized(true);
        return;
      }

      // If initialization is in progress, wait for it
      if (globalPromise) {
        globalPromise.then((config) => {
          setDomainConfig(config);
          setLoading(false);
          setInitialized(true);
        }).catch((error) => {
          console.error('Domain initialization failed:', error);
          const fallbackConfig: DomainConfig = {
            tenantId: null,
            domain: window.location.hostname,
            isCustomDomain: false,
            isSubdomain: false
          };
          setDomainConfig(fallbackConfig);
          setLoading(false);
          setInitialized(true);
        });
        return;
      }

      // Start initialization
      const initializeDomain = async (): Promise<DomainConfig> => {
        console.log('🌐 Initializing domain context for:', window.location.hostname);
        
        const config = await domainManager.getInstance().getCurrentDomainConfig();
        console.log('🔍 Domain config resolved:', config);
        
        // Set up tenant context if needed
        if (config?.isSubdomain && config.tenantId) {
          console.log('🏢 Setting up tenant context for:', config.tenantId);
          try {
            await domainManager.getInstance().setupTenantContext(config.tenantId);
          } catch (error) {
            console.warn('⚠️ Tenant context setup failed:', error);
          }
        }
        
        // Update global state
        globalDomainConfig = config;
        globalLoading = false;
        globalInitialized = true;
        
        return config;
      };

      // Create and store the promise
      globalPromise = initializeDomain();
      
      globalPromise.then((config) => {
        setDomainConfig(config);
        setLoading(false);
        setInitialized(true);
      }).catch((error) => {
        console.error('Domain initialization failed:', error);
        const fallbackConfig: DomainConfig = {
          tenantId: null,
          domain: window.location.hostname,
          isCustomDomain: false,
          isSubdomain: false
        };
        globalDomainConfig = fallbackConfig;
        globalLoading = false;
        globalInitialized = true;
        
        setDomainConfig(fallbackConfig);
        setLoading(false);
        setInitialized(true);
      });

    }, []); // Empty dependency array - only run once

    return {
      domainConfig,
      loading,
      refreshConfig: async () => {
        // Reset global state for refresh
        globalDomainConfig = null;
        globalLoading = true;
        globalInitialized = false;
        globalPromise = null;
        
        setLoading(true);
        const config = await domainManager.getInstance().getCurrentDomainConfig();
        
        globalDomainConfig = config;
        globalLoading = false;
        globalInitialized = true;
        
        setDomainConfig(config);
        setLoading(false);
      }
    };
  } catch (error) {
    console.error('❌ [DOMAIN] Error in useDomainContext:', error);
    throw error;
  }
}
