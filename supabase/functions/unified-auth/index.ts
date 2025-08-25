import { serveEdgeFunction, withValidation, withRateLimit } from "../_shared/handlers.ts";
import { createSupabaseClient, logFunctionStart, logFunctionEnd, logError } from "../_shared/utils.ts";
import { AuthRequest, AuthResponse, createSuccessResponse, createErrorResponse } from "../_shared/types.ts";

// Validation function
function validateAuthRequest(data: any): { valid: boolean; error?: string } {
  if (!data.email || !validateEmail(data.email)) {
    return { valid: false, error: 'Valid email is required' };
  }
  
  if (!data.isGoogleUser && (!data.password || !validatePassword(data.password))) {
    return { valid: false, error: 'Password is required and must be at least 8 characters' };
  }
  
  if (!data.fullName || data.fullName.trim().length < 2) {
    return { valid: false, error: 'Full name is required' };
  }
  
  if (!data.businessName || data.businessName.trim().length < 2) {
    return { valid: false, error: 'Business name is required' };
  }
  
  return { valid: true };
}

async function handleAuthRequest(req: Request, data: AuthRequest): Promise<Response> {
  const functionName = 'unified-auth';
  logFunctionStart(functionName, data);
  
  try {
    const supabase = createSupabaseClient();
    
    let user;
    
    if (data.isGoogleUser) {
      // Google OAuth flow - this would be handled by the client
      // This function is for email/password signup
      return createErrorResponse(
        'Google OAuth should be handled by the client',
        400,
        'INVALID_AUTH_METHOD'
      );
    } else {
      // Email/password signup
      const { data: authData, error } = await supabase.auth.admin.createUser({
        email: data.email,
        password: data.password!,
        email_confirm: true, // Auto-confirm for now
        user_metadata: {
          full_name: data.fullName,
          business_name: data.businessName,
          business_type: data.businessType,
          country: data.country,
          currency: data.currency,
          timezone: data.timezone,
          phone: data.phone
        }
      });

      if (error) {
        logError(functionName, error);
        return createErrorResponse(
          `Failed to create user: ${error.message}`,
          400,
          'USER_CREATION_FAILED'
        );
      }
      
      user = authData.user;
    }

    // Create tenant if user is confirmed
    if (user) {
      const tenantResult = await createTenant(user.id, data);
      
      const response: AuthResponse = {
        success: true,
        user,
        tenant: tenantResult.tenant,
        message: 'Account created successfully'
      };
      
      logFunctionEnd(functionName, response);
      return createSuccessResponse(response);
    }

    return createErrorResponse(
      'Failed to create user account',
      500,
      'USER_CREATION_FAILED'
    );
  } catch (error: any) {
    logError(functionName, error);
    return createErrorResponse(
      error.message || 'Internal server error',
      500,
      'INTERNAL_ERROR'
    );
  }
}

async function createTenant(userId: string, businessData: AuthRequest): Promise<{ tenant: any }> {
  const supabase = createSupabaseClient();
  
  // Get highest billing plan
  const { data: plans, error: plansError } = await supabase
    .from('billing_plans')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: false })
    .limit(1);

  if (plansError || !plans?.[0]) {
    throw new Error('No active billing plan found');
  }
  
  const highestPlan = plans[0];
  const subdomain = sanitizeSubdomain(businessData.businessName);

  // Create tenant
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({
      name: businessData.businessName,
      subdomain,
      status: 'trial',
      billing_plan_id: highestPlan.id,
      created_by: userId
    })
    .select()
    .single();

  if (tenantError) {
    throw new Error(`Failed to create tenant: ${tenantError.message}`);
  }

  // Update profile
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      tenant_id: tenant.id,
      role: 'admin',
      full_name: businessData.fullName,
      auth_method: businessData.isGoogleUser ? 'google' : 'email'
    })
    .eq('user_id', userId);

  if (profileError) {
    throw new Error(`Failed to update profile: ${profileError.message}`);
  }

  return { tenant };
}

// Export the handler with validation and rate limiting
export default serveEdgeFunction(
  withRateLimit(
    withValidation(handleAuthRequest, validateAuthRequest),
    'auth_signup',
    3, // 3 attempts
    15 // per 15 minutes
  )
);
```

