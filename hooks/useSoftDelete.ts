'use client';

import { useState, useCallback } from 'react';

interface SoftDeleteState {
  isDeleting: boolean;
  lastDeletedTicket: string | null;
  error: string | null;
}

interface SoftDeleteResult {
  success: boolean;
  processedFiles: string[];
  errors: Array<{ file: string; error: string }>;
  message: string;
}

interface TicketForSoftDelete {
  id: string;
  title: string;
  actualFiles: string[];
}

export function useSoftDelete() {
  const [state, setState] = useState<SoftDeleteState>({
    isDeleting: false,
    lastDeletedTicket: null,
    error: null,
  });

  const softDeleteTicketCode = useCallback(async (
    sandboxId: string,
    ticket: TicketForSoftDelete
  ): Promise<SoftDeleteResult | null> => {
    if (!sandboxId || !ticket.actualFiles || ticket.actualFiles.length === 0) {
      return null;
    }

    setState(prev => ({ ...prev, isDeleting: true, error: null }));

    try {
      const response = await fetch('/api/soft-delete-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sandboxId,
          files: ticket.actualFiles,
          ticketId: ticket.id,
          ticketTitle: ticket.title,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Soft delete failed');
      }

      const result: SoftDeleteResult = await response.json();

      setState(prev => ({
        ...prev,
        isDeleting: false,
        lastDeletedTicket: ticket.id,
      }));

      return result;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isDeleting: false,
        error: error.message || 'Soft delete failed',
      }));
      return null;
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

export type { SoftDeleteState, SoftDeleteResult };
