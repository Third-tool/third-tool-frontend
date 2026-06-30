import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTopic } from '@/lib/api/endpoints/facade';
import { LEARNING_FACADE_KEY } from '@/features/auth/hooks/useLearningFacade';
import { track } from '@/lib/analytics/track';

interface Params {
  axisId: string;
  name: string;
}

export function useAddTopics() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ axisId, name }: Params) =>
      createTopic(axisId, { name, description: null }),
    onSuccess: (res, vars) => {
      track('topic_created', {
        axisId: vars.axisId,
        topicId: res.topicId,
        exceedsRecommended: res.isTopicCountExceedsRecommended === true,
      });
      qc.invalidateQueries({ queryKey: LEARNING_FACADE_KEY });
    },
  });
}
