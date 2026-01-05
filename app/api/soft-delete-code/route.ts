import { NextRequest, NextResponse } from 'next/server';
import { sandboxManager } from '@/lib/sandbox/sandbox-manager';

export const dynamic = 'force-dynamic';

declare global {
  var activeSandboxProvider: any;
}

interface SoftDeleteRequest {
  sandboxId: string;
  files: string[];
  ticketId: string;
  ticketTitle: string;
}

function commentOutCode(content: string, language: string, ticketInfo: string): string {
  const timestamp = new Date().toISOString();
  const headerComment = `SOFT DELETED - Ticket: ${ticketInfo} - ${timestamp}`;
  
  const lines = content.split('\n');
  
  if (['tsx', 'ts', 'jsx', 'js', 'javascript', 'typescript'].includes(language)) {
    return `/*\n * ${headerComment}\n * This code was soft-deleted during a ticket revert.\n * Uncomment to restore functionality.\n */\n\n${lines.map(line => `// ${line}`).join('\n')}`;
  }
  
  if (['css', 'scss', 'less'].includes(language)) {
    return `/*\n * ${headerComment}\n * This code was soft-deleted during a ticket revert.\n */\n\n${lines.map(line => `/* ${line} */`).join('\n')}`;
  }
  
  if (['html'].includes(language)) {
    return `<!--\n  ${headerComment}\n  This code was soft-deleted during a ticket revert.\n-->\n\n${lines.map(line => `<!-- ${line} -->`).join('\n')}`;
  }
  
  if (['json'].includes(language)) {
    return `${content}\n`;
  }
  
  return `/*\n * ${headerComment}\n */\n\n${lines.map(line => `// ${line}`).join('\n')}`;
}

function getLanguageFromPath(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  const extMap: Record<string, string> = {
    tsx: 'tsx',
    ts: 'ts',
    jsx: 'jsx',
    js: 'js',
    css: 'css',
    scss: 'scss',
    less: 'less',
    html: 'html',
    json: 'json',
  };
  return extMap[ext] || 'js';
}

export async function POST(request: NextRequest) {
  try {
    const body: SoftDeleteRequest = await request.json();
    const { sandboxId, files, ticketId, ticketTitle } = body;

    if (!sandboxId) {
      return NextResponse.json({ error: 'Sandbox ID required' }, { status: 400 });
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files specified' }, { status: 400 });
    }

    const provider = global.activeSandboxProvider || await sandboxManager.getOrCreateProvider(sandboxId);
    if (!provider) {
      return NextResponse.json({ error: 'No active sandbox found' }, { status: 400 });
    }

    const ticketInfo = `${ticketTitle} (${ticketId})`;
    const processedFiles: string[] = [];
    const errors: Array<{ file: string; error: string }> = [];

    for (const filePath of files) {
      try {
        const normalizedPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
        
        let content: string;
        try {
          content = await provider.readFile(normalizedPath);
        } catch (readError) {
          errors.push({ file: filePath, error: 'File not found or unreadable' });
          continue;
        }

        const language = getLanguageFromPath(filePath);
        const commentedCode = commentOutCode(content, language, ticketInfo);

        await provider.writeFile(normalizedPath, commentedCode);
        processedFiles.push(filePath);
      } catch (fileError: any) {
        errors.push({ file: filePath, error: fileError.message || 'Failed to process' });
      }
    }

    return NextResponse.json({
      success: true,
      processedFiles,
      errors,
      message: `Soft deleted ${processedFiles.length} file(s)`,
    });
  } catch (error: any) {
    console.error('[soft-delete-code] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
