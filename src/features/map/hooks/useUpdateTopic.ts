import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTopic } from '@/lib/api/endpoints/facade';
import { LEARNING_FACADE_KEY } from '@/features/auth/hooks/useLearningFacade';
import { toastStore } from '@/lib/toast/toastQueue';
import { track } from '@/lib/analytics/track';
import type { UpdateTopicRequest } from '@/lib/api/schemas/facade';

interface Params {
  topicId: string;
  payload: UpdateTopicRequest;
}

export function useUpdateTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ topicId, payload }: Params) => updateTopic(topicId, payload),
    onSuccess: (res) => {
      track('topic_revised', {
        topicId: res.topicId,
        refinementSuggested: res.isRefinementSuggested === true,
      });
      qc.invalidateQueries({ queryKey: LEARNING_FACADE_KEY });
      if (res.changed && res.coverageStatus === 'NO_MATERIAL') {
        toastStore.push({
          message: '주제가 다시 정리되어 연결된 자료를 한 번 더 살펴봐주세요',
          tone: 'cream',
        });
      }
      if (res.isRefinementSuggested) {
        toastStore.push({
          message: '이 주제, 한 번 더 다듬으면 좋아요. 진짜 하고 싶은 것을 다시 떠올려보세요',
          tone: 'cream',
        });
      }
    },
  });
}
