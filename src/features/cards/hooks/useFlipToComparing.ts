import { useMutation, useQueryClient } from '@tanstack/react-query';
import { flipToComparing } from '@/lib/api/endpoints/review';
import { reviewSessionKey } from './useStartReview';
import { track } from '@/lib/analytics/track';
import type { ReviewSessionResponse } from '@/lib/api/schemas/review';

export function useFlipToComparing(sessionId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => {
      if (!sessionId) throw new Error('sessionId missing');
      return flipToComparing(sessionId);
    },
    onSuccess: (card) => {
      track('review_card_comparing', { cardId: card.cardId });
      if (!sessionId) return;
      qc.setQueryData<ReviewSessionResponse | undefined>(
        reviewSessionKey(sessionId),
        (prev) => (prev ? { ...prev, currentCard: card } : prev),
      );
    },
  });
}
