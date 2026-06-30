import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createDeck } from '@/lib/api/endpoints/deck';
import { toastStore } from '@/lib/toast/toastQueue';
import { track } from '@/lib/analytics/track';
import type { CreateDeckRequest } from '@/lib/api/schemas/deck';
import { DECKS_KEY } from './useDecks';

export function useCreateDeck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDeckRequest) => createDeck(payload),
    onSuccess: (res) => {
      track('deck_created', { deckId: res.deckId });
      toastStore.push({ message: `'${res.name}' 덱을 만들었어요.`, tone: 'amber' });
      qc.invalidateQueries({ queryKey: DECKS_KEY });
    },
  });
}
