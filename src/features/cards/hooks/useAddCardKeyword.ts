import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addCardKeyword } from '@/lib/api/endpoints/card';
import { cardKey } from './useCard';

export function useAddCardKeyword(cardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (value: string) => addCardKeyword(cardId, value),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: cardKey(cardId) });
      void qc.invalidateQueries({ queryKey: ['cards', 'archive'] });
    },
  });
}
