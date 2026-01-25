import { NextRequest, NextResponse } from 'next/server';
import { sandboxManager } from '@/lib/sandbox/sandbox-manager';
import { parseJavaScriptFile, buildComponentTree } from '@/lib/file-parser';
import { FileManifest, FileInfo, RouteInfo } from '@/types/file-manifest';
import type { SandboxState } from '@/types/sandbox';
import { shJoin, shQuote } from '@/lib/sandbox/sh';
// SandboxState type used implicitly through global.sandboxState

declare global {
  var activeSandboxProvider: any;
  var sandboxState: SandboxState;
}

export async function GET(request: NextRequest) {
  try {
    const requestedSandboxId = (() => {
      try {
        const url = new URL(request.url);
        return String(url.searchParams.get('sandboxId') || '').trim();
      } catch {
        return '';
      }
    })();

    const provider = requestedSandboxId
      ? sandboxManager.getProvider(requestedSandboxId) ||
        (await sandboxManager.getOrCreateProvider(requestedSandboxId))
      : sandboxManager.getActiveProvider() || global.activeSandboxProvider || global.sandboxState?.sandbox;

    if (!provider || !provider.getSandboxInfo?.()) {
      return NextResponse.json({
        success: false,
        error: requestedSandboxId ? `No sandbox provider for sandboxId: ${requestedSandboxId}` : 'No active sandbox',
      }, { status: 404 });
    }

    console.log('[get-sandbox-files] Fetching and analyzing file structure...');
    
    const RELEVANT_EXTS = new Set(['.jsx', '.js', '.tsx', '.ts', '.css', '.json']);
    const isRelevantFile = (p: string) => {
      const s = String(p || '').trim().replace(/\\/g, '/');
      const dot = s.lastIndexOf('.');
      if (dot === -1) return false;
      return RELEVANT_EXTS.has(s.slice(dot).toLowerCase());
    };

    // PERFORMANCE: Reading sandbox files via one in-sandbox Node script is far faster than
    // invoking hundreds of `wc`/`cat` commands over the provider RPC boundary.
    const MAX_FILE_BYTES = 10_000;
    const MAX_FILES = 900;
    const MAX_TOTAL_BYTES = 900_000;

    let filesContent: Record<string, string> = {};
    let structure = '';

    const nodeWalker = `
const fs = require('fs');
const path = require('path');

const RELEVANT_EXTS = new Set(['.jsx', '.js', '.tsx', '.ts', '.css', '.json']);
const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next']);

const MAX_FILE_BYTES = ${MAX_FILE_BYTES};
const MAX_FILES = ${MAX_FILES};
const MAX_TOTAL_BYTES = ${MAX_TOTAL_BYTES};

let totalBytes = 0;
const files = {};
const dirs = new Set(['.']);

function addDirs(relPath) {
  try {
    const d = path.dirname(relPath).replace(/\\\\/g, '/');
    if (!d || d === '.') return;
    const parts = d.split('/').filter(Boolean);
    let cur = '';
    for (const p of parts) {
      cur = cur ? (cur + '/' + p) : p;
      dirs.add(cur);
    }
  } catch {}
}

function walk(dir) {
  if (Object.keys(files).length >= MAX_FILES) return;
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const ent of entries) {
    if (Object.keys(files).length >= MAX_FILES) break;
    const name = ent.name;
    if (IGNORE_DIRS.has(name)) continue;
    const full = path.join(dir, name);

    if (ent.isDirectory()) {
      const relDir = full.replace(/^\\.\\/?/, '').replace(/\\\\/g, '/');
      dirs.add(relDir || '.');
      walk(full);
      continue;
    }

    if (!ent.isFile()) continue;
    const ext = path.extname(name).toLowerCase();
    if (!RELEVANT_EXTS.has(ext)) continue;

    let stat;
    try { stat = fs.statSync(full); } catch { continue; }
    if (!stat || !stat.isFile()) continue;
    if (stat.size > MAX_FILE_BYTES) continue;
    if (totalBytes + stat.size > MAX_TOTAL_BYTES) continue;

    let content = '';
    try { content = fs.readFileSync(full, 'utf8'); } catch { continue; }
    const rel = full.replace(/^\\.\\/?/, '').replace(/\\\\/g, '/');
    if (!rel) continue;
    files[rel] = content;
    totalBytes += stat.size;
    addDirs(rel);
  }
}

walk('.');

process.stdout.write(JSON.stringify({
  files,
  dirs: Array.from(dirs).filter(Boolean).sort().slice(0, 50),
  fileCount: Object.keys(files).length,
  totalBytes,
}));
`.trim();

    try {
      const nodeRes = await provider.runCommand(`node -e ${shQuote(nodeWalker)}`);
      if (nodeRes.exitCode === 0) {
        const parsed = JSON.parse(String(nodeRes.stdout || '').trim() || '{}') as any;
        if (parsed?.files && typeof parsed.files === 'object') {
          filesContent = Object.fromEntries(
            Object.entries(parsed.files as Record<string, unknown>).map(([p, c]) => [String(p), typeof c === 'string' ? c : String(c ?? '')])
          );
        }
        if (Array.isArray(parsed?.dirs)) {
          structure = (parsed.dirs as unknown[])
            .map(d => String(d || '').trim())
            .filter(Boolean)
            .slice(0, 50)
            .join('\n');
        }
      }
    } catch {
      // ignore; we'll fall back below
    }

    // Fallback: provider-native listing + direct file reads (best-effort capped to avoid timeouts).
    if (Object.keys(filesContent).length === 0) {
      let fileList: string[] = [];
      try {
        const listed = await provider.listFiles();
        fileList = (listed || []).map((p: string) => String(p || '').trim()).filter(Boolean).filter(isRelevantFile);
      } catch {
        fileList = [];
      }

      console.log('[get-sandbox-files] Fallback file listing found', fileList.length, 'files');

      const capped = fileList.slice(0, 250);
      for (const relPath of capped) {
        try {
          const content = await provider.readFile(relPath);
          if (typeof content === 'string' && content.length > 0 && content.length <= MAX_FILE_BYTES) {
            filesContent[relPath.replace(/^\.\//, '')] = content;
          }
        } catch {
          // ignore
        }
      }
    }

    console.log('[get-sandbox-files] Returning', Object.keys(filesContent).length, 'files');
    
    // Build enhanced file manifest
    const fileManifest: FileManifest = {
      files: {},
      routes: [],
      componentTree: {},
      entryPoint: '',
      styleFiles: [],
      timestamp: Date.now(),
    };
    
    // Process each file
    for (const [relativePath, content] of Object.entries(filesContent)) {
      const fullPath = `/${relativePath}`;
      
      // Create base file info
      const fileInfo: FileInfo = {
        content: content,
        type: 'utility',
        path: fullPath,
        relativePath,
        lastModified: Date.now(),
      };
      
      // Parse JavaScript/JSX files
      if (relativePath.match(/\.(jsx?|tsx?)$/)) {
        const parseResult = parseJavaScriptFile(content, fullPath);
        Object.assign(fileInfo, parseResult);
        
        // Identify entry point
        if (relativePath === 'src/main.jsx' || relativePath === 'src/index.jsx') {
          fileManifest.entryPoint = fullPath;
        }
        
        // Identify App.jsx
        if (relativePath === 'src/App.jsx' || relativePath === 'App.jsx') {
          fileManifest.entryPoint = fileManifest.entryPoint || fullPath;
        }
      }
      
      // Track style files
      if (relativePath.endsWith('.css')) {
        fileManifest.styleFiles.push(fullPath);
        fileInfo.type = 'style';
      }
      
      fileManifest.files[fullPath] = fileInfo;
    }
    
    // Build component tree
    fileManifest.componentTree = buildComponentTree(fileManifest.files);
    
    // Extract routes (simplified - looks for Route components or page pattern)
    fileManifest.routes = extractRoutes(fileManifest.files);
    
    // Update global file cache with manifest
    // Avoid cross-sandbox cache contamination: only write to the global cache when no explicit sandboxId was requested.
    if (!requestedSandboxId && global.sandboxState?.fileCache) {
      global.sandboxState.fileCache.manifest = fileManifest;
    }

    return NextResponse.json({
      success: true,
      files: filesContent,
      structure,
      fileCount: Object.keys(filesContent).length,
      manifest: fileManifest,
    });

  } catch (error) {
    console.error('[get-sandbox-files] Error:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}

function extractRoutes(files: Record<string, FileInfo>): RouteInfo[] {
  const routes: RouteInfo[] = [];
  
  // Look for React Router usage
  for (const [path, fileInfo] of Object.entries(files)) {
    if (fileInfo.content.includes('<Route') || fileInfo.content.includes('createBrowserRouter')) {
      // Extract route definitions (simplified)
      const routeMatches = fileInfo.content.matchAll(/path=["']([^"']+)["'].*(?:element|component)={([^}]+)}/g);
      
      for (const match of routeMatches) {
        const [, routePath] = match;
        // componentRef available in match but not used currently
        routes.push({
          path: routePath,
          component: path,
        });
      }
    }
    
    // Check for Next.js style pages
    if (fileInfo.relativePath.startsWith('pages/') || fileInfo.relativePath.startsWith('src/pages/')) {
      const routePath = '/' + fileInfo.relativePath
        .replace(/^(src\/)?pages\//, '')
        .replace(/\.(jsx?|tsx?)$/, '')
        .replace(/index$/, '');
        
      routes.push({
        path: routePath,
        component: path,
      });
    }
  }
  
  return routes;
}