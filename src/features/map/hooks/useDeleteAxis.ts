import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteAxis } from '@/lib/api/endpoints/facade';
import { LEARNING_FACADE_KEY } from '@/features/auth/hooks/useLearningFacade';
import { track } from '@/lib/analytics/track';

export function useDeleteAxis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (axisId: string) => deleteAxis(axisId),
    onSuccess: (_, axisId) => {
      track('axis_deleted', { axisId });
      void qc.invalidateQueries({ queryKey: LEARNING_FACADE_KEY });
    },
  });
}
