'use client';

import { useState, useCallback } from 'react';

interface ReviewIssue {
  severity: 'error' | 'warning' | 'info';
  type: string;
  file: string;
  line?: number;
  message: string;
  suggestion?: string;
}

interface ReviewResult {
  passed: boolean;
  score: number;
  issues: ReviewIssue[];
  summary: string;
  improvements: string[];
}

interface BugbotState {
  isReviewing: boolean;
  lastReview: ReviewResult | null;
  reviewHistory: Array<{
    ticketId: string;
    ticketTitle: string;
    result: ReviewResult;
    timestamp: string;
  }>;
  error: string | null;
}

interface TicketReview {
  ticketId: string;
  ticketTitle: string;
  files: Array<{ path: string; content: string }>;
}

export function useBugbot() {
  const [state, setState] = useState<BugbotState>({
    isReviewing: false,
    lastReview: null,
    reviewHistory: [],
    error: null,
  });

  const reviewCode = useCallback(async (review: TicketReview): Promise<ReviewResult | null> => {
    setState(prev => ({ ...prev, isReviewing: true, error: null }));

    try {
      const response = await fetch('/api/review-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: review.files,
          ticketId: review.ticketId,
          ticketTitle: review.ticketTitle,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Review failed');
      }

      const result: ReviewResult = await response.json();

      const historyItem = {
        ticketId: review.ticketId,
        ticketTitle: review.ticketTitle,
        result,
        timestamp: new Date().toISOString(),
      };

      setState(prev => ({
        ...prev,
        isReviewing: false,
        lastReview: result,
        reviewHistory: [historyItem, ...prev.reviewHistory.slice(0, 19)],
      }));

      return result;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isReviewing: false,
        error: error.message || 'Review failed',
      }));
      return null;
    }
  }, []);

  const clearLastReview = useCallback(() => {
    setState(prev => ({ ...prev, lastReview: null }));
  }, []);

  const getReviewForTicket = useCallback((ticketId: string) => {
    return state.reviewHistory.find(r => r.ticketId === ticketId)?.result ?? null;
  }, [state.reviewHistory]);

  return {
    ...state,
    reviewCode,
    clearLastReview,
    getReviewForTicket,
  };
}

export type { ReviewIssue, ReviewResult, BugbotState };
