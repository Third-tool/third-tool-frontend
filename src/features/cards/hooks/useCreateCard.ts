import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCard } from '@/lib/api/endpoints/card';
import { toastStore } from '@/lib/toast/toastQueue';
import { track } from '@/lib/analytics/track';
import type { CreateCardRequest } from '@/lib/api/schemas/card';

export function useCreateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCardRequest) => createCard(payload),
    onSuccess: (res, vars) => {
      track('card_created', {
        cardId: res.cardId,
        keywordCount: vars.keywords.length,
        tagCount: vars.tags?.length ?? 0,
      });
      toastStore.push({ message: '새 카드를 펼쳤어요.', tone: 'amber' });
      qc.invalidateQueries({ queryKey: ['review-session', 'today'] });
      qc.invalidateQueries({ queryKey: ['cards', 'archive'] });
    },
  });
}
