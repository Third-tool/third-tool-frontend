import { useQuery } from '@tanstack/react-query';
import { listAxisCards } from '@/lib/api/endpoints/card';
import type { CardStatus } from '@/lib/api/schemas/card';

export const AXIS_CARDS_KEY = (axisId: string, status?: CardStatus) =>
  ['axis-cards', axisId, status ?? 'all'] as const;

// Cards belonging to a learning axis (across its decks). Used by the map's axis
// rows to surface "what have I made under this axis" (FE 002.md Issue 5).
export function useAxisCards(axisId: string | null, status?: CardStatus) {
  return useQuery({
    queryKey: AXIS_CARDS_KEY(axisId ?? '', status),
    queryFn: () => listAxisCards(axisId as string, status),
    enabled: !!axisId,
    staleTime: 30 * 1000,
  });
}
