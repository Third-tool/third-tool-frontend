import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeCardTag } from '@/lib/api/endpoints/card';
import { cardKey } from './useCard';

export function useRemoveCardTag(cardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tagId: string) => removeCardTag(cardId, tagId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: cardKey(cardId) });
      void qc.invalidateQueries({ queryKey: ['cards', 'archive'] });
    },
  });
}
