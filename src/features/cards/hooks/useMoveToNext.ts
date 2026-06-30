import { useMutation, useQueryClient } from '@tanstack/react-query';
import { moveToNextCard } from '@/lib/api/endpoints/review';
import { reviewSessionKey } from './useStartReview';
import { track } from '@/lib/analytics/track';
import type { ReviewSessionResponse } from '@/lib/api/schemas/review';

export function useMoveToNext(sessionId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => {
      if (!sessionId) throw new Error('sessionId missing');
      return moveToNextCard(sessionId);
    },
    onSuccess: (res) => {
      track('review_card_advanced', {
        sessionId: res.sessionId,
        currentIndex: res.currentIndex,
        isFinished: res.isFinished,
      });
      if (!sessionId) return;
      qc.setQueryData<ReviewSessionResponse | undefined>(
        reviewSessionKey(sessionId),
        (prev) =>
          prev
            ? {
                ...prev,
                currentIndex: res.currentIndex,
                isFinished: res.isFinished,
                currentCard: res.currentCard,
              }
            : prev,
      );
      // viewCount changes on BE — invalidate card-level caches.
      void qc.invalidateQueries({ queryKey: ['cards', 'detail'] });
      void qc.invalidateQueries({ queryKey: ['cards', 'archive'] });
      void qc.invalidateQueries({ queryKey: ['review-session', 'today'] });
    },
  });
}
