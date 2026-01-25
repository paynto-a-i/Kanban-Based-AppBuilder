import { useState, useCallback } from 'react';
import type { TicketStatus } from '@/components/kanban/types';

// Keep this aligned with the UI's rendered columns and the build lifecycle.
// Note: blocked/failed/skipped are treated as "special" states (order -1).
const STATUS_ORDER: Record<TicketStatus, number> = {
  planning: 0,
  backlog: 1,
  awaiting_input: 2,
  generating: 3,
  applying: 4,
  pr_review: 5,
  merge_queued: 6,
  rebasing: 7,
  merging: 8,
  testing: 9,
  done: 10,
  blocked: -1,
  failed: -1,
  skipped: -1,
};

interface MoveValidation {
  isValid: boolean;
  isBackward: boolean;
  requiresConfirmation: boolean;
  message?: string;
}

interface PendingMove {
  ticketId: string;
  ticketTitle: string;
  fromColumn: TicketStatus;
  toColumn: TicketStatus;
}

export function useTicketMovement() {
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);
  const [showRegressionWarning, setShowRegressionWarning] = useState(false);

  const validateMove = useCallback((
    fromColumn: TicketStatus,
    toColumn: TicketStatus,
    ticketStatus?: TicketStatus
  ): MoveValidation => {
    void ticketStatus;
    const fromOrder = STATUS_ORDER[fromColumn];
    const toOrder = STATUS_ORDER[toColumn];

    if (typeof fromOrder !== 'number' || typeof toOrder !== 'number') {
      return { isValid: false, isBackward: false, requiresConfirmation: false, message: 'Invalid column' };
    }

    if (fromColumn === toColumn) {
      return { isValid: true, isBackward: false, requiresConfirmation: false };
    }

    // Special states: allow moves in/out without sequential constraints.
    if (fromOrder < 0 || toOrder < 0) {
      return { isValid: true, isBackward: false, requiresConfirmation: false };
    }

    const isBackward = toOrder < fromOrder;

    if (isBackward) {
      if (fromColumn === 'done' || fromColumn === 'pr_review' || fromColumn === 'testing') {
        return {
          isValid: true,
          isBackward: true,
          requiresConfirmation: true,
          message: 'Moving completed work backward will revert changes',
        };
      }
      return { isValid: true, isBackward: true, requiresConfirmation: false };
    }

    // Forward move: do not allow skipping, but treat Backlog → Generating as the normal "start work" transition
    // (Awaiting Input is only applicable to tickets that require credentials).
    if (fromColumn === 'backlog' && toColumn === 'generating') {
      return { isValid: true, isBackward: false, requiresConfirmation: false };
    }

    const stepDifference = toOrder - fromOrder;
    if (stepDifference > 1) {
      return {
        isValid: false,
        isBackward: false,
        requiresConfirmation: false,
        message: 'Cannot skip columns. Tasks must progress sequentially.',
      };
    }

    return { isValid: true, isBackward: false, requiresConfirmation: false };
  }, []);

  const initiateMove = useCallback((
    ticketId: string,
    ticketTitle: string,
    fromColumn: TicketStatus,
    toColumn: TicketStatus
  ): boolean => {
    const validation = validateMove(fromColumn, toColumn);

    if (!validation.isValid) {
      return false;
    }

    if (validation.requiresConfirmation) {
      setPendingMove({ ticketId, ticketTitle, fromColumn, toColumn });
      setShowRegressionWarning(true);
      return false;
    }

    return true;
  }, [validateMove]);

  const confirmMove = useCallback(() => {
    const move = pendingMove;
    setPendingMove(null);
    setShowRegressionWarning(false);
    return move;
  }, [pendingMove]);

  const cancelMove = useCallback(() => {
    setPendingMove(null);
    setShowRegressionWarning(false);
  }, []);

  const getColumnStyle = useCallback((
    columnId: TicketStatus,
    draggedFromColumn?: TicketStatus
  ): { canDrop: boolean; isHighlighted: boolean } => {
    if (!draggedFromColumn) {
      return { canDrop: true, isHighlighted: false };
    }

    const validation = validateMove(draggedFromColumn, columnId);
    return {
      canDrop: validation.isValid,
      isHighlighted: validation.isValid && draggedFromColumn !== columnId,
    };
  }, [validateMove]);

  return {
    validateMove,
    initiateMove,
    confirmMove,
    cancelMove,
    pendingMove,
    showRegressionWarning,
    getColumnStyle,
  };
}
