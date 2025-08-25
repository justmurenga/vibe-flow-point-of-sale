import { toast } from '@/hooks/use-toast';
import { useCallback } from 'react';

// Error types
export enum ErrorType {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  NETWORK = 'NETWORK',
  DATABASE = 'DATABASE',
  EMAIL = 'EMAIL',
  OTP = 'OTP',
  TENANT = 'TENANT',
  INVITATION = 'INVITATION',
  SUBSCRIPTION = 'SUBSCRIPTION',
  RATE_LIMIT = 'RATE_LIMIT',
  UNKNOWN = 'UNKNOWN'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface ErrorContext {
  userId?: string;
  tenantId?: string;
  action?: string;
  component?: string;
  timestamp: string;
  userAgent?: string;
  url?: string;
  method?: string;
  requestId?: string;
}

export interface AppError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  code?: string;
  context: ErrorContext;
  originalError?: any;
  stack?: string;
}

// Error logger
export class ErrorLogger {
  private static instance: ErrorLogger;
  private errors: AppError[] = [];
  private maxErrors = 100;

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  log(error: AppError): void {
    // Add to local storage
    this.errors.unshift(error);
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Log to console with appropriate level
    const logMessage = this.formatLogMessage(error);
    
    switch (error.severity) {
      case ErrorSeverity.LOW:
        console.warn(logMessage);
        break;
      case ErrorSeverity.MEDIUM:
        console.error(logMessage);
        break;
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        console.error('🚨 CRITICAL ERROR:', logMessage);
        break;
    }

    // Send to external logging service (if configured)
    this.sendToExternalService(error);
  }

  private formatLogMessage(error: AppError): string {
    return `[${error.type}] ${error.message} | Context: ${JSON.stringify(error.context)}`;
  }

  private async sendToExternalService(error: AppError): Promise<void> {
    // In production, send to external logging service
    if (process.env.NODE_ENV === 'production') {
      try {
        // Send to Supabase for logging
        const { supabase } = await import('@/integrations/supabase/client');
        await supabase.from('error_logs').insert({
          error_type: error.type,
          severity: error.severity,
          message: error.message,
          user_message: error.userMessage,
          error_code: error.code,
          context: error.context,
          stack_trace: error.stack,
          created_at: new Date().toISOString()
        });
      } catch (logError) {
        console.error('Failed to log error to external service:', logError);
      }
    }
  }

  getErrors(): AppError[] {
    return [...this.errors];
  }

  clearErrors(): void {
    this.errors = [];
  }
}

// Error handler
export class ErrorHandler {
  private static logger = ErrorLogger.getInstance();

  static createError(
    type: ErrorType,
    message: string,
    userMessage: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context: Partial<ErrorContext> = {},
    originalError?: any
  ): AppError {
    const error: AppError = {
      type,
      severity,
      message,
      userMessage,
      context: {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        ...context
      },
      originalError,
      stack: originalError?.stack
    };

    this.logger.log(error);
    return error;
  }

  static handleSupabaseError(supabaseError: any, context: Partial<ErrorContext> = {}): AppError {
    const errorCode = supabaseError?.code;
    const errorMessage = supabaseError?.message || 'Unknown Supabase error';

    // Map Supabase errors to our error types
    let type = ErrorType.UNKNOWN;
    let severity = ErrorSeverity.MEDIUM;
    let userMessage = 'An error occurred. Please try again.';

    switch (errorCode) {
      case 'PGRST301':
        type = ErrorType.AUTHENTICATION;
        userMessage = 'Your session has expired. Please log in again.';
        break;
      case '42501':
        type = ErrorType.AUTHORIZATION;
        userMessage = 'You don\'t have permission to perform this action.';
        break;
      case '23505':
        type = ErrorType.VALIDATION;
        userMessage = 'This record already exists.';
        break;
      case '23503':
        type = ErrorType.VALIDATION;
        userMessage = 'This record cannot be deleted because it is referenced by other records.';
        break;
      case 'PGRST204':
        type = ErrorType.DATABASE;
        userMessage = 'Database schema error. Please contact support.';
        severity = ErrorSeverity.HIGH;
        break;
      default:
        if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          type = ErrorType.NETWORK;
          userMessage = 'Network error. Please check your connection and try again.';
        } else if (errorMessage.includes('rate limit')) {
          type = ErrorType.RATE_LIMIT;
          userMessage = 'Too many requests. Please wait a moment and try again.';
        }
    }

    return this.createError(type, errorMessage, userMessage, severity, context, supabaseError);
  }

  static handleAuthError(authError: any, context: Partial<ErrorContext> = {}): AppError {
    const errorMessage = authError?.message || 'Authentication error';
    let userMessage = 'Authentication failed. Please try again.';
    let severity = ErrorSeverity.MEDIUM;

    if (errorMessage.includes('Invalid login credentials')) {
      userMessage = 'Invalid email or password. Please check your credentials.';
    } else if (errorMessage.includes('Email not confirmed')) {
      userMessage = 'Please check your email and click the confirmation link.';
    } else if (errorMessage.includes('Too many requests')) {
      userMessage = 'Too many login attempts. Please wait a few minutes.';
      severity = ErrorSeverity.HIGH;
    } else if (errorMessage.includes('User not found')) {
      userMessage = 'No account found with this email address.';
    }

    return this.createError(
      ErrorType.AUTHENTICATION,
      errorMessage,
      userMessage,
      severity,
      context,
      authError
    );
  }

  static showErrorToast(error: AppError): void {
    toast({
      title: this.getErrorTitle(error.type),
      description: error.userMessage,
      variant: "destructive",
      duration: error.severity === ErrorSeverity.CRITICAL ? 10000 : 5000
    });
  }

  private static getErrorTitle(type: ErrorType): string {
    switch (type) {
      case ErrorType.AUTHENTICATION:
        return 'Authentication Error';
      case ErrorType.AUTHORIZATION:
        return 'Access Denied';
      case ErrorType.VALIDATION:
        return 'Validation Error';
      case ErrorType.NETWORK:
        return 'Network Error';
      case ErrorType.DATABASE:
        return 'Database Error';
      case ErrorType.EMAIL:
        return 'Email Error';
      case ErrorType.OTP:
        return 'Verification Error';
      case ErrorType.TENANT:
        return 'Workspace Error';
      case ErrorType.INVITATION:
        return 'Invitation Error';
      case ErrorType.SUBSCRIPTION:
        return 'Subscription Error';
      case ErrorType.RATE_LIMIT:
        return 'Rate Limit Exceeded';
      default:
        return 'Error';
    }
  }
}

// React hook for error handling
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
