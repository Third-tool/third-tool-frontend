import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteTopic } from '@/lib/api/endpoints/facade';
import { LEARNING_FACADE_KEY } from '@/features/auth/hooks/useLearningFacade';
import { track } from '@/lib/analytics/track';

export function useDeleteTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ axisId, topicId }: { axisId: string; topicId: string }) =>
      deleteTopic(axisId, topicId),
    onSuccess: (_, vars) => {
      track('topic_deleted', { axisId: vars.axisId, topicId: vars.topicId });
      void qc.invalidateQueries({ queryKey: LEARNING_FACADE_KEY });
    },
  });
}
