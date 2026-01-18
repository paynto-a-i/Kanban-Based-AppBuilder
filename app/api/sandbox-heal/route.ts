import { NextRequest, NextResponse } from 'next/server';
import { sandboxManager } from '@/lib/sandbox/sandbox-manager';
import { getSandboxHealthSnapshot, installPackagesAndQueueBake } from '@/lib/sandbox/healer';

declare global {
  // eslint-disable-next-line no-var
  var activeSandboxProvider: any;
  // eslint-disable-next-line no-var
  var sandboxHealInProgressBySandbox: Record<string, boolean> | undefined;
  // eslint-disable-next-line no-var
  var sandboxLastHealAtBySandbox: Record<string, number> | undefined;
  // eslint-disable-next-line no-var
  var sandboxHealWindowBySandbox: Record<string, { windowStart: number; count: number }> | undefined;
}

const HEAL_COOLDOWN_MS = 7000;
const HEAL_WINDOW_MS = 2 * 60_000;
const HEAL_MAX_PER_WINDOW = 6;
const MAX_PACKAGES_PER_HEAL = 25;

function jsonSse(data: any): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: NextRequest) {
  const autoHealEnabled = process.env.SANDBOX_AUTO_HEAL === 'true';
  if (!autoHealEnabled) {
    return NextResponse.json(
      { success: false, error: 'Sandbox auto-heal is disabled (set SANDBOX_AUTO_HEAL=true).' },
      { status: 403 }
    );
  }

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const send = async (payload: any) => {
    await writer.write(encoder.encode(jsonSse(payload)));
  };

  (async () => {
    let sandboxKey = 'active';
    try {
      const body = await request.json().catch(() => null);
      const requestedSandboxId = String(body?.sandboxId || body?.sandbox || '').trim();
      const hintedPkgs = Array.isArray(body?.packages) ? body.packages : [];

      const activeProvider = sandboxManager.getActiveProvider() || global.activeSandboxProvider;

      let provider: any =
        requestedSandboxId
          ? sandboxManager.getProvider(requestedSandboxId) ||
            (activeProvider?.getSandboxInfo?.()?.sandboxId === requestedSandboxId ? activeProvider : null)
          : activeProvider;

      if (!provider && requestedSandboxId) {
        try {
          provider = await sandboxManager.getOrCreateProvider(requestedSandboxId);
          const info = provider?.getSandboxInfo?.();
          if (!info || info.sandboxId !== requestedSandboxId) provider = null;
        } catch {
          provider = null;
        }
      }

      if (!provider || !provider.getSandboxInfo?.()) {
        await send({
          type: 'error',
          message: requestedSandboxId ? `No sandbox provider for sandboxId: ${requestedSandboxId}` : 'No active sandbox',
        });
        return;
      }

      const info = provider.getSandboxInfo?.();
      sandboxKey = String(requestedSandboxId || info?.sandboxId || 'active');

      if (!global.sandboxHealInProgressBySandbox) global.sandboxHealInProgressBySandbox = {};
      if (!global.sandboxLastHealAtBySandbox) global.sandboxLastHealAtBySandbox = {};
      if (!global.sandboxHealWindowBySandbox) global.sandboxHealWindowBySandbox = {};

      if (global.sandboxHealInProgressBySandbox[sandboxKey]) {
        await send({ type: 'info', message: 'Heal already in progress. Waiting for it to complete…' });
        return;
      }

      const now = Date.now();
      const lastAt = global.sandboxLastHealAtBySandbox[sandboxKey] || 0;
      if (lastAt && now - lastAt < HEAL_COOLDOWN_MS) {
        const remaining = Math.ceil((HEAL_COOLDOWN_MS - (now - lastAt)) / 1000);
        await send({ type: 'info', message: `Heal cooldown active (${remaining}s).` });
        return;
      }

      const windowRec = global.sandboxHealWindowBySandbox[sandboxKey] || { windowStart: now, count: 0 };
      const windowStart = windowRec.windowStart && now - windowRec.windowStart < HEAL_WINDOW_MS ? windowRec.windowStart : now;
      const count = windowStart === windowRec.windowStart ? windowRec.count : 0;
      if (count >= HEAL_MAX_PER_WINDOW) {
        await send({
          type: 'error',
          message: 'Auto-heal is rate-limited for this sandbox (too many attempts). Consider recreating the sandbox.',
        });
        return;
      }

      global.sandboxHealInProgressBySandbox[sandboxKey] = true;
      global.sandboxLastHealAtBySandbox[sandboxKey] = now;
      global.sandboxHealWindowBySandbox[sandboxKey] = { windowStart, count: count + 1 };

      await send({ type: 'start', message: 'Checking sandbox for build issues…', sandboxId: sandboxKey });

      const before = await getSandboxHealthSnapshot(provider);

      const pkgs = Array.from(
        new Set([
          ...before.missingPackages,
          ...hintedPkgs.map((p: any) => String(p || '').trim()).filter(Boolean),
        ])
      ).slice(0, MAX_PACKAGES_PER_HEAL);

      if (pkgs.length === 0 && before.viteRunning !== false) {
        await send({ type: 'complete', healthy: true, message: 'No healing needed.', snapshot: before });
        return;
      }

      if (pkgs.length > 0) {
        await send({ type: 'step', step: 1, message: `Installing ${pkgs.length} missing package(s)…`, packages: pkgs });

        const install = await installPackagesAndQueueBake({
          provider,
          packages: pkgs,
          source: 'sandbox-heal',
        });

        if (install.stdout) {
          await send({ type: 'install-output', message: install.stdout.slice(0, 2000) });
        }
        if (!install.success) {
          await send({ type: 'error', message: install.stderr || 'Package installation failed.' });
          await send({ type: 'complete', healthy: false, snapshot: await getSandboxHealthSnapshot(provider) });
          return;
        }

        await send({ type: 'success', message: `Installed: ${install.installed.join(', ')}` });
      } else {
        await send({ type: 'step', step: 1, message: 'No missing packages detected. Attempting Vite restart…' });
      }

      await send({ type: 'step', step: 2, message: 'Restarting Vite…' });

      try {
        if (typeof provider.restartViteServer === 'function') {
          await provider.restartViteServer();
        } else {
          await provider.runCommand('pkill -f vite || true');
          await provider.runCommand('nohup npm run dev > /tmp/vite.log 2>&1 &');
          await new Promise(r => setTimeout(r, 3000));
        }
      } catch (e: any) {
        await send({ type: 'error', message: `Failed to restart Vite: ${String(e?.message || e)}` });
      }

      await send({ type: 'step', step: 3, message: 'Re-checking sandbox health…' });
      const after = await getSandboxHealthSnapshot(provider);

      await send({
        type: 'complete',
        healthy: after.healthyForPreview,
        snapshot: after,
        message: after.healthyForPreview ? 'Sandbox preview recovered.' : 'Sandbox still unhealthy after heal.',
      });
    } catch (error: any) {
      console.error('[sandbox-heal] Error:', error);
      try {
        await send({ type: 'error', message: error?.message || String(error) });
      } catch {
        // ignore
      }
    } finally {
      try {
        if (!global.sandboxHealInProgressBySandbox) global.sandboxHealInProgressBySandbox = {};
        global.sandboxHealInProgressBySandbox[sandboxKey] = false;
      } catch {
        // ignore
      }
      try {
        await writer.close();
      } catch {
        // ignore
      }
    }
  })();

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

