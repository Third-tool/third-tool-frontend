import { useMutation, useQueryClient } from '@tanstack/react-query';
import { recordView } from '@/lib/api/endpoints/review';
import { toastStore } from '@/lib/toast/toastQueue';
import { track } from '@/lib/analytics/track';
import { dailyBatchKey } from './useDailyBatch';

// product-review Epic 2 Story 2-3 · M5 신설 (2026-07-22+).
// 카드 clear 기록 · BE가 card.recordView + batch.markViewed 동시 처리.
// 성공 시 batch progress 갱신 · toast "clear!".
export function useMarkViewed(sessionId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cardId: string) => {
      if (!sessionId) throw new Error('sessionId missing');
      return recordView(sessionId, cardId);
    },
    onSuccess: (res) => {
      track('review_card_recorded', {
        sessionId: res.sessionId,
        cardId: res.cardId,
        batchViewedCount: res.batchViewedCount,
        batchTotalCount: res.batchTotalCount,
      });
      toastStore.push({ message: 'clear!', tone: 'cream' });
      // batch 응답 진행률 즉시 갱신.
      void qc.invalidateQueries({ queryKey: dailyBatchKey });
    },
  });
}
