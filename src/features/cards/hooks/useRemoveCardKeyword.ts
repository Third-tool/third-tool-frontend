import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeCardKeyword } from '@/lib/api/endpoints/card';
import { cardKey } from './useCard';

export function useRemoveCardKeyword(cardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (keywordId: string) => removeCardKeyword(cardId, keywordId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: cardKey(cardId) });
      void qc.invalidateQueries({ queryKey: ['cards', 'archive'] });
    },
  });
}
