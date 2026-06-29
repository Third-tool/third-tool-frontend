import { useMutation, useQueryClient } from '@tanstack/react-query';
import { startReviewSession } from '@/lib/api/endpoints/review';
import { track } from '@/lib/analytics/track';

export const reviewSessionKey = (sessionId: string) =>
  ['reviews', sessionId] as const;

export function useStartReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (deckId: string) => startReviewSession(deckId),
    onSuccess: (res) => {
      track('review_session_started', {
        sessionId: res.sessionId,
        deckId: res.deckId,
        totalCardCount: res.totalCardCount,
      });
      qc.setQueryData(reviewSessionKey(res.sessionId), res);
    },
  });
}
