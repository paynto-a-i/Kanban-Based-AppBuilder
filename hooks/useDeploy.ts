'use client';

import { useState, useCallback, useEffect } from 'react';

type DeployProvider = 'vercel' | 'netlify';

interface DeployState {
  isDeploying: boolean;
  lastDeployment: {
    provider: DeployProvider;
    url: string;
    timestamp: string;
  } | null;
  error: string | null;
  availableProviders: {
    vercel: boolean;
    netlify: boolean;
  };
}

interface DeployOptions {
  provider: DeployProvider;
  projectName: string;
  repoUrl?: string;
  branch?: string;
  envVars?: Record<string, string>;
  templateTarget?: 'vite' | 'next';
  target?: 'preview' | 'production';
}

export function useDeploy() {
  const [state, setState] = useState<DeployState>({
    isDeploying: false,
    lastDeployment: null,
    error: null,
    availableProviders: {
      vercel: false,
      netlify: false,
    },
  });

  useEffect(() => {
    async function checkProviders() {
      try {
        const res = await fetch('/api/deploy');
        if (res.ok) {
          const data = await res.json();
          setState(prev => ({
            ...prev,
            availableProviders: {
              vercel: data.providers.vercel.configured,
              netlify: data.providers.netlify.configured,
            },
          }));
        }
      } catch (error) {
        console.error('[useDeploy] Failed to check providers:', error);
      }
    }
    checkProviders();
  }, []);

  const deploy = useCallback(async (options: DeployOptions): Promise<string | null> => {
    setState(prev => ({ ...prev, isDeploying: true, error: null }));

    try {
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Deployment failed');
      }

      setState(prev => ({
        ...prev,
        isDeploying: false,
        lastDeployment: {
          provider: options.provider,
          url: data.deploymentUrl,
          timestamp: new Date().toISOString(),
        },
      }));

      return data.deploymentUrl;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isDeploying: false,
        error: error.message || 'Deployment failed',
      }));
      return null;
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    deploy,
    clearError,
  };
}

export type { DeployProvider, DeployState, DeployOptions };
