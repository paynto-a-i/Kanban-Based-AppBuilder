import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface DeployRequest {
  provider: 'vercel' | 'netlify';
  projectName: string;
  repoUrl?: string;
  branch?: string;
  envVars?: Record<string, string>;
}

interface VercelDeployment {
  id: string;
  url: string;
  readyState: string;
  createdAt: number;
}

interface NetlifyDeployment {
  id: string;
  url: string;
  state: string;
  created_at: string;
}

async function deployToVercel(options: {
  projectName: string;
  repoUrl?: string;
  branch?: string;
  envVars?: Record<string, string>;
}): Promise<{ success: boolean; deploymentUrl?: string; error?: string }> {
  const token = process.env.VERCEL_TOKEN;
  if (!token) {
    return { success: false, error: 'VERCEL_TOKEN not configured' };
  }

  try {
    const teamId = process.env.VERCEL_TEAM_ID;
    const baseUrl = 'https://api.vercel.com';

    let projectId: string;
    const projectRes = await fetch(
      `${baseUrl}/v9/projects?name=${encodeURIComponent(options.projectName)}${teamId ? `&teamId=${teamId}` : ''}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: options.projectName,
          gitRepository: options.repoUrl ? {
            repo: options.repoUrl,
            type: 'github',
          } : undefined,
          framework: 'nextjs',
        }),
      }
    );

    if (projectRes.ok) {
      const project = await projectRes.json();
      projectId = project.id;
    } else if (projectRes.status === 409) {
      const existingRes = await fetch(
        `${baseUrl}/v9/projects/${options.projectName}${teamId ? `?teamId=${teamId}` : ''}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!existingRes.ok) {
        return { success: false, error: 'Project exists but could not be retrieved' };
      }
      const existing = await existingRes.json();
      projectId = existing.id;
    } else {
      const error = await projectRes.json();
      return { success: false, error: error.error?.message || 'Failed to create project' };
    }

    if (options.envVars && Object.keys(options.envVars).length > 0) {
      const envPromises = Object.entries(options.envVars).map(([key, value]) =>
        fetch(
          `${baseUrl}/v10/projects/${projectId}/env${teamId ? `?teamId=${teamId}` : ''}`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              key,
              value,
              type: 'encrypted',
              target: ['production', 'preview', 'development'],
            }),
          }
        )
      );
      await Promise.allSettled(envPromises);
    }

    const deployRes = await fetch(
      `${baseUrl}/v13/deployments${teamId ? `?teamId=${teamId}` : ''}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: options.projectName,
          project: projectId,
          target: 'production',
          gitSource: options.repoUrl ? {
            type: 'github',
            repo: options.repoUrl,
            ref: options.branch || 'main',
          } : undefined,
        }),
      }
    );

    if (!deployRes.ok) {
      const error = await deployRes.json();
      return { success: false, error: error.error?.message || 'Deployment failed' };
    }

    const deployment: VercelDeployment = await deployRes.json();
    return {
      success: true,
      deploymentUrl: `https://${deployment.url}`,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function deployToNetlify(options: {
  projectName: string;
  repoUrl?: string;
  branch?: string;
}): Promise<{ success: boolean; deploymentUrl?: string; error?: string }> {
  const token = process.env.NETLIFY_TOKEN;
  if (!token) {
    return { success: false, error: 'NETLIFY_TOKEN not configured' };
  }

  try {
    const baseUrl = 'https://api.netlify.com/api/v1';

    const siteRes = await fetch(`${baseUrl}/sites`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: options.projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        repo: options.repoUrl ? {
          provider: 'github',
          repo: options.repoUrl,
          branch: options.branch || 'main',
          cmd: 'npm run build',
          dir: '.next',
        } : undefined,
      }),
    });

    if (!siteRes.ok) {
      const error = await siteRes.json();
      return { success: false, error: error.message || 'Failed to create site' };
    }

    const site = await siteRes.json();

    if (options.repoUrl) {
      const buildRes = await fetch(`${baseUrl}/sites/${site.id}/builds`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (buildRes.ok) {
        const build = await buildRes.json();
        return {
          success: true,
          deploymentUrl: site.ssl_url || site.url,
        };
      }
    }

    return {
      success: true,
      deploymentUrl: site.ssl_url || site.url,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: DeployRequest = await request.json();
    const { provider, projectName, repoUrl, branch, envVars } = body;

    if (!provider || !projectName) {
      return NextResponse.json(
        { error: 'Provider and projectName are required' },
        { status: 400 }
      );
    }

    let result;
    if (provider === 'vercel') {
      result = await deployToVercel({ projectName, repoUrl, branch, envVars });
    } else if (provider === 'netlify') {
      result = await deployToNetlify({ projectName, repoUrl, branch });
    } else {
      return NextResponse.json(
        { error: 'Invalid provider. Use "vercel" or "netlify"' },
        { status: 400 }
      );
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        provider,
        deploymentUrl: result.deploymentUrl,
        message: `Deployed to ${provider} successfully`,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[deploy] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  const vercelConfigured = !!process.env.VERCEL_TOKEN;
  const netlifyConfigured = !!process.env.NETLIFY_TOKEN;

  return NextResponse.json({
    providers: {
      vercel: { configured: vercelConfigured },
      netlify: { configured: netlifyConfigured },
    },
  });
}
