import { auth } from '@clerk/nextjs/server';

export interface TenantContext {
  userId: string;
  orgId: string | null;
  orgRole: string | null;
  tenantId: string; // Either orgId or userId (for personal workspace)
  tenantType: 'organization' | 'personal';
}

/**
 * Get the current tenant context from Clerk auth.
 * Returns orgId if user is in an organization, otherwise returns userId for personal workspace.
 */
export async function getTenantContext(): Promise<TenantContext | null> {
  const { userId, orgId, orgRole } = await auth();

  if (!userId) {
    return null;
  }

  return {
    userId,
    orgId: orgId || null,
    orgRole: orgRole || null,
    tenantId: orgId || userId,
    tenantType: orgId ? 'organization' : 'personal',
  };
}

/**
 * Get tenant context or throw unauthorized error.
 */
export async function requireTenantContext(): Promise<TenantContext> {
  const context = await getTenantContext();
  if (!context) {
    throw new Error('Unauthorized');
  }
  return context;
}

/**
 * Check if current user has admin role in organization.
 */
export function isOrgAdmin(context: TenantContext): boolean {
  return context.orgRole === 'org:admin' || context.orgRole === 'admin';
}

/**
 * Check if current user is owner of the organization.
 */
export function isOrgOwner(context: TenantContext): boolean {
  return context.orgRole === 'org:owner' || context.orgRole === 'owner';
}
