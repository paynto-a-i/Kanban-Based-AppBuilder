'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { KanbanTicket } from '@/components/kanban/types';

export type PlanSnapshotSource = 'initial_plan' | 'move_to_pipeline' | 'manual';

export interface PlanVersion {
  id: string;
  planId: string | null;
  source: PlanSnapshotSource;
  name: string;
  description: string | null;
  createdAt: string; // ISO
  tickets: KanbanTicket[];
  storage: 'local' | 'supabase';
  versionNumber?: number;
}

interface UsePlanVersionsOptions {
  planId?: string | null;
  projectId?: string | null;
}

const LOCAL_KEY_PREFIX = 'paynto-ai:plan-versions:';

function getLocalKey(planId: string) {
  return `${LOCAL_KEY_PREFIX}${planId}`;
}

function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function generateLocalId() {
  return `pv_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function stripRuntimeFields(ticket: KanbanTicket): KanbanTicket {
  // Keep the plan semantics; drop large/runtime-only fields for snapshots.
  const { generatedCode, startedAt, completedAt, updatedAt, duration, ...rest } = ticket;
  void generatedCode;
  void startedAt;
  void completedAt;
  void updatedAt;
  void duration;

  // Ensure dates don't sneak in as non-serializable values
  return {
    ...rest,
    // Normalize fields that are often mutated during build execution
    progress: typeof rest.progress === 'number' ? rest.progress : 0,
    retryCount: typeof rest.retryCount === 'number' ? rest.retryCount : 0,
    actualFiles: Array.isArray(rest.actualFiles) ? rest.actualFiles : [],
    previewAvailable: !!rest.previewAvailable,
  };
}

export function usePlanVersions(options: UsePlanVersionsOptions) {
  const planId = options.planId || 'active';
  const projectId = options.projectId || null;

  const [versions, setVersions] = useState<PlanVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLocal = useCallback((targetPlanId?: string | null): PlanVersion[] => {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(getLocalKey(targetPlanId || planId));
    return safeJsonParse<PlanVersion[]>(raw, []);
  }, [planId]);

  const saveLocal = useCallback((next: PlanVersion[], targetPlanId?: string | null) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(getLocalKey(targetPlanId || planId), JSON.stringify(next.slice(0, 50)));
  }, [planId]);

  const refresh = useCallback(async () => {
    setError(null);

    // Prefer Supabase if a project is present; fall back to local storage.
    if (projectId) {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/plan-versions?projectId=${encodeURIComponent(projectId)}`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Failed to fetch plan versions (${res.status})`);
        }

        const data = await res.json();
        const remote: PlanVersion[] = (data.versions || []).map((v: any) => ({
          id: v.id,
          versionNumber: v.versionNumber,
          name: v.name,
          description: v.description ?? null,
          createdAt: v.createdAt,
          source: (v.source || 'manual') as PlanSnapshotSource,
          planId: v.planId ?? null,
          tickets: (v.tickets || []) as KanbanTicket[],
          storage: 'supabase' as const,
        }));

        setVersions(remote);
        return;
      } catch (e: any) {
        setError(e?.message || 'Failed to load plan versions from server');
        // fall through to local
      } finally {
        setIsLoading(false);
      }
    }

    // Local fallback
    const local = loadLocal();
    setVersions(local);
  }, [loadLocal, projectId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createSnapshot = useCallback(
    async (args: {
      source: PlanSnapshotSource;
      name?: string;
      description?: string | null;
      tickets: KanbanTicket[];
      planIdOverride?: string | null;
    }): Promise<PlanVersion | null> => {
      const snapshotTickets = (args.tickets || []).map(stripRuntimeFields);
      if (snapshotTickets.length === 0) return null;

      setError(null);

      // Try server-backed snapshot first when available.
      if (projectId) {
        try {
          const res = await fetch('/api/plan-versions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId,
              planId: args.planIdOverride ?? planId,
              source: args.source,
              name: args.name,
              description: args.description ?? null,
              tickets: snapshotTickets,
            }),
          });

          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || `Failed to create plan version (${res.status})`);
          }

          const data = await res.json();
          const v = data.version;
          const created: PlanVersion = {
            id: v.id,
            versionNumber: v.versionNumber,
            name: v.name,
            description: v.description ?? null,
            createdAt: v.createdAt,
            source: (v.source || args.source) as PlanSnapshotSource,
            planId: v.planId ?? (args.planIdOverride ?? planId),
            tickets: (v.tickets || snapshotTickets) as KanbanTicket[],
            storage: 'supabase',
          };

          setVersions(prev => [created, ...prev.filter(p => p.id !== created.id)]);
          return created;
        } catch (e: any) {
          setError(e?.message || 'Failed to save plan version to server (saved locally instead)');
          // fall through to local snapshot
        }
      }

      const createdAt = new Date().toISOString();
      const targetPlanId = args.planIdOverride ?? planId;
      const created: PlanVersion = {
        id: generateLocalId(),
        versionNumber: undefined,
        name:
          args.name ||
          (args.source === 'initial_plan'
            ? '📦 Initial plan'
            : args.source === 'move_to_pipeline'
              ? '🔒 Plan locked (Move to Pipeline)'
              : '💾 Plan snapshot'),
        description: args.description ?? null,
        createdAt,
        source: args.source,
        planId: targetPlanId,
        tickets: snapshotTickets,
        storage: 'local',
      };

      const existingForTarget = loadLocal(targetPlanId);
      const nextForTarget = [created, ...existingForTarget].slice(0, 50);
      saveLocal(nextForTarget, targetPlanId);

      // Only update in-memory list if we're still viewing that same planId.
      if (targetPlanId === planId) {
        setVersions(nextForTarget);
      }

      return created;
    },
    [planId, projectId, loadLocal, saveLocal]
  );

  const hasVersions = useMemo(() => versions.length > 0, [versions.length]);

  return {
    planId,
    projectId,
    versions,
    hasVersions,
    isLoading,
    error,
    refresh,
    createSnapshot,
  };
}


