import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addCardTag } from '@/lib/api/endpoints/card';
import { cardKey } from './useCard';

export function useAddCardTag(cardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (value: string) => addCardTag(cardId, value),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: cardKey(cardId) });
      void qc.invalidateQueries({ queryKey: ['cards', 'archive'] });
    },
  });
}
