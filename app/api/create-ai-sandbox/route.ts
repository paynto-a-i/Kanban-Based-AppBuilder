import { NextResponse } from 'next/server';
import { SandboxFactory } from '@/lib/sandbox/factory';
import type { SandboxState } from '@/types/sandbox';
import { sandboxManager } from '@/lib/sandbox/sandbox-manager';

declare global {
  var activeSandbox: any;
  var activeSandboxProvider: any;
  var sandboxData: any;
  var existingFiles: Set<string>;
  var sandboxState: SandboxState;
  var sandboxCreationInProgress: boolean;
  var sandboxCreationPromise: Promise<any> | null;
}

export async function POST() {
  if (global.sandboxCreationInProgress && global.sandboxCreationPromise) {
    console.log('[create-ai-sandbox] Sandbox creation already in progress, waiting for existing creation...');
    try {
      const existingResult = await global.sandboxCreationPromise;
      console.log('[create-ai-sandbox] Returning existing sandbox creation result');
      return NextResponse.json(existingResult);
    } catch (error) {
      console.error('[create-ai-sandbox] Existing sandbox creation failed:', error);
    }
  }

  if (global.activeSandboxProvider && global.sandboxData) {
    console.log('[create-ai-sandbox] Returning existing active sandbox');
    return NextResponse.json({
      success: true,
      sandboxId: global.sandboxData.sandboxId,
      url: global.sandboxData.url
    });
  }

  if (global.sandboxCreationInProgress) {
    return NextResponse.json(
      { error: 'Sandbox creation already in progress' },
      { status: 429 }
    );
  }

  global.sandboxCreationInProgress = true;
  global.sandboxCreationPromise = createSandboxInternal();
  
  try {
    const result = await global.sandboxCreationPromise;
    return NextResponse.json(result);
  } catch (error) {
    console.error('[create-ai-sandbox] Sandbox creation failed:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to create sandbox',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  } finally {
    global.sandboxCreationInProgress = false;
    global.sandboxCreationPromise = null;
  }
}

async function createSandboxInternal() {
  try {
    console.log('[create-ai-sandbox] Creating Modal sandbox...');
    
    await sandboxManager.terminateAll();
    
    if (global.activeSandboxProvider) {
      console.log('[create-ai-sandbox] Stopping existing sandbox...');
      try {
        await global.activeSandboxProvider.terminate();
      } catch (e) {
        console.error('Failed to stop existing sandbox:', e);
      }
      global.activeSandboxProvider = null;
      global.activeSandbox = null;
      global.sandboxData = null;
    }
    
    if (global.existingFiles) {
      global.existingFiles.clear();
    } else {
      global.existingFiles = new Set<string>();
    }

    const provider = SandboxFactory.create();
    const sandboxInfo = await provider.createSandbox();
    
    console.log('[create-ai-sandbox] Setting up Vite React app...');
    await provider.setupViteApp();
    
    sandboxManager.registerSandbox(sandboxInfo.sandboxId, provider);
    
    global.activeSandboxProvider = provider;
    global.activeSandbox = provider;
    global.sandboxData = {
      sandboxId: sandboxInfo.sandboxId,
      url: sandboxInfo.url
    };
    
    global.sandboxState = {
      fileCache: {
        files: {},
        lastSync: Date.now(),
        sandboxId: sandboxInfo.sandboxId
      },
      sandbox: provider,
      sandboxData: {
        sandboxId: sandboxInfo.sandboxId,
        url: sandboxInfo.url
      }
    };
    
    global.existingFiles.add('src/App.jsx');
    global.existingFiles.add('src/main.jsx');
    global.existingFiles.add('src/index.css');
    global.existingFiles.add('index.html');
    global.existingFiles.add('package.json');
    global.existingFiles.add('vite.config.js');
    global.existingFiles.add('tailwind.config.js');
    global.existingFiles.add('postcss.config.js');
    
    console.log('[create-ai-sandbox] Sandbox ready at:', sandboxInfo.url);
    
    const result = {
      success: true,
      sandboxId: sandboxInfo.sandboxId,
      url: sandboxInfo.url,
      message: 'Modal sandbox created and Vite React app initialized'
    };
    
    global.sandboxData = {
      ...global.sandboxData,
      ...result
    };
    
    return result;

  } catch (error) {
    console.error('[create-ai-sandbox] Error:', error);
    
    global.activeSandboxProvider = null;
    global.activeSandbox = null;
    global.sandboxData = null;
    
    throw error;
  }
}
