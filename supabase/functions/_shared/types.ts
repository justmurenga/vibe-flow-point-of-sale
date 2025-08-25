// Common types for all edge functions
export interface BaseRequest {
  userId?: string;
  email?: string;
  tenantId?: string;
}

export interface AuthRequest extends BaseRequest {
  email: string;
  password?: string;
  fullName?: string;
  businessName?: string;
  businessType?: string;
  country?: string;
  currency?: string;
  timezone?: string;
  phone?: string;
  isGoogleUser?: boolean;
}

export interface OTPRequest extends BaseRequest {
  email: string;
  otpType: 'email_verification' | 'password_reset' | 'login_verification';
  userId?: string;
  recipientName?: string;
}

export interface VerifyOTPRequest extends BaseRequest {
  userId?: string;
  email?: string;
  otpCode: string;
  otpType: 'email_verification' | 'password_reset' | 'login_verification';
  newPassword?: string;
}

export interface InvitationRequest extends BaseRequest {
  email: string;
  role?: string;
  tenantId: string;
  invitedBy: string;
  permissions?: string[];
}

export interface TenantRequest extends BaseRequest {
  userId: string;
  businessData: {
    businessName: string;
    ownerName: string;
    ownerEmail: string;
    businessEmail: string;
    businessType?: string;
    country?: string;
    currency?: string;
    timezone?: string;
    phone?: string;
  };
  planType?: string;
  isGoogleUser?: boolean;
}

export interface BaseResponse {
  success: boolean;
  message?: string;
  error?: string;
  code?: string;
  data?: any;
}

export interface AuthResponse extends BaseResponse {
  user?: any;
  tenant?: any;
  requiresVerification?: boolean;
}

export interface OTPResponse extends BaseResponse {
  otpCode?: string;
  expiresAt?: string;
}

export interface VerifyOTPResponse extends BaseResponse {
  verified: boolean;
  user?: any;
}

export interface InvitationResponse extends BaseResponse {
  invitationId?: string;
  invitationUrl?: string;
}

export interface TenantResponse extends BaseResponse {
  tenant?: any;
  profile?: any;
}
