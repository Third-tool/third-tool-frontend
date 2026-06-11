import { useMutation, useQueryClient } from '@tanstack/react-query';
import { viewCard } from '@/lib/api/endpoints/card';
import { toastStore } from '@/lib/toast/toastQueue';
import { TODAY_REVIEW_KEY } from './useTodayReview';

const messageFor = (reason: 'MAX_VIEW' | 'MAX_DURATION'): string =>
  reason === 'MAX_VIEW'
    ? '이 카드는 충분히 노출되었습니다. 배경 지식으로 이동합니다.'
    : '이 카드는 순환을 완료했습니다. 잠시 후 다시 만나요 👋';

export function useViewCard(dailyTarget = 30) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cardId: string) => viewCard(cardId),
    onSuccess: (response) => {
      if (response.autoArchived && response.archiveReason) {
        toastStore.push({ message: messageFor(response.archiveReason), tone: 'cream' });
        qc.invalidateQueries({ queryKey: TODAY_REVIEW_KEY(dailyTarget) });
        qc.invalidateQueries({ queryKey: ['cards', 'archive'] });
      }
    },
  });
}
