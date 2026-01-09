import { NextRequest, NextResponse } from 'next/server';
import { getTenantContext } from '@/lib/auth/tenant';
import { supabaseAdmin, Database } from '@/lib/supabase';
import { projectSchema, validateAndParse } from '@/lib/api-validation';

type Project = Database['public']['Tables']['projects']['Row'];

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Query by tenant_id (supports both personal and org workspaces)
    // Falls back to user_id for backwards compatibility
    const { data: projects, error } = await (supabaseAdmin as any)
      .from('projects')
      .select('id, name, description, sandbox_id, sandbox_url, mode, source_url, created_at, updated_at, github_repo, github_branch, user_id, org_id')
      .or(`user_id.eq.${tenant.userId},org_id.eq.${tenant.orgId || 'null'}`)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[Projects API] Error:', error);
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }

    // Filter based on current context
    const filteredProjects = (projects as any[] | null)?.filter(p => {
      if (tenant.tenantType === 'organization') {
        return p.org_id === tenant.orgId;
      }
      return p.user_id === tenant.userId && !p.org_id;
    });

    const formattedProjects = filteredProjects?.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      sandboxId: p.sandbox_id,
      sandboxUrl: p.sandbox_url,
      mode: p.mode,
      sourceUrl: p.source_url,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      githubRepo: p.github_repo,
      githubBranch: p.github_branch,
      orgId: p.org_id,
    }));

    return NextResponse.json({
      projects: formattedProjects,
      tenant: {
        type: tenant.tenantType,
        orgId: tenant.orgId,
      }
    });
  } catch (error: any) {
    console.error('[Projects API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const validation = validateAndParse(projectSchema, body);
    if (!validation.success) {
      return validation.error;
    }

    const { name, description, sandboxId, sandboxUrl, mode, sourceUrl } = validation.data;

    const { data, error } = await (supabaseAdmin as any)
      .from('projects')
      .insert({
        user_id: tenant.userId,
        org_id: tenant.orgId || null, // Set org_id if in organization context
        name,
        description: description || null,
        sandbox_id: sandboxId || null,
        sandbox_url: sandboxUrl || null,
        mode: mode || 'prompt',
        source_url: sourceUrl || null,
      })
      .select()
      .single();

    if (error) {
      console.error('[Projects API] Error creating project:', error);

      if (error.code === '23505') {
        return NextResponse.json({ error: 'Project with this name already exists' }, { status: 409 });
      }

      return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
    }

    const project = data as Project & { org_id?: string };

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        sandboxId: project.sandbox_id,
        sandboxUrl: project.sandbox_url,
        mode: project.mode,
        sourceUrl: project.source_url,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
        orgId: project.org_id,
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('[Projects API] Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
