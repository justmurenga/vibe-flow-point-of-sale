import { useState, useEffect } from 'react';
import { tabStabilityManager } from '@/lib/tab-stability-manager';

export function useTabStability() {
  const [, forceUpdate] = useState({});
  
  useEffect(() => {
    // Initialize on first use
    tabStabilityManager.initialize();
    
    // Listen for state changes
    const cleanup = tabStabilityManager.onStateChange(() => {
      forceUpdate({});
    });
    
    return cleanup;
  }, []);

  return {
    shouldPreventAuthRefresh: tabStabilityManager.shouldPreventAuthRefresh(),
    shouldPreventQueryRefresh: tabStabilityManager.shouldPreventQueryRefresh(),
    isTabSwitching: tabStabilityManager.isCurrentlyTabSwitching(),
    forceReset: tabStabilityManager.forceReset,
    getState: tabStabilityManager.getState,
  };
}
