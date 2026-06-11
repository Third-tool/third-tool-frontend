import { useQuery } from '@tanstack/react-query';
import { getTodayReview } from '@/lib/api/endpoints/card';

export const TODAY_REVIEW_KEY = (dailyTarget: number) =>
  ['review-session', 'today', { dailyTarget }] as const;

export function useTodayReview(dailyTarget = 30) {
  return useQuery({
    queryKey: TODAY_REVIEW_KEY(dailyTarget),
    queryFn: () => getTodayReview({ dailyTarget }),
  });
}
