import { useMutation, useQueryClient } from '@tanstack/react-query';
import { renameDeck } from '@/lib/api/endpoints/deck';
import { DECKS_KEY } from './useDecks';

export function useRenameDeck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ deckId, name }: { deckId: string; name: string }) =>
      renameDeck(deckId, name),
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: DECKS_KEY });
      void qc.invalidateQueries({ queryKey: ['decks', vars.deckId] });
    },
  });
}
