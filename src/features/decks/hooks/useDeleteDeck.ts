import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteDeck } from '@/lib/api/endpoints/deck';
import { DECKS_KEY } from './useDecks';

export function useDeleteDeck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (deckId: string) => deleteDeck(deckId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: DECKS_KEY });
      void qc.invalidateQueries({ queryKey: ['decks'] });
    },
  });
}
