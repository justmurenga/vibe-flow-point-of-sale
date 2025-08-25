import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";

// Common CORS headers
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Unified response helper
export function createResponse(data: any, status: number = 200): Response {
  return new Response(
    JSON.stringify(data),
    { 
      status, 
      headers: { 
        'Content-Type': 'application/json', 
        ...corsHeaders 
      } 
    }
  );
}

// Error response helper
export function createErrorResponse(error: string, status: number = 400, code?: string): Response {
  return createResponse({
    success: false,
    error,
    code,
    timestamp: new Date().toISOString()
  }, status);
}

// Success response helper
export function createSuccessResponse(data: any, message?: string): Response {
  return createResponse({
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  });
}

// Supabase client factory
export function createSupabaseClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
}

// Rate limiting helper
export async function checkRateLimit(
  supabase: any, 
  identifier: string, 
  actionType: string,
  maxAttempts: number = 5,
  windowMinutes: number = 15,
  blockMinutes: number = 60
): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_rate_limit', {
    identifier_param: identifier,
    action_type_param: actionType,
    max_attempts: maxAttempts,
    window_minutes: windowMinutes,
    block_minutes: blockMinutes
  });
  
  if (error) {
    console.error('Rate limit check error:', error);
    return false; // Fail safe - block on error
  }
  
  return data === true;
}

// Get client IP helper
export function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for') || 
         req.headers.get('x-real-ip') || 
         'unknown';
}

// Validation helpers
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): boolean {
  return password && password.length >= 8;
}

export function validateOTPCode(otpCode: string): boolean {
  return otpCode && otpCode.length === 6 && /^\d{6}$/.test(otpCode);
}

// Logging helpers
export function logFunctionStart(functionName: string, data: any) {
  console.log(`=== ${functionName.toUpperCase()} STARTED ===`);
  console.log('Request data:', JSON.stringify(data, null, 2));
}

export function logFunctionEnd(functionName: string, result: any) {
  console.log(`=== ${functionName.toUpperCase()} COMPLETED ===`);
  console.log('Result:', JSON.stringify(result, null, 2));
}

export function logError(functionName: string, error: any) {
  console.error(`=== ${functionName.toUpperCase()} ERROR ===`);
  console.error('Error:', error);
}

// Domain validation helpers
export function validateSubdomain(subdomain: string): boolean {
  const subdomainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
  return subdomainRegex.test(subdomain) && subdomain.length >= 3 && subdomain.length <= 63;
}

export function sanitizeSubdomain(businessName: string): string {
  return businessName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 30);
}
