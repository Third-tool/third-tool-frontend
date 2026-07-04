import { useQuery } from '@tanstack/react-query';
import { listAxisCards } from '@/lib/api/endpoints/card';

// M5 신설(2026-07-22+): LT-E4-CARD-AXIS 대응.
// AxisDetailPage Cards 탭에서 이 축에 연결된 카드 리스트 조회.
export const axisCardsKey = (axisId: string) => ['axes', axisId, 'cards'] as const;

export function useAxisCards(axisId: string, enabled = true) {
  return useQuery({
    queryKey: axisCardsKey(axisId),
    queryFn: () => listAxisCards(axisId),
    enabled: enabled && Boolean(axisId),
    staleTime: 30 * 1000,
  });
}
