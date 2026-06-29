import { useQuery } from '@tanstack/react-query';
import { listSubDecks } from '@/lib/api/endpoints/deck';

export const subDecksKey = (deckId: string) => ['decks', deckId, 'sub-decks'] as const;

export function useSubDecks(deckId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: deckId ? subDecksKey(deckId) : ['decks', 'sub-decks', 'idle'],
    queryFn: () => listSubDecks(deckId!),
    enabled: enabled && Boolean(deckId),
    staleTime: 30 * 1000,
  });
}
