import { useQuery } from '@tanstack/react-query';
import { listArchiveCards } from '@/lib/api/endpoints/card';
import { useLearningFacade } from '@/features/auth/hooks/useLearningFacade';
import type { Card as CardModel } from '@/lib/api/schemas/card';

// M5 재편(2026-07-22+): LT-E5-DECK-ABOLISH · Deck 스코프 삭제.
// tagId가 있으면 tag-scope · 없으면 facade 전체 axes를 순회해 archive 카드 합집합.
interface ArchiveFilter {
  axisId?: string | null;
  tagId?: string | null;
}

type ArchiveArg = ArchiveFilter | string | null | undefined;

function normalize(arg: ArchiveArg): ArchiveFilter {
  if (arg == null) return {};
  if (typeof arg === 'string') return { tagId: arg };
  return arg;
}

export const ARCHIVE_KEY = (filter: ArchiveFilter) =>
  [
    'cards',
    'archive',
    { axisId: filter.axisId ?? null, tagId: filter.tagId ?? null },
  ] as const;

export function useArchive(arg?: ArchiveArg) {
  const filter = normalize(arg);
  const facade = useLearningFacade();
  const axisIds = filter.tagId
    ? []
    : facade.data?.axes.map((a) => a.axisId) ?? [];

  return useQuery({
    queryKey: [
      'cards',
      'archive',
      { axisId: filter.axisId ?? null, tagId: filter.tagId ?? null, axisIds },
    ] as const,
    queryFn: async (): Promise<CardModel[]> => {
      if (filter.tagId) {
        return listArchiveCards({ tagId: filter.tagId });
      }
      if (filter.axisId) {
        return listArchiveCards({ axisId: filter.axisId });
      }
      // Facade 전체 axes 순회 · archive 카드 병합.
      const perAxis = await Promise.all(
        axisIds.map((id) => listArchiveCards({ axisId: id })),
      );
      const merged = perAxis.flat();
      // cardId 중복 제거 (한 카드가 한 axis에만 매핑되지만 방어).
      const seen = new Set<string>();
      return merged.filter((c) => {
        if (seen.has(c.cardId)) return false;
        seen.add(c.cardId);
        return true;
      });
    },
    enabled: Boolean(filter.tagId || filter.axisId || axisIds.length > 0),
  });
}
