import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { projectSchema, validateAndParse } from '@/lib/api-validation';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projects = await prisma.project.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        sandboxId: true,
        sandboxUrl: true,
        mode: true,
        sourceUrl: true,
        createdAt: true,
        updatedAt: true,
        githubRepo: true,
        githubBranch: true,
      },
    });

    return NextResponse.json({ projects });
  } catch (error: any) {
    console.error('[Projects API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
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

    const project = await prisma.project.create({
      data: {
        userId: session.user.id,
        name,
        description: description || null,
        sandboxId: sandboxId || null,
        sandboxUrl: sandboxUrl || null,
        mode: mode || 'prompt',
        sourceUrl: sourceUrl || null,
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error: any) {
    console.error('[Projects API] Error creating project:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Project with this name already exists' }, { status: 409 });
    }
    
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
