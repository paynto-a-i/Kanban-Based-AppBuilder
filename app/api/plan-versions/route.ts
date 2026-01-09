import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';

const listQuerySchema = z.object({
  projectId: z.string().min(1),
});

const createBodySchema = z.object({
  projectId: z.string().min(1),
  planId: z.string().optional(),
  source: z.enum(['initial_plan', 'move_to_pipeline', 'manual']).optional(),
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional().nullable(),
  tickets: z.array(z.any()).min(1).max(300),
});

function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = request.nextUrl.searchParams.get('projectId') || '';
    const queryValidation = listQuerySchema.safeParse({ projectId });
    if (!queryValidation.success) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    const { data: project, error: projectError } = await (supabaseAdmin as any)
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const { data: versions, error } = await (supabaseAdmin as any)
      .from('versions')
      .select('id, version_number, name, description, trigger, kanban_json, created_at')
      .eq('project_id', projectId)
      .eq('trigger', 'plan_snapshot')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[Plan Versions API] Error listing versions:', error);
      return NextResponse.json({ error: 'Failed to fetch plan versions' }, { status: 500 });
    }

    const normalized = (versions || []).map((v: any) => {
      const parsed = safeJsonParse<any>(v.kanban_json, null);
      return {
        id: v.id,
        versionNumber: v.version_number,
        name: v.name,
        description: v.description,
        trigger: v.trigger,
        createdAt: v.created_at,
        planId: parsed?.planId || null,
        source: parsed?.source || null,
        tickets: parsed?.tickets || [],
      };
    });

    return NextResponse.json({ versions: normalized });
  } catch (error: any) {
    console.error('[Plan Versions API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch plan versions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const validation = createBodySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const { projectId, planId, source, name, description, tickets } = validation.data;

    const { data: project, error: projectError } = await (supabaseAdmin as any)
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const { data: latest } = await (supabaseAdmin as any)
      .from('versions')
      .select('version_number')
      .eq('project_id', projectId)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextVersionNumber = (latest?.version_number || 0) + 1;

    const now = new Date().toISOString();
    const payload = {
      planId: planId || null,
      source: source || 'manual',
      createdAt: now,
      tickets,
    };

    const defaultName =
      source === 'initial_plan'
        ? '📦 Initial plan'
        : source === 'move_to_pipeline'
          ? '🔒 Plan locked (Move to Pipeline)'
          : '💾 Plan snapshot';

    const { data: inserted, error } = await (supabaseAdmin as any)
      .from('versions')
      .insert({
        project_id: projectId,
        version_number: nextVersionNumber,
        name: name || defaultName,
        description: description ?? null,
        trigger: 'plan_snapshot',
        files_json: '[]',
        packages_json: null,
        kanban_json: JSON.stringify(payload),
        file_count: 0,
        total_size: 0,
      })
      .select('id, version_number, name, description, trigger, kanban_json, created_at')
      .single();

    if (error || !inserted) {
      console.error('[Plan Versions API] Error creating version:', error);
      return NextResponse.json({ error: 'Failed to create plan version' }, { status: 500 });
    }

    const parsed = safeJsonParse<any>(inserted.kanban_json, null);

    return NextResponse.json(
      {
        version: {
          id: inserted.id,
          versionNumber: inserted.version_number,
          name: inserted.name,
          description: inserted.description,
          trigger: inserted.trigger,
          createdAt: inserted.created_at,
          planId: parsed?.planId || null,
          source: parsed?.source || null,
          tickets: parsed?.tickets || [],
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[Plan Versions API] Error:', error);
    return NextResponse.json({ error: 'Failed to create plan version' }, { status: 500 });
  }
}
