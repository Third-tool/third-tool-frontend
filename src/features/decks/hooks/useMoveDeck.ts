import { useMutation, useQueryClient } from '@tanstack/react-query';
import { moveDeck } from '@/lib/api/endpoints/deck';
import { DECKS_KEY } from './useDecks';

export function useMoveDeck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ deckId, parentDeckId }: { deckId: string; parentDeckId: string | null }) =>
      moveDeck(deckId, parentDeckId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: DECKS_KEY });
      void qc.invalidateQueries({ queryKey: ['decks'] });
    },
  });
}
