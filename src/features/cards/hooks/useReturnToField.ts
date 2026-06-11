import { useMutation, useQueryClient } from '@tanstack/react-query';
import { returnToField } from '@/lib/api/endpoints/card';
import { toastStore } from '@/lib/toast/toastQueue';

export function useReturnToField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cardId: string) => returnToField(cardId),
    onSuccess: () => {
      toastStore.push({ message: '오늘부터 다시 만나요.', tone: 'amber' });
      qc.invalidateQueries({ queryKey: ['cards', 'archive'] });
      qc.invalidateQueries({ queryKey: ['review-session', 'today'] });
    },
  });
}
