import { useMutation, useQueryClient } from '@tanstack/react-query';
import { archiveCard } from '@/lib/api/endpoints/card';
import { toastStore } from '@/lib/toast/toastQueue';

export function useArchiveCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cardId: string) => archiveCard(cardId),
    onSuccess: () => {
      toastStore.push({ message: '배경 지식으로 옮겼어요.', tone: 'cream' });
      qc.invalidateQueries({ queryKey: ['review-session', 'today'] });
      qc.invalidateQueries({ queryKey: ['cards', 'archive'] });
    },
  });
}
