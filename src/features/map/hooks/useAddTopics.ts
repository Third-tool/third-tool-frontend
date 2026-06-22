import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTopics } from '@/lib/api/endpoints/facade';
import { LEARNING_FACADE_KEY } from '@/features/auth/hooks/useLearningFacade';
import { track } from '@/lib/analytics/track';

interface Params {
  axisId: string;
  names: string[];
}

export function useAddTopics() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ axisId, names }: Params) =>
      createTopics(axisId, {
        topics: names.map((name) => ({ name, description: null })),
      }),
    onSuccess: (res, vars) => {
      track('topic_created', {
        axisId: vars.axisId,
        count: res.topics.length,
        exceedsRecommended: res.isTopicCountExceedsRecommended === true,
      });
      qc.invalidateQueries({ queryKey: LEARNING_FACADE_KEY });
    },
  });
}
