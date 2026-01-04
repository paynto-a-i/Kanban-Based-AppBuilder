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
        
        if (providerInfo && typeof provider.checkHealth === 'function') {
          const healthResult = await provider.checkHealth();
          sandboxHealthy = healthResult.healthy;
          sandboxStopped = healthResult.error === 'SANDBOX_STOPPED';
          
          if (sandboxStopped) {
            global.activeSandboxProvider = null;
            global.sandboxData = null;
            sandboxManager.clearActiveProvider?.();
          }
        } else {
          sandboxHealthy = !!providerInfo;
        }
        
        if (!sandboxStopped) {
          sandboxInfo = {
            sandboxId: providerInfo?.sandboxId || global.sandboxData?.sandboxId,
            url: providerInfo?.url || global.sandboxData?.url,
            filesTracked: global.existingFiles ? Array.from(global.existingFiles) : [],
            lastHealthCheck: new Date().toISOString()
          };
        }
      } catch (error: any) {
        console.error('[sandbox-status] Health check failed:', error);
        if (error?.message?.includes('SANDBOX_STOPPED') || error?.message?.includes('410')) {
          sandboxStopped = true;
          global.activeSandboxProvider = null;
          global.sandboxData = null;
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