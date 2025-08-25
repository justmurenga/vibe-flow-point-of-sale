import { createErrorResponse, createSuccessResponse } from "./utils.ts";

export enum EdgeFunctionErrorType {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  DATABASE = 'DATABASE',
  EMAIL = 'EMAIL',
  OTP = 'OTP',
  TENANT = 'TENANT',
  INVITATION = 'INVITATION',
  RATE_LIMIT = 'RATE_LIMIT',
  UNKNOWN = 'UNKNOWN'
}

export interface EdgeFunctionError {
  type: EdgeFunctionErrorType;
  message: string;
  userMessage: string;
  code?: string;
  context?: Record<string, any>;
  originalError?: any;
}

export class EdgeFunctionErrorHandler {
  static createError(
    type: EdgeFunctionErrorType,
    message: string,
    userMessage: string,
    code?: string,
    context?: Record<string, any>,
    originalError?: any
  ): EdgeFunctionError {
    return {
      type,
      message,
      userMessage,
      code,
      context,
      originalError
    };
  }

  static handleSupabaseError(supabaseError: any, context?: Record<string, any>): EdgeFunctionError {
    const errorCode = supabaseError?.code;
    const errorMessage = supabaseError?.message || 'Unknown Supabase error';

    let type = EdgeFunctionErrorType.UNKNOWN;
    let userMessage = 'An error occurred. Please try again.';

    switch (errorCode) {
      case 'PGRST301':
        type = EdgeFunctionErrorType.AUTHENTICATION;
        userMessage = 'Authentication required';
        break;
      case '42501':
        type = EdgeFunctionErrorType.AUTHORIZATION;
        userMessage = 'Access denied';
        break;
      case '23505':
        type = EdgeFunctionErrorType.VALIDATION;
        userMessage = 'Record already exists';
        break;
      case '23503':
        type = EdgeFunctionErrorType.VALIDATION;
        userMessage = 'Cannot delete referenced record';
        break;
      case 'PGRST204':
        type = EdgeFunctionErrorType.DATABASE;
        userMessage = 'Database schema error';
        break;
      default:
        if (errorMessage.includes('rate limit')) {
          type = EdgeFunctionErrorType.RATE_LIMIT;
          userMessage = 'Rate limit exceeded';
        }
    }

    return this.createError(type, errorMessage, userMessage, errorCode, context, supabaseError);
  }

  static logError(functionName: string, error: EdgeFunctionError): void {
    console.error(`=== ${functionName.toUpperCase()} ERROR ===`);
    console.error('Error Type:', error.type);
    console.error('Message:', error.message);
    console.error('User Message:', error.userMessage);
    console.error('Code:', error.code);
    console.error('Context:', error.context);
    if (error.originalError) {
      console.error('Original Error:', error.originalError);
    }
  }

  static createErrorResponse(error: EdgeFunctionError, status: number = 400): Response {
    this.logError('edge-function', error);
    
    return createErrorResponse(
      error.userMessage,
      status,
      error.code
    );
  }
}
