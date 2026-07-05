import { useQuery } from '@tanstack/react-query';
import { fetchDashboardSummary } from '@/lib/api/endpoints/dashboard';

// product-review (FE) Epic 3 Story 3-1 · M5 신설 (2026-07-22+).
// staleTime 60초 · Dashboard 페이지 진입 시 반복 조회 방지.
export const dashboardKey = ['dashboard', 'summary'] as const;

export function useLearningDashboard(enabled = true) {
  return useQuery({
    queryKey: dashboardKey,
    queryFn: fetchDashboardSummary,
    enabled,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });
}
