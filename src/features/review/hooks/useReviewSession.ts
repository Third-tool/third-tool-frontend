import { useMutation, useQueryClient } from '@tanstack/react-query';
import { startReviewFromBatch } from '@/lib/api/endpoints/review';
import { toastStore } from '@/lib/toast/toastQueue';
import { track } from '@/lib/analytics/track';
import { dailyBatchKey } from './useDailyBatch';

// product-review Epic 2 Story 2-2 · M5 신설 (2026-07-22+).
// batch 참조 세션 생성 · 진행 중 세션 있으면 자동 finish.
// previousSessionAutoFinished=true 시 <AutoFinishNoticeToast> 자동 표시.
export function useReviewSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (batchId: string) => startReviewFromBatch(batchId),
    onSuccess: (res) => {
      track('review_session_started_from_batch', {
        sessionId: res.sessionId,
        batchId: res.dailyBatchId,
        totalCardCount: res.totalCardCount,
        previousSessionAutoFinished: res.previousSessionAutoFinished,
      });
      if (res.previousSessionAutoFinished) {
        toastStore.push({
          message: '이전 세션이 정리되어 새 세션을 시작합니다.',
          tone: 'amber',
        });
      }
      void qc.invalidateQueries({ queryKey: dailyBatchKey });
    },
  });
}
