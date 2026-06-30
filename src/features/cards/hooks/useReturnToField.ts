import { useMutation, useQueryClient } from '@tanstack/react-query';
import { returnToField } from '@/lib/api/endpoints/card';
import { toastStore } from '@/lib/toast/toastQueue';
import { track } from '@/lib/analytics/track';

export function useReturnToField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cardId: string) => returnToField(cardId),
    onSuccess: (_res, cardId) => {
      track('card_returned_to_field', { cardId });
      toastStore.push({ message: '새 사이클로 다시 이어가요.', tone: 'amber' });
      qc.invalidateQueries({ queryKey: ['cards', 'archive'] });
      qc.invalidateQueries({ queryKey: ['review-session', 'today'] });
    },
  });
}
