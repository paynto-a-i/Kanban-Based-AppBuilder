'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface RefactorResult {
  success: boolean;
  changesApplied: number;
  filesModified: string[];
  errors?: string[];
}

interface AutoRefactorState {
  isRefactoring: boolean;
  lastResult: RefactorResult | null;
  error: string | null;
}

export function useAutoRefactor() {
  const [state, setState] = useState<AutoRefactorState>({
    isRefactoring: false,
    lastResult: null,
    error: null,
  });

  // Refs for loading guards and cleanup
  const isRefactoringRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  const refactorAfterSoftDelete = useCallback(async (
    sandboxId: string,
    deletedFiles: string[],
    ticketId: string
  ): Promise<RefactorResult | null> => {
    // Guard against concurrent refactoring
    if (isRefactoringRef.current) {
      console.log('[useAutoRefactor] Refactor already in progress, skipping');
      return null;
    }

    isRefactoringRef.current = true;
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setState(prev => ({ ...prev, isRefactoring: true, error: null }));

    try {
      const response = await fetch('/api/auto-refactor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sandboxId,
          // Backward compatible: server accepts either key.
          affectedFiles: deletedFiles,
          deletedFiles,
          ticketId,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Auto-refactor failed');
      }

      const result: RefactorResult = await response.json();

      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          isRefactoring: false,
          lastResult: result,
        }));
      }

      return result;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('[useAutoRefactor] Refactor request aborted');
        return null;
      }
      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          isRefactoring: false,
          error: error.message || 'Auto-refactor failed',
        }));
      }
      return null;
    } finally {
      isRefactoringRef.current = false;
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    refactorAfterSoftDelete,
    clearError,
  };
}

export type { RefactorResult, AutoRefactorState };
