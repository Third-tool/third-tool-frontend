import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateCardSummary } from '@/lib/api/endpoints/card';
import { cardKey } from './useCard';

export function useUpdateCardSummary(cardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (summary: string) => updateCardSummary(cardId, summary),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: cardKey(cardId) });
      void qc.invalidateQueries({ queryKey: ['cards', 'archive'] });
    },
  });
}
