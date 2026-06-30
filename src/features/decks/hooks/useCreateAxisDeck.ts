import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createAxisDeck } from '@/lib/api/endpoints/deck';
import { toastStore } from '@/lib/toast/toastQueue';
import { track } from '@/lib/analytics/track';
import { DECKS_KEY } from './useDecks';

// Creates a deck linked to a learning axis. Distinct from useCreateDeck (which
// makes an orphan, axis-less deck) so the card editor can place new cards inside
// an axis scope — otherwise their cards never surface in the axis/today views.
export function useCreateAxisDeck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ axisId, name }: { axisId: string; name: string }) =>
      createAxisDeck(axisId, name),
    onSuccess: (res) => {
      track('deck_created', { deckId: res.deckId, axisId: res.axisId ?? null });
      toastStore.push({ message: `'${res.name}' 덱을 만들었어요.`, tone: 'amber' });
      qc.invalidateQueries({ queryKey: DECKS_KEY });
    },
  });
}
