import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteCard } from '@/lib/api/endpoints/card';
import { cardKey } from './useCard';

export function useDeleteCard(cardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => deleteCard(cardId),
    onSuccess: () => {
      qc.removeQueries({ queryKey: cardKey(cardId) });
      void qc.invalidateQueries({ queryKey: ['cards', 'archive'] });
      void qc.invalidateQueries({ queryKey: ['review-session', 'today'] });
    },
  });
}
