import { useQuery } from '@tanstack/react-query';
import { fetchTodayBatch } from '@/lib/api/endpoints/dailyBatch';

// product-review (FE) Epic 1 Story 1-1 · M5 신설 (2026-07-22+).
// /review 진입 시 오늘 batch lazy 생성 (idempotent) · staleTime 5분.
export const dailyBatchKey = ['daily-batch', 'today'] as const;

export function useDailyBatch(enabled = true) {
  return useQuery({
    queryKey: dailyBatchKey,
    queryFn: fetchTodayBatch,
    enabled,
    staleTime: 5 * 60 * 1000,
    // 자정 close 이후 batch 재조회 필요 · window focus 시 refetch.
    refetchOnWindowFocus: true,
  });
}
