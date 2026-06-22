import { useMutation, useQueryClient } from '@tanstack/react-query';
import { archiveCard } from '@/lib/api/endpoints/card';
import { toastStore } from '@/lib/toast/toastQueue';
import { track } from '@/lib/analytics/track';

export function useArchiveCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cardId: string) => archiveCard(cardId),
    onSuccess: (_res, cardId) => {
      track('card_archived', { cardId });
      toastStore.push({ message: '참조로 옮겨두었어요.', tone: 'cream' });
      qc.invalidateQueries({ queryKey: ['review-session', 'today'] });
      qc.invalidateQueries({ queryKey: ['cards', 'archive'] });
    },
  });
}
