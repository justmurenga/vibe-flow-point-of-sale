import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ErrorHandler, ErrorType, ErrorSeverity } from '@/lib/error-handling';
import { LoggingService, LogLevel, LogCategory } from '@/services/LoggingService';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  private logger = LoggingService.getInstance();

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 [ERROR_BOUNDARY] Caught error:', error);
    console.error('🚨 [ERROR_BOUNDARY] Error stack:', error.stack);
    console.error('🚨 [ERROR_BOUNDARY] Component stack:', errorInfo.componentStack);
    console.error('🚨 [ERROR_BOUNDARY] Error info:', errorInfo);

    this.setState({ errorInfo });

    // Log the error
    this.logger.error(LogCategory.SYSTEM, 'React Error Boundary caught error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });

    // Create app error
    const appError = ErrorHandler.createError(
      ErrorType.UNKNOWN,
      error.message,
      'Something went wrong. Please refresh the page and try again.',
      ErrorSeverity.HIGH,
      {
        component: 'ErrorBoundary',
        stack: error.stack,
        componentStack: errorInfo.componentStack
      },
      error
    );

    // Call custom error handler
    this.props.onError?.(error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleReportError = () => {
    if (this.state.error) {
      // In a real app, you might send this to a support system
      this.logger.critical(LogCategory.SYSTEM, 'User reported error', {
        error: this.state.error.message,
        stack: this.state.error.stack,
        componentStack: this.state.errorInfo?.componentStack
      });
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-destructive">Something went wrong</CardTitle>
              <CardDescription>
                An unexpected error occurred. We've been notified and are working to fix it.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  {this.state.error?.message || 'An unknown error occurred'}
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-2">
                <Button onClick={this.handleRetry} className="flex-1">
                  Try Again
                </Button>
                <Button 
                  onClick={this.handleReportError} 
                  variant="outline" 
                  className="flex-1"
                >
                  Report Issue
                </Button>
              </div>
              
              <Button 
                onClick={() => window.location.reload()} 
                variant="ghost" 
                className="w-full"
              >
                Refresh Page
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  return (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
};