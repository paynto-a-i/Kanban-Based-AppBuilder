import { NextRequest, NextResponse } from 'next/server';
import { getTenantContext, TenantContext } from './tenant';
import { rateLimit } from '../rateLimit';

// Rate limiters for different API categories
const aiLimiter = rateLimit({ interval: 60 * 1000, limit: 10 });
const sandboxLimiter = rateLimit({ interval: 60 * 1000, limit: 5 });
const generalLimiter = rateLimit({ interval: 60 * 1000, limit: 100 });

export type RateLimitType = 'ai' | 'sandbox' | 'general' | 'none';

interface AuthResult {
  success: true;
  tenant: TenantContext;
}

interface AuthError {
  success: false;
  response: NextResponse;
}

/**
 * Authenticate and rate limit an API request.
 * Returns tenant context if successful, or an error response if not.
 */
export async function withAuth(
  request: NextRequest,
  options: {
    requireAuth?: boolean;
    rateLimitType?: RateLimitType;
  } = {}
): Promise<AuthResult | AuthError> {
  const { requireAuth = true, rateLimitType = 'general' } = options;

  // Apply rate limiting
  if (rateLimitType !== 'none') {
    const limiter = rateLimitType === 'ai'
      ? aiLimiter
      : rateLimitType === 'sandbox'
        ? sandboxLimiter
        : generalLimiter;

    const limitResult = await limiter(request);
    if (limitResult instanceof NextResponse) {
      return { success: false, response: limitResult };
    }
  }

  // Get tenant context
  const tenant = await getTenantContext();

  if (requireAuth && !tenant) {
    return {
      success: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  // For non-required auth, create a minimal guest context
  if (!requireAuth && !tenant) {
    return {
      success: true,
      tenant: {
        userId: 'guest',
        orgId: null,
        orgRole: null,
        tenantId: 'guest',
        tenantType: 'personal',
      } as TenantContext,
    };
  }

  return { success: true, tenant: tenant! };
}

/**
 * Helper to check if the current user has write access to a resource.
 * For organizations, checks if user is admin or owner.
 */
export function hasWriteAccess(tenant: TenantContext): boolean {
  if (tenant.tenantType === 'personal') {
    return true;
  }

  // For organizations, check if user has admin or owner role
  return tenant.orgRole === 'org:admin' ||
         tenant.orgRole === 'admin' ||
         tenant.orgRole === 'org:owner' ||
         tenant.orgRole === 'owner';
}

/**
 * Check if user can perform admin-only actions in an organization.
 */
export function isOrgAdmin(tenant: TenantContext): boolean {
  if (tenant.tenantType === 'personal') {
    return true; // Personal workspace owner has full access
  }

  return tenant.orgRole === 'org:admin' ||
         tenant.orgRole === 'admin' ||
         tenant.orgRole === 'org:owner' ||
         tenant.orgRole === 'owner';
}
