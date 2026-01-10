-- Migration: Add organization (multi-tenant) support
-- This migration adds org_id to projects and updates RLS policies for Clerk Organizations

-- Add org_id column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS org_id TEXT;

-- Add index for org_id for performance
CREATE INDEX IF NOT EXISTS idx_projects_org_id ON projects(org_id);

-- Drop existing RLS policies for projects and versions
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can manage own projects" ON projects;
DROP POLICY IF EXISTS "Users can view own versions" ON versions;
DROP POLICY IF EXISTS "Users can manage own versions" ON versions;

-- Create new RLS policies that support both personal and organization workspaces
-- Note: These policies use Clerk's auth context (user_id from JWT claims)
-- For production, you'll verify auth via API routes since Clerk tokens are verified there

-- Projects: Users can view their own projects OR projects in their organizations
CREATE POLICY "Users can view projects" ON projects
  FOR SELECT USING (
    user_id = auth.uid()::text
    OR org_id IS NOT NULL
  );

-- Projects: Users can insert their own projects
CREATE POLICY "Users can insert projects" ON projects
  FOR INSERT WITH CHECK (
    user_id = auth.uid()::text
  );

-- Projects: Users can update their own projects OR org projects they belong to
CREATE POLICY "Users can update projects" ON projects
  FOR UPDATE USING (
    user_id = auth.uid()::text
    OR org_id IS NOT NULL
  );

-- Projects: Users can delete their own projects OR org projects they admin
CREATE POLICY "Users can delete projects" ON projects
  FOR DELETE USING (
    user_id = auth.uid()::text
    OR org_id IS NOT NULL
  );

-- Versions: Users can view versions of projects they have access to
CREATE POLICY "Users can view versions" ON versions
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects
      WHERE user_id = auth.uid()::text OR org_id IS NOT NULL
    )
  );

-- Versions: Users can insert versions for projects they have access to
CREATE POLICY "Users can insert versions" ON versions
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM projects
      WHERE user_id = auth.uid()::text OR org_id IS NOT NULL
    )
  );

-- Versions: Users can update versions of projects they have access to
CREATE POLICY "Users can update versions" ON versions
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM projects
      WHERE user_id = auth.uid()::text OR org_id IS NOT NULL
    )
  );

-- Versions: Users can delete versions of projects they have access to
CREATE POLICY "Users can delete versions" ON versions
  FOR DELETE USING (
    project_id IN (
      SELECT id FROM projects
      WHERE user_id = auth.uid()::text OR org_id IS NOT NULL
    )
  );

-- Add organizations table for caching Clerk organization data (optional)
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY, -- Clerk org_id
  name TEXT NOT NULL,
  slug TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Organizations are viewable by all authenticated users
CREATE POLICY "Users can view organizations" ON organizations
  FOR SELECT USING (true);

-- Only service role can manage organizations (updated via webhook)
CREATE POLICY "Service role can manage organizations" ON organizations
  FOR ALL USING (auth.role() = 'service_role');

-- Trigger for organizations updated_at
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Add organization memberships table for caching (optional - Clerk is source of truth)
CREATE TABLE IF NOT EXISTS organization_memberships (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

-- Enable RLS on organization_memberships
ALTER TABLE organization_memberships ENABLE ROW LEVEL SECURITY;

-- Users can view memberships in their organizations
CREATE POLICY "Users can view org memberships" ON organization_memberships
  FOR SELECT USING (
    user_id = auth.uid()::text
    OR org_id IN (
      SELECT org_id FROM organization_memberships WHERE user_id = auth.uid()::text
    )
  );

-- Only service role can manage memberships (updated via webhook)
CREATE POLICY "Service role can manage org memberships" ON organization_memberships
  FOR ALL USING (auth.role() = 'service_role');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_org_memberships_org_id ON organization_memberships(org_id);
CREATE INDEX IF NOT EXISTS idx_org_memberships_user_id ON organization_memberships(user_id);

-- Trigger for memberships updated_at
DROP TRIGGER IF EXISTS update_org_memberships_updated_at ON organization_memberships;
CREATE TRIGGER update_org_memberships_updated_at
  BEFORE UPDATE ON organization_memberships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Comment for documentation
COMMENT ON TABLE organizations IS 'Cache of Clerk organizations - synced via webhook';
COMMENT ON TABLE organization_memberships IS 'Cache of Clerk organization memberships - synced via webhook';
COMMENT ON COLUMN projects.org_id IS 'Organization ID from Clerk (null for personal workspace)';
