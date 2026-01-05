'use client';

import { useState, useCallback } from 'react';

interface RefactorChange {
  file: string;
  description: string;
  original: string;
  fixed: string;
}

interface RefactorResult {
  success: boolean;
  analyzedFiles: number;
  changesApplied: number;
  changes: RefactorChange[];
  summary: string;
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

  const refactorAfterSoftDelete = useCallback(async (
    sandboxId: string,
    affectedFiles: string[],
    ticketId?: string
  ): Promise<RefactorResult | null> => {
    if (!sandboxId || affectedFiles.length === 0) {
      return null;
    }

    setState(prev => ({ ...prev, isRefactoring: true, error: null }));

    try {
      const response = await fetch('/api/auto-refactor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sandboxId, affectedFiles, ticketId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Refactoring failed');
      }

      const result: RefactorResult = await response.json();

      setState(prev => ({
        ...prev,
        isRefactoring: false,
        lastResult: result,
      }));

      return result;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isRefactoring: false,
        error: error.message,
      }));
      return null;
    }
  }, []);

  const clearState = useCallback(() => {
    setState({
      isRefactoring: false,
      lastResult: null,
      error: null,
    });
  }, []);

  return {
    ...state,
    refactorAfterSoftDelete,
    clearState,
  };
}

export type { RefactorChange, RefactorResult, AutoRefactorState };
