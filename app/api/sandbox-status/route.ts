import { NextResponse } from 'next/server';
import { sandboxManager } from '@/lib/sandbox/sandbox-manager';

declare global {
  var activeSandboxProvider: any;
  var sandboxData: any;
  var existingFiles: Set<string>;
}

export async function GET() {
  try {
    const provider = sandboxManager.getActiveProvider() || global.activeSandboxProvider;
    const sandboxExists = !!provider;

    let sandboxHealthy = false;
    let sandboxInfo = null;
    let sandboxStopped = false;

    if (sandboxExists && provider) {
      try {
        const providerInfo = provider.getSandboxInfo();
        const url = providerInfo?.url || global.sandboxData?.url;

        // Health check: prefer provider-level check (detects SANDBOX_STOPPED), then use URL probe to get status code.
        let healthStatusCode: number | null = null;
        let healthError: string | undefined;

        if (providerInfo && typeof provider.checkHealth === 'function') {
          const healthResult = await provider.checkHealth();
          sandboxHealthy = healthResult.healthy;
          if (!sandboxHealthy && healthResult.error) {
            healthError = healthResult.error;
          }
          sandboxStopped = healthResult.error === 'SANDBOX_STOPPED';
        } else {
          sandboxHealthy = !!providerInfo;
        }

        // Probe sandbox URL to detect stopped sandboxes (410) and surface status code for debugging.
        if (url) {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 3000);
          try {
            const res = await fetch(url, {
              method: 'HEAD',
              cache: 'no-store',
              signal: controller.signal,
            });

            healthStatusCode = res.status;

            if (res.status === 410) {
              sandboxHealthy = false;
              sandboxStopped = true;
              healthError = 'SANDBOX_STOPPED';
            } else {
              sandboxHealthy = res.ok;
              if (!res.ok && !healthError) {
                healthError = `HTTP ${res.status}`;
              }
            }
          } catch (err) {
            sandboxHealthy = false;
            healthError = healthError || (err instanceof Error ? err.message : String(err));
          } finally {
            clearTimeout(timer);
          }
        } else if (!healthError) {
          healthError = 'No sandbox URL available';
        }

        if (sandboxStopped) {
          global.activeSandboxProvider = null;
          global.sandboxData = null;
          sandboxManager.clearActiveProvider();
          sandboxInfo = null;
        } else {
          sandboxInfo = {
            sandboxId: providerInfo?.sandboxId || global.sandboxData?.sandboxId,
            url,
            filesTracked: global.existingFiles ? Array.from(global.existingFiles) : [],
            lastHealthCheck: new Date().toISOString(),
            healthStatusCode,
            healthError,
          };
        }
      } catch (error: any) {
        console.error('[sandbox-status] Health check failed:', error);
        if (error?.message?.includes('SANDBOX_STOPPED') || error?.message?.includes('410')) {
          sandboxStopped = true;
          global.activeSandboxProvider = null;
          global.sandboxData = null;
          sandboxManager.clearActiveProvider();
        }
        sandboxHealthy = false;
      }
    }
    
    return NextResponse.json({
      success: true,
      active: sandboxExists && !sandboxStopped,
      healthy: sandboxHealthy,
      sandboxStopped,
      sandboxData: sandboxInfo,
      message: sandboxStopped
        ? 'Sandbox has stopped - please create a new one'
        : sandboxHealthy 
          ? 'Sandbox is active and healthy' 
          : sandboxExists 
            ? 'Sandbox exists but is not responding' 
            : 'No active sandbox'
    });
    
  } catch (error) {
    console.error('[sandbox-status] Error:', error);
    return NextResponse.json({ 
      success: false,
      active: false,
      error: (error as Error).message 
    }, { status: 500 });
  }
}