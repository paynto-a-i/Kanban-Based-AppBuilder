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

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c77dad7d-5856-4f46-a321-cf824026609f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'H3',location:'app/api/sandbox-health/route.ts:GET:provider-resolve',message:'sandbox-health provider resolved',data:{requestedSandboxId,hasProvider:Boolean(provider),activeSandboxId:String(activeProvider?.getSandboxInfo?.()?.sandboxId||''),providerClass:String(provider?.constructor?.name||''),providerSandboxId:String(provider?.getSandboxInfo?.()?.sandboxId||''),providerId:String(provider?.getSandboxInfo?.()?.provider||'')},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

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

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c77dad7d-5856-4f46-a321-cf824026609f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'H4',location:'app/api/sandbox-health/route.ts:GET:snapshot',message:'sandbox-health snapshot',data:{sandboxId:String(snapshot?.sandboxId||''),provider:String(snapshot?.provider||''),viteRunning:snapshot?.viteRunning,missingCount:Array.isArray(snapshot?.missingPackages)?snapshot.missingPackages.length:0,missingTop:Array.isArray(snapshot?.missingPackages)?snapshot.missingPackages.slice(0,5):[],healthyForPreview:Boolean(snapshot?.healthyForPreview),enabled},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

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

