import type { SandboxProvider } from '@/lib/sandbox/types';
import { queueE2BTemplateBakeCandidates } from '@/lib/e2b/template-bake-queue';

export type SandboxHealIssue =
  | { kind: 'missing_packages'; packages: string[] }
  | { kind: 'vite_not_running'; detail?: string }
  | { kind: 'vite_error'; detail: string };

export interface SandboxHealthSnapshot {
  sandboxId: string;
  provider: string | null;
  url: string | null;
  viteLogTail: string;
  viteRunning: boolean | null;
  missingPackages: string[];
  issues: SandboxHealIssue[];
  healthyForPreview: boolean;
}

function normalizeImportToPackageName(raw: string): string | null {
  const s = String(raw || '').trim();
  if (!s) return null;
  if (s.startsWith('.') || s.startsWith('/')) return null;

  if (s.startsWith('@')) {
    const parts = s.split('/');
    if (parts.length >= 2) return `${parts[0]}/${parts[1]}`;
    return s;
  }
  return s.split('/')[0] || null;
}

export function extractMissingPackagesFromText(text: string): string[] {
  const out = new Set<string>();
  const lines = String(text || '').split('\n');

  for (const line of lines) {
    const l = String(line || '');

    // Vite / Rollup
    let m = l.match(/Failed to resolve import\s+"([^"]+)"/i);
    if (m?.[1]) {
      const pkg = normalizeImportToPackageName(m[1]);
      if (pkg) out.add(pkg);
      continue;
    }

    // Vite may use single quotes depending on environment
    m = l.match(/Failed to resolve import\s+'([^']+)'/i);
    if (m?.[1]) {
      const pkg = normalizeImportToPackageName(m[1]);
      if (pkg) out.add(pkg);
      continue;
    }

    // Node ESM
    m = l.match(/Cannot find package\s+'([^']+)'/i);
    if (m?.[1]) {
      const pkg = normalizeImportToPackageName(m[1]);
      if (pkg) out.add(pkg);
      continue;
    }

    // CommonJS
    m = l.match(/Cannot find module\s+'([^']+)'/i);
    if (m?.[1]) {
      const pkg = normalizeImportToPackageName(m[1]);
      if (pkg) out.add(pkg);
      continue;
    }
  }

  return Array.from(out).filter(Boolean).slice(0, 25);
}

export async function tailViteLog(provider: SandboxProvider, lines: number = 200): Promise<string> {
  const n = Math.max(20, Math.min(500, Math.floor(lines || 200)));
  try {
    const res = await provider.runCommand(`tail -n ${n} /tmp/vite.log 2>/dev/null || true`);
    return String(res.stdout || '');
  } catch {
    return '';
  }
}

export async function checkViteRunning(provider: SandboxProvider): Promise<boolean | null> {
  // Prefer an actual HTTP probe on 127.0.0.1:5173. This is more reliable than pgrep/ps
  // because some sandbox images may not include procps.
  const nodeProbe =
    `node -e "const http=require('http');` +
    `const req=http.get('http://127.0.0.1:5173/',res=>{res.resume();});` +
    `req.on('response',()=>process.exit(0));` +
    `req.on('error',()=>process.exit(1));` +
    `req.setTimeout(1000,()=>{try{req.destroy();}catch{};process.exit(1)});" ` +
    `>/dev/null 2>&1 && echo OK || echo NO`;

  try {
    const res = await provider.runCommand(nodeProbe);
    const out = String(res.stdout || '').trim();
    if (/\bOK\b/.test(out)) return true;
    if (/\bNO\b/.test(out)) return false;
  } catch {
    // ignore and try fallbacks
  }

  // Fallback: curl probe (present in our E2B template; may exist elsewhere too).
  try {
    const res = await provider.runCommand(
      'curl -sSf --max-time 1 http://127.0.0.1:5173/ >/dev/null 2>&1 && echo OK || echo NO'
    );
    const out = String(res.stdout || '').trim();
    if (/\bOK\b/.test(out)) return true;
    if (/\bNO\b/.test(out)) return false;
  } catch {
    // ignore
  }

  // Last resort: process grep (best-effort; may not exist).
  try {
    const res = await provider.runCommand(`ps aux 2>/dev/null | grep -i '[v]ite' | head -n 1 || true`);
    const out = String(res.stdout || '').trim();
    if (out) return true;
    return false;
  } catch {
    return null;
  }
}

function extractNotableViteErrors(logTail: string): string[] {
  const text = String(logTail || '');
  if (!text) return [];

  const lines = text.split('\n');
  const out: string[] = [];

  for (const line of lines) {
    const l = String(line || '').trim();
    if (!l) continue;

    // Avoid noisy warnings.
    if (/^\s*(warn|warning)\b/i.test(l)) continue;

    // Common Vite error markers.
    if (
      /(^|\b)(error|SyntaxError|ReferenceError|TypeError)\b/i.test(l) ||
      l.includes('[plugin:vite:import-analysis]') ||
      l.includes('Failed to resolve import') ||
      l.includes('Cannot find module') ||
      l.includes('Cannot find package')
    ) {
      out.push(l.slice(0, 400));
      if (out.length >= 5) break;
    }
  }

  return out;
}

export async function getSandboxHealthSnapshot(provider: SandboxProvider): Promise<SandboxHealthSnapshot> {
  const info: any = provider?.getSandboxInfo?.() || null;
  const sandboxId = String(info?.sandboxId || '').trim();
  const providerId = String(info?.provider || '').trim() || null;
  const url = String(info?.url || '').trim() || null;

  const viteLogTail = await tailViteLog(provider, 220);
  const missingPackages = extractMissingPackagesFromText(viteLogTail);
  const viteRunning = await checkViteRunning(provider);

  const issues: SandboxHealIssue[] = [];
  if (missingPackages.length > 0) issues.push({ kind: 'missing_packages', packages: missingPackages });
  if (viteRunning === false) issues.push({ kind: 'vite_not_running' });

  const notableErrors = extractNotableViteErrors(viteLogTail);
  for (const e of notableErrors) issues.push({ kind: 'vite_error', detail: e });

  // For preview UX: only block rendering when we know it's broken.
  const healthyForPreview = missingPackages.length === 0 && viteRunning !== false;

  return {
    sandboxId,
    provider: providerId,
    url,
    viteLogTail,
    viteRunning,
    missingPackages,
    issues,
    healthyForPreview,
  };
}

export async function installPackagesAndQueueBake(args: {
  provider: SandboxProvider;
  packages: string[];
  source: string;
}): Promise<{ success: boolean; stdout: string; stderr: string; installed: string[] }> {
  const pkgs = Array.from(new Set((args.packages || []).map(p => String(p || '').trim()).filter(Boolean))).slice(0, 25);
  if (pkgs.length === 0) return { success: true, stdout: '', stderr: '', installed: [] };

  const res = await args.provider.installPackages(pkgs);

  const stdout = String(res.stdout || '');
  const stderr = String(res.stderr || '');
  const success = Boolean(res.success);

  if (success) {
    // Queue for E2B template baking even if the current sandbox provider is not E2B.
    // This makes future E2B sandboxes faster/warmer.
    void queueE2BTemplateBakeCandidates({
      packages: pkgs,
      source: args.source,
      status: 'pending',
    }).catch(() => {});
  }

  return { success, stdout, stderr, installed: success ? pkgs : [] };
}

