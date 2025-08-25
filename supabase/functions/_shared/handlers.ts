import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders, createErrorResponse, createSuccessResponse } from "./utils.ts";

// Base handler type
export type EdgeFunctionHandler = (req: Request) => Promise<Response>;

// CORS handler wrapper
export function withCORS(handler: EdgeFunctionHandler): EdgeFunctionHandler {
  return async (req: Request): Promise<Response> => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      return await handler(req);
    } catch (error: any) {
      console.error('Unhandled error in edge function:', error);
      return createErrorResponse(
        'Internal server error',
        500,
        'INTERNAL_ERROR'
      );
    }
  };
}

// Request validation wrapper
export function withValidation<T>(
  handler: (req: Request, data: T) => Promise<Response>,
  validator: (data: any) => { valid: boolean; error?: string }
): EdgeFunctionHandler {
  return async (req: Request): Promise<Response> => {
    try {
      const body = await req.json();
      const validation = validator(body);
      
      if (!validation.valid) {
        return createErrorResponse(
          validation.error || 'Invalid request data',
          400,
          'VALIDATION_ERROR'
        );
      }
      
      return await handler(req, body as T);
    } catch (error: any) {
      if (error instanceof SyntaxError) {
        return createErrorResponse(
          'Invalid JSON in request body',
          400,
          'INVALID_JSON'
        );
      }
      throw error;
    }
  };
}

// Rate limiting wrapper
export function withRateLimit(
  handler: EdgeFunctionHandler,
  actionType: string,
  maxAttempts: number = 5,
  windowMinutes: number = 15
): EdgeFunctionHandler {
  return async (req: Request): Promise<Response> => {
    const { checkRateLimit, getClientIP, createSupabaseClient } = await import('./utils.ts');
    
    const clientIP = getClientIP(req);
    const supabase = createSupabaseClient();
    
    const isAllowed = await checkRateLimit(
      supabase, 
      clientIP, 
      actionType, 
      maxAttempts, 
      windowMinutes
    );
    
    if (!isAllowed) {
      return createErrorResponse(
        'Rate limit exceeded. Please try again later.',
        429,
        'RATE_LIMIT_EXCEEDED'
      );
    }
    
    return await handler(req);
  };
}

// Authentication wrapper
export function withAuth(
  handler: (req: Request, user: any) => Promise<Response>
): EdgeFunctionHandler {
  return async (req: Request): Promise<Response> => {
    const { createSupabaseClient } = await import('./utils.ts');
    
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createErrorResponse(
        'Missing or invalid authorization header',
        401,
        'UNAUTHORIZED'
      );
    }
    
    const token = authHeader.substring(7);
    const supabase = createSupabaseClient();
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return createErrorResponse(
        'Invalid or expired token',
        401,
        'INVALID_TOKEN'
      );
    }
    
    return await handler(req, user);
  };
}

// Unified serve function
export function serveEdgeFunction(handler: EdgeFunctionHandler) {
  return serve(withCORS(handler));
}
