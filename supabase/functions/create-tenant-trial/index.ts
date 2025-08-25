import { serveEdgeFunction, withValidation, withRateLimit } from "../_shared/handlers.ts";
import { createSupabaseClient, logFunctionStart, logFunctionEnd, logError, sanitizeSubdomain } from "../_shared/utils.ts";
import { TenantRequest, TenantResponse, createSuccessResponse, createErrorResponse } from "../_shared/types.ts";

// Validation function
function validateTenantRequest(data: any): { valid: boolean; error?: string } {
  if (!data.userId) {
    return { valid: false, error: 'User ID is required' };
  }
  
  if (!data.businessData || !data.businessData.businessName) {
    return { valid: false, error: 'Business data with name is required' };
  }
  
  return { valid: true };
}

async function handleTenantRequest(req: Request, data: TenantRequest): Promise<Response> {
  const functionName = 'create-tenant-trial';
  logFunctionStart(functionName, data);
  
  try {
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
    const subdomain = sanitizeSubdomain(data.businessData.businessName);

    // Create tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: data.businessData.businessName,
        subdomain,
        status: 'trial',
        billing_plan_id: highestPlan.id,
        created_by: data.userId
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
        full_name: data.businessData.ownerName,
        auth_method: data.isGoogleUser ? 'google' : 'email'
      })
      .eq('user_id', data.userId);

    if (profileError) {
      throw new Error(`Failed to update profile: ${profileError.message}`);
    }

    // Setup unified role management
    const { error: roleSetupError } = await supabase.rpc('setup_tenant_admin_with_unified_roles', {
      tenant_id_param: tenant.id,
      admin_user_id: data.userId
    });

    if (roleSetupError) {
      console.warn('Role setup error (non-critical):', roleSetupError);
    }

    const response: TenantResponse = {
      success: true,
      message: 'Tenant created successfully',
      data: {
        tenant,
        subdomain: tenant.subdomain,
        plan: highestPlan
      }
    };

    logFunctionEnd(functionName, response);
    return createSuccessResponse(response);
  } catch (error: any) {
    logError(functionName, error);
    return createErrorResponse(
      error.message || 'Failed to create tenant',
      500,
      'TENANT_CREATION_FAILED'
    );
  }
}

// Export the handler with validation and rate limiting
export default serveEdgeFunction(
  withRateLimit(
    withValidation(handleTenantRequest, validateTenantRequest),
    'tenant_creation',
    3, // 3 attempts
    60 // per hour
  )
);