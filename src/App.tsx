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