import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createAxis } from '@/lib/api/endpoints/facade';
import { LEARNING_FACADE_KEY } from '@/features/auth/hooks/useLearningFacade';
import { track } from '@/lib/analytics/track';

export function useAddAxis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createAxis(name),
    onSuccess: (res) => {
      track('axis_created', {
        axisId: res.axisId,
        exceedsRecommended: res.isAxisCountExceedsRecommended === true,
      });
      qc.invalidateQueries({ queryKey: LEARNING_FACADE_KEY });
    },
  });
}
