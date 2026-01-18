import { NextRequest, NextResponse } from 'next/server';
import { sandboxManager } from '@/lib/sandbox/sandbox-manager';
import { getSandboxHealthSnapshot } from '@/lib/sandbox/healer';

declare global {
  // Legacy global state used in other routes
  // eslint-disable-next-line no-var
  var activeSandboxProvider: any;
}

function getRequestedSandboxId(request: NextRequest): string {
  try {
    const url = new URL(request.url);
    return String(url.searchParams.get('sandboxId') || '').trim();
  } catch {
    return '';
  }
}

export async function GET(request: NextRequest) {
  try {
    const requestedSandboxId = getRequestedSandboxId(request);

    const activeProvider = sandboxManager.getActiveProvider() || global.activeSandboxProvider;

    let provider: any =
      requestedSandboxId
        ? sandboxManager.getProvider(requestedSandboxId) ||
          (activeProvider?.getSandboxInfo?.()?.sandboxId === requestedSandboxId ? activeProvider : null)
        : activeProvider;

    // Best-effort: if not registered in this process, try to reconnect by sandboxId.
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
      return NextResponse.json(
        {
          success: false,
          error: requestedSandboxId ? `No sandbox provider for sandboxId: ${requestedSandboxId}` : 'No active sandbox',
        },
        { status: requestedSandboxId ? 404 : 400 }
      );
    }

    const enabled = {
      autoHeal: process.env.SANDBOX_AUTO_HEAL === 'true',
      hideViteOverlay: process.env.SANDBOX_HIDE_VITE_OVERLAY === 'true',
    };

    const snapshot = await getSandboxHealthSnapshot(provider);

    return NextResponse.json({
      success: true,
      enabled,
      healthy: snapshot.healthyForPreview,
      snapshot,
      message: snapshot.healthyForPreview ? 'Sandbox preview is healthy' : 'Sandbox preview needs healing',
    });
  } catch (error) {
    console.error('[sandbox-health] Error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

