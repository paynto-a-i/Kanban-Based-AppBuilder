import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { githubCommitSchema, validateAndParse, sanitizeFilePath } from '@/lib/api-validation';

async function getToken(request: NextRequest): Promise<string | null> {
    // Check Authorization header first
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }

    // Check cookie for GitHub token
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('github_access_token');
    if (tokenCookie?.value) {
        return tokenCookie.value;
    }

    return null;
}

export async function POST(request: NextRequest) {
    try {
        const token = await getToken(request);

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let body: unknown;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }

        const validation = validateAndParse(githubCommitSchema, body);
        if (!validation.success) {
            return validation.error;
        }

        const { repoFullName, branch, message, files } = validation.data;

        const sanitizedFiles = files.map(f => ({
            path: sanitizeFilePath(f.path),
            content: f.content,
        }));

        const [owner, repo] = repoFullName.split('/');
        const baseUrl = `https://api.github.com/repos/${owner}/${repo}`;

        const refResponse = await fetch(`${baseUrl}/git/refs/heads/${encodeURIComponent(branch)}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
            },
        });

        if (!refResponse.ok) {
            const repoInfoResponse = await fetch(baseUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                },
            });

            if (!repoInfoResponse.ok) {
                return NextResponse.json(
                    { error: 'Repository not found or inaccessible' },
                    { status: 404 }
                );
            }

            const repoInfo = await repoInfoResponse.json();

            const defaultRefResponse = await fetch(
                `${baseUrl}/git/refs/heads/${encodeURIComponent(repoInfo.default_branch)}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/vnd.github.v3+json',
                    },
                }
            );

            if (!defaultRefResponse.ok) {
                return NextResponse.json(
                    { error: 'Could not get default branch' },
                    { status: 500 }
                );
            }

            const defaultRef = await defaultRefResponse.json();

            const createBranchResponse = await fetch(`${baseUrl}/git/refs`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ref: `refs/heads/${branch}`,
                    sha: defaultRef.object.sha,
                }),
            });

            if (!createBranchResponse.ok) {
                const err = await createBranchResponse.json();
                return NextResponse.json(
                    { error: `Could not create branch: ${err.message}` },
                    { status: 500 }
                );
            }
        }

        const latestRefResponse = await fetch(`${baseUrl}/git/refs/heads/${encodeURIComponent(branch)}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
            },
        });

        const latestRef = await latestRefResponse.json();
        const latestCommitSha = latestRef.object.sha;

        const commitResponse = await fetch(`${baseUrl}/git/commits/${latestCommitSha}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
            },
        });

        const latestCommit = await commitResponse.json();
        const baseTreeSha = latestCommit.tree.sha;

        const treeItems = await Promise.all(
            sanitizedFiles.map(async (file) => {
                const blobResponse = await fetch(`${baseUrl}/git/blobs`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        content: file.content,
                        encoding: 'utf-8',
                    }),
                });

                const blob = await blobResponse.json();

                return {
                    path: file.path.startsWith('/') ? file.path.substring(1) : file.path,
                    mode: '100644' as const,
                    type: 'blob' as const,
                    sha: blob.sha,
                };
            })
        );

        const treeResponse = await fetch(`${baseUrl}/git/trees`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                base_tree: baseTreeSha,
                tree: treeItems,
            }),
        });

        const newTree = await treeResponse.json();

        const newCommitResponse = await fetch(`${baseUrl}/git/commits`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message,
                tree: newTree.sha,
                parents: [latestCommitSha],
            }),
        });

        const newCommit = await newCommitResponse.json();

        const updateRefResponse = await fetch(`${baseUrl}/git/refs/heads/${encodeURIComponent(branch)}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sha: newCommit.sha,
                force: false,
            }),
        });

        if (!updateRefResponse.ok) {
            const err = await updateRefResponse.json();
            return NextResponse.json(
                { error: `Failed to update branch: ${err.message}` },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            sha: newCommit.sha,
            url: `https://github.com/${repoFullName}/commit/${newCommit.sha}`,
            message: message,
            filesCommitted: sanitizedFiles.length,
        });

    } catch (error: any) {
        console.error('[GitHub Commit] Error:', error);
        return NextResponse.json(
            { error: 'Commit failed' },
            { status: 500 }
        );
    }
}
