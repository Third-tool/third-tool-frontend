import { useMutation, useQueryClient } from '@tanstack/react-query';
import { extendSession } from '@/lib/api/endpoints/card';
import { track } from '@/lib/analytics/track';
import { TODAY_REVIEW_KEY } from './useTodayReview';

export function useExtendSession(dailyTarget = 30) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (count: number) => extendSession({ count }),
    onSuccess: (res, count) => {
      track('review_session_extended', {
        requestedCount: count,
        completedAll: res.completedAll,
      });
      qc.invalidateQueries({ queryKey: TODAY_REVIEW_KEY(dailyTarget) });
    },
  });
}
