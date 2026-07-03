import { useQuery } from '@tanstack/react-query';
import { listAxisSelections } from '@/lib/api/endpoints/axisSelection';

export const axisSelectionsKey = (axisId: string) =>
  ['axes', axisId, 'selections'] as const;

// product-learning-tower Story 3-4 · 3-10. axisId 로 컨테이너 배열 조회 (created_at DESC).
export function useAxisSelections(axisId: string, enabled = true) {
  return useQuery({
    queryKey: axisSelectionsKey(axisId),
    queryFn: () => listAxisSelections(axisId),
    enabled: enabled && Boolean(axisId),
    staleTime: 60 * 1000,
  });
}
