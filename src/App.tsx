import React, { Suspense } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { TabStabilityProvider } from '@/components/TabStabilityProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppProvider } from '@/contexts/AppContext';
import { DomainProvider } from '@/lib/domain-manager';
import { UnifiedRouter } from '@/components/UnifiedRouter';
import { PageLoader } from '@/components/PageLoader';
import { ErrorHandler, ErrorType, ErrorSeverity } from '@/lib/error-handling';
import { LoggingService, LogLevel, LogCategory } from '@/services/LoggingService';
import { useEffect } from 'react';

// Configure React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
    },
    mutations: {
      retry: 1, // Limit mutation retries
    },
  },
});

const App = () => {
  const logger = LoggingService.getInstance();

  useEffect(() => {
    // Initialize logging
    logger.info(LogCategory.SYSTEM, 'Application started', {
      version: process.env.REACT_APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV
    });

    // Cleanup on unmount
    return () => {
      logger.info(LogCategory.SYSTEM, 'Application shutting down');
      logger.destroy();
    };
  }, [logger]);

  return (
    <ErrorBoundary>
      <TabStabilityProvider>
        <QueryClientProvider client={queryClient}>
          <Router>
            <AuthProvider>
              <DomainProvider>
                <Suspense fallback={<PageLoader />}>
                  <UnifiedRouter />
                </Suspense>
              </DomainProvider>
            </AuthProvider>
          </Router>
        </QueryClientProvider>
      </TabStabilityProvider>
    </ErrorBoundary>
  );
};

export default App;