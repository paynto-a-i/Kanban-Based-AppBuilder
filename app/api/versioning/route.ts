import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { Project, ProjectVersion } from '@/lib/versioning/types';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!supabaseAdmin) {
            return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
        }

        const userId = session.user.id;
        const body = await request.json();
        const { action, ...data } = body;

        switch (action) {
            case 'saveProject':
                return await handleSaveProject(userId, data.project);
            case 'getProject':
                return await handleGetProject(userId, data.projectId);
            case 'listProjects':
                return await handleListProjects(userId);
            case 'deleteProject':
                return await handleDeleteProject(userId, data.projectId);
            case 'saveVersion':
                return await handleSaveVersion(userId, data.version);
            case 'getVersion':
                return await handleGetVersion(userId, data.versionId);
            case 'listVersions':
                return await handleListVersions(userId, data.projectId);
            case 'getLatestVersion':
                return await handleGetLatestVersion(userId, data.projectId);
            case 'deleteVersion':
                return await handleDeleteVersion(userId, data.versionId);
            case 'getStorageUsed':
                return await handleGetStorageUsed(userId);
            case 'clear':
                return await handleClear(userId);
            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error: any) {
        console.error('[Versioning API] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function handleSaveProject(userId: string, project: Project) {
    const { error } = await (supabaseAdmin as any)
        .from('projects')
        .upsert({
            id: project.id,
            user_id: userId,
            name: project.name,
            description: project.description,
            mode: project.mode,
            source_url: project.sourceUrl || null,
            github_repo: project.github?.repoFullName || null,
            github_branch: project.github?.branch || null,
            last_commit_sha: project.github?.lastCommitSha || null,
            updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

    if (error) throw error;
    return NextResponse.json({ success: true });
}

async function handleGetProject(userId: string, projectId: string) {
    const { data, error } = await (supabaseAdmin as any)
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .eq('user_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') throw error;
    return NextResponse.json({ project: data ? mapProjectFromDB(data) : null });
}

async function handleListProjects(userId: string) {
    const { data, error } = await (supabaseAdmin as any)
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ projects: (data || []).map(mapProjectFromDB) });
}

async function handleDeleteProject(userId: string, projectId: string) {
    const { data: project } = await (supabaseAdmin as any)
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('user_id', userId)
        .single();

    if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    await (supabaseAdmin as any)
        .from('versions')
        .delete()
        .eq('project_id', projectId);

    await (supabaseAdmin as any)
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', userId);

    return NextResponse.json({ success: true });
}

async function handleSaveVersion(userId: string, version: ProjectVersion) {
    const { data: project } = await (supabaseAdmin as any)
        .from('projects')
        .select('id')
        .eq('id', version.projectId)
        .eq('user_id', userId)
        .single();

    if (!project) {
        return NextResponse.json({ error: 'Project not found or access denied' }, { status: 403 });
    }

    const { error } = await (supabaseAdmin as any)
        .from('versions')
        .upsert({
            id: version.id,
            project_id: version.projectId,
            version_number: version.versionNumber,
            name: version.name,
            description: version.description,
            trigger: version.trigger,
            ticket_id: version.ticketId || null,
            ticket_title: version.ticketTitle || null,
            files_json: JSON.stringify(version.files),
            packages_json: JSON.stringify(version.packages),
            kanban_json: version.kanbanState ? JSON.stringify(version.kanbanState) : null,
            file_count: version.fileCount,
            total_size: version.totalSize,
            git_commit_sha: version.gitCommitSha || null,
            git_commit_url: version.gitCommitUrl || null
        }, { onConflict: 'id' });

    if (error) throw error;
    return NextResponse.json({ success: true });
}

async function handleGetVersion(userId: string, versionId: string) {
    const { data, error } = await (supabaseAdmin as any)
        .from('versions')
        .select('*, projects!inner(user_id)')
        .eq('id', versionId)
        .eq('projects.user_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') throw error;
    return NextResponse.json({ version: data ? mapVersionFromDB(data) : null });
}

async function handleListVersions(userId: string, projectId: string) {
    const { data: project } = await (supabaseAdmin as any)
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('user_id', userId)
        .single();

    if (!project) {
        return NextResponse.json({ versions: [] });
    }

    const { data, error } = await (supabaseAdmin as any)
        .from('versions')
        .select('*')
        .eq('project_id', projectId)
        .order('version_number', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ versions: (data || []).map(mapVersionFromDB) });
}

async function handleGetLatestVersion(userId: string, projectId: string) {
    const { data: project } = await (supabaseAdmin as any)
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('user_id', userId)
        .single();

    if (!project) {
        return NextResponse.json({ version: null });
    }

    const { data, error } = await (supabaseAdmin as any)
        .from('versions')
        .select('*')
        .eq('project_id', projectId)
        .order('version_number', { ascending: false })
        .limit(1)
        .single();

    if (error && error.code !== 'PGRST116') throw error;
    return NextResponse.json({ version: data ? mapVersionFromDB(data) : null });
}

async function handleDeleteVersion(userId: string, versionId: string) {
    const { data: version } = await (supabaseAdmin as any)
        .from('versions')
        .select('id, projects!inner(user_id)')
        .eq('id', versionId)
        .eq('projects.user_id', userId)
        .single();

    if (!version) {
        return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    await (supabaseAdmin as any)
        .from('versions')
        .delete()
        .eq('id', versionId);

    return NextResponse.json({ success: true });
}

async function handleGetStorageUsed(userId: string) {
    const { data: projects } = await (supabaseAdmin as any)
        .from('projects')
        .select('id')
        .eq('user_id', userId);

    if (!projects || projects.length === 0) {
        return NextResponse.json({ used: 0 });
    }

    const projectIds = projects.map((p: any) => p.id);
    
    const { data: versions } = await (supabaseAdmin as any)
        .from('versions')
        .select('total_size')
        .in('project_id', projectIds);

    const used = (versions || []).reduce((sum: number, v: any) => sum + (v.total_size || 0), 0);
    return NextResponse.json({ used });
}

async function handleClear(userId: string) {
    const { data: projects } = await (supabaseAdmin as any)
        .from('projects')
        .select('id')
        .eq('user_id', userId);

    if (projects) {
        for (const project of projects) {
            await (supabaseAdmin as any)
                .from('versions')
                .delete()
                .eq('project_id', project.id);
            
            await (supabaseAdmin as any)
                .from('projects')
                .delete()
                .eq('id', project.id);
        }
    }

    return NextResponse.json({ success: true });
}

function mapProjectFromDB(data: any): Project {
    return {
        id: data.id,
        name: data.name,
        description: data.description || '',
        mode: data.mode || 'prompt',
        sourceUrl: data.source_url,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        currentVersionId: null,
        totalVersions: 0,
        totalFiles: 0,
        github: data.github_repo ? {
            connected: true,
            repoFullName: data.github_repo,
            branch: data.github_branch || 'main',
            autoCommit: false,
            autoPush: false,
            lastCommitSha: data.last_commit_sha
        } : undefined
    };
}

function mapVersionFromDB(data: any): ProjectVersion {
    return {
        id: data.id,
        projectId: data.project_id,
        versionNumber: data.version_number,
        name: data.name,
        description: data.description || '',
        trigger: data.trigger,
        ticketId: data.ticket_id,
        ticketTitle: data.ticket_title,
        files: JSON.parse(data.files_json || '[]'),
        packages: JSON.parse(data.packages_json || '{"dependencies":{},"devDependencies":{}}'),
        kanbanState: data.kanban_json ? JSON.parse(data.kanban_json) : undefined,
        createdAt: data.created_at,
        fileCount: data.file_count || 0,
        totalSize: data.total_size || 0,
        gitCommitSha: data.git_commit_sha,
        gitCommitUrl: data.git_commit_url
    };
}
