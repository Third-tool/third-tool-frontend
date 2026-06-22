import { useQuery } from '@tanstack/react-query';
import { listArchiveCards } from '@/lib/api/endpoints/card';
import { useSelectedDeck } from '@/features/decks/DeckContext';

interface ArchiveFilter {
  deckId?: string | null;
  tagId?: string | null;
}

type ArchiveArg = ArchiveFilter | string | null | undefined;

function normalize(arg: ArchiveArg): ArchiveFilter {
  if (arg == null) return {};
  if (typeof arg === 'string') return { tagId: arg };
  return arg;
}

export const ARCHIVE_KEY = (filter: ArchiveFilter) =>
  ['cards', 'archive', { deckId: filter.deckId ?? null, tagId: filter.tagId ?? null }] as const;

export function useArchive(arg?: ArchiveArg) {
  const filter = normalize(arg);
  const { selectedDeckId } = useSelectedDeck();
  // Backend has no flat user-wide archive endpoint, so when the caller doesn't
  // pin a tag we fall back to the currently selected deck. Empty result if none.
  const effectiveDeckId = filter.deckId ?? (filter.tagId ? null : selectedDeckId);

  return useQuery({
    queryKey: ARCHIVE_KEY({ deckId: effectiveDeckId, tagId: filter.tagId ?? null }),
    queryFn: () =>
      listArchiveCards({
        deckId: effectiveDeckId ?? undefined,
        tagId: filter.tagId ?? undefined,
      }),
    enabled: Boolean(effectiveDeckId || filter.tagId),
  });
}
