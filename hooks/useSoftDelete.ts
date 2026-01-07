'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface SoftDeleteResult {
  success: boolean;
  processedFiles: string[];
  errors?: string[];
}

interface SoftDeleteState {
  isDeleting: boolean;
  lastResult: SoftDeleteResult | null;
  error: string | null;
}

interface TicketForDelete {
  id: string;
  title: string;
  actualFiles: string[];
}

export function useSoftDelete() {
  const [state, setState] = useState<SoftDeleteState>({
    isDeleting: false,
    lastResult: null,
    error: null,
  });

  // Refs for loading guards and cleanup
  const isDeletingRef = useRef(false);
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

  const softDeleteTicketCode = useCallback(async (
    sandboxId: string,
    ticket: TicketForDelete
  ): Promise<SoftDeleteResult | null> => {
    // Guard against concurrent deletions
    if (isDeletingRef.current) {
      console.log('[useSoftDelete] Delete already in progress, skipping');
      return null;
    }

    isDeletingRef.current = true;
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setState(prev => ({ ...prev, isDeleting: true, error: null }));

    try {
      const response = await fetch('/api/soft-delete-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sandboxId,
          ticketId: ticket.id,
          ticketTitle: ticket.title,
          files: ticket.actualFiles,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Soft delete failed');
      }

      const result: SoftDeleteResult = await response.json();

      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          isDeleting: false,
          lastResult: result,
        }));
      }

      return result;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('[useSoftDelete] Delete request aborted');
        return null;
      }
      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          isDeleting: false,
          error: error.message || 'Soft delete failed',
        }));
      }
      return null;
    } finally {
      isDeletingRef.current = false;
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    softDeleteTicketCode,
    clearError,
  };
}

export type { SoftDeleteResult, SoftDeleteState };
