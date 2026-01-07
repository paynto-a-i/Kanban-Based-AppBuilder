'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { getGitHubConnection, commitFiles, isGitHubConnected } from '@/lib/versioning/github';

interface TicketForSync {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: string;
}

interface GitSyncState {
  isEnabled: boolean;
  isSyncing: boolean;
  lastSyncedTicketId: string | null;
  lastCommitSha: string | null;
  lastCommitUrl: string | null;
  error: string | null;
  syncHistory: SyncHistoryItem[];
}

interface SyncHistoryItem {
  ticketId: string;
  ticketTitle: string;
  commitSha: string;
  commitUrl: string;
  timestamp: string;
}

interface GitSyncOptions {
  repoFullName: string;
  branch: string;
  onSyncComplete?: (result: { ticketId: string; commitSha: string; commitUrl: string }) => void;
  onSyncError?: (error: string, ticketId: string) => void;
}

const SYNC_STORAGE_KEY = 'paynto-ai:git-sync-config';

export function useGitSync(options?: Partial<GitSyncOptions>) {
  const [state, setState] = useState<GitSyncState>({
    isEnabled: false,
    isSyncing: false,
    lastSyncedTicketId: null,
    lastCommitSha: null,
    lastCommitUrl: null,
    error: null,
    syncHistory: [],
  });

  // Refs for loading guards and cleanup
  const isSyncingRef = useRef(false);
  const configRef = useRef<GitSyncOptions | null>(null);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadConfig = useCallback((): GitSyncOptions | null => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(SYNC_STORAGE_KEY);
      if (stored) {
        const config = JSON.parse(stored);
        configRef.current = { ...config, ...options };
        return configRef.current;
      }
    } catch {
      // Ignore parse errors
    }
    return options as GitSyncOptions || null;
  }, [options]);

  const saveConfig = useCallback((config: Partial<GitSyncOptions>) => {
    if (typeof window === 'undefined') return;
    const existing = loadConfig() || {};
    const updated = { ...existing, ...config };
    localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(updated));
    configRef.current = updated as GitSyncOptions;
  }, [loadConfig]);

  const enableSync = useCallback((repoFullName: string, branch: string = 'main') => {
    if (!isGitHubConnected()) {
      setState(prev => ({ ...prev, error: 'GitHub not connected' }));
      return false;
    }

    saveConfig({ repoFullName, branch });
    setState(prev => ({ ...prev, isEnabled: true, error: null }));
    return true;
  }, [saveConfig]);

  const disableSync = useCallback(() => {
    setState(prev => ({ ...prev, isEnabled: false }));
  }, []);

  const syncTicketCompletion = useCallback(async (
    ticket: TicketForSync,
    files: Array<{ path: string; content: string }>
  ): Promise<boolean> => {
    const config = configRef.current || loadConfig();

    if (!config?.repoFullName || !state.isEnabled) {
      return false;
    }

    if (!isGitHubConnected()) {
      if (mountedRef.current) {
        setState(prev => ({ ...prev, error: 'GitHub not connected' }));
      }
      return false;
    }

    // Guard against concurrent syncs
    if (isSyncingRef.current) {
      console.log('[useGitSync] Sync already in progress, skipping');
      return false;
    }

    isSyncingRef.current = true;
    setState(prev => ({ ...prev, isSyncing: true, error: null }));

    try {
      const commitMessage = generateCommitMessage(ticket);

      const result = await commitFiles({
        repoFullName: config.repoFullName,
        branch: config.branch || 'main',
        message: commitMessage,
        files: files.map(f => ({
          path: f.path,
          content: f.content,
          mode: 'update' as const,
        })),
      });

      if (result.success && result.sha && result.url) {
        const historyItem: SyncHistoryItem = {
          ticketId: ticket.id,
          ticketTitle: ticket.title,
          commitSha: result.sha,
          commitUrl: result.url,
          timestamp: new Date().toISOString(),
        };

        if (mountedRef.current) {
          setState(prev => ({
            ...prev,
            isSyncing: false,
            lastSyncedTicketId: ticket.id,
            lastCommitSha: result.sha!,
            lastCommitUrl: result.url!,
            syncHistory: [historyItem, ...prev.syncHistory.slice(0, 49)],
          }));
        }

        options?.onSyncComplete?.({
          ticketId: ticket.id,
          commitSha: result.sha,
          commitUrl: result.url,
        });

        return true;
      } else {
        throw new Error(result.error || 'Commit failed');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to sync to GitHub';
      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          isSyncing: false,
          error: errorMessage,
        }));
      }
      options?.onSyncError?.(errorMessage, ticket.id);
      return false;
    } finally {
      isSyncingRef.current = false;
    }
  }, [state.isEnabled, loadConfig, options]);

  const syncAllChanges = useCallback(async (
    files: Array<{ path: string; content: string }>,
    message: string
  ): Promise<boolean> => {
    const config = configRef.current || loadConfig();

    if (!config?.repoFullName) {
      if (mountedRef.current) {
        setState(prev => ({ ...prev, error: 'Git sync not configured' }));
      }
      return false;
    }

    if (!isGitHubConnected()) {
      if (mountedRef.current) {
        setState(prev => ({ ...prev, error: 'GitHub not connected' }));
      }
      return false;
    }

    // Guard against concurrent syncs
    if (isSyncingRef.current) {
      console.log('[useGitSync] Sync already in progress, skipping');
      return false;
    }

    isSyncingRef.current = true;
    setState(prev => ({ ...prev, isSyncing: true, error: null }));

    try {
      const result = await commitFiles({
        repoFullName: config.repoFullName,
        branch: config.branch || 'main',
        message,
        files: files.map(f => ({
          path: f.path,
          content: f.content,
          mode: 'update' as const,
        })),
      });

      if (result.success && result.sha) {
        if (mountedRef.current) {
          setState(prev => ({
            ...prev,
            isSyncing: false,
            lastCommitSha: result.sha!,
            lastCommitUrl: result.url!,
          }));
        }
        return true;
      } else {
        throw new Error(result.error || 'Commit failed');
      }
    } catch (error: any) {
      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          isSyncing: false,
          error: error.message || 'Failed to sync',
        }));
      }
      return false;
    } finally {
      isSyncingRef.current = false;
    }
  }, [loadConfig]);

  return {
    ...state,
    enableSync,
    disableSync,
    syncTicketCompletion,
    syncAllChanges,
    isGitHubConnected: isGitHubConnected(),
    loadConfig,
  };
}

function generateCommitMessage(ticket: TicketForSync): string {
  const typeEmoji: Record<string, string> = {
    component: '🧩',
    feature: '✨',
    layout: '📐',
    styling: '🎨',
    integration: '🔗',
    config: '⚙️',
    database: '🗄️',
  };

  const emoji = typeEmoji[ticket.type] || '📦';
  const type = ticket.type.charAt(0).toUpperCase() + ticket.type.slice(1);

  return `${emoji} ${type}: ${ticket.title}

${ticket.description}

Ticket ID: ${ticket.id}
Priority: ${ticket.priority}

🤖 Auto-committed by Paynto A.I.`;
}

export type { GitSyncState, SyncHistoryItem, GitSyncOptions };
