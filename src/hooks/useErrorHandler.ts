import { useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { ErrorHandler, ErrorType, ErrorSeverity, ErrorContext, AppError } from '@/lib/error-handling';

export function useErrorHandler() {
  const handleError = useCallback((error: any, context: Partial<ErrorContext> = {}) => {
    let appError: AppError;

    if (error?.code) {
      // Supabase error
      appError = ErrorHandler.handleSupabaseError(error, context);
    } else if (error?.message?.includes('auth') || error?.message?.includes('login')) {
      // Auth error
      appError = ErrorHandler.handleAuthError(error, context);
    } else {
      // Generic error
      appError = ErrorHandler.createError(
        ErrorType.UNKNOWN,
        error?.message || 'Unknown error',
        'An unexpected error occurred. Please try again.',
        ErrorSeverity.MEDIUM,
        context,
        error
      );
    }

    ErrorHandler.showErrorToast(appError);
    return appError;
  }, []);

  const handleAsyncError = useCallback(async <T>(
    promise: Promise<T>,
    context: Partial<ErrorContext> = {}
  ): Promise<T | null> => {
    try {
      return await promise;
    } catch (error) {
      handleError(error, context);
      return null;
    }
  }, [handleError]);

  return { handleError, handleAsyncError };
}
