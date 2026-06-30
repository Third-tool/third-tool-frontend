import { useMutation, useQueryClient } from '@tanstack/react-query';
import { renameAxis } from '@/lib/api/endpoints/facade';
import { LEARNING_FACADE_KEY } from '@/features/auth/hooks/useLearningFacade';
import { track } from '@/lib/analytics/track';

export function useRenameAxis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ axisId, name }: { axisId: string; name: string }) =>
      renameAxis(axisId, name),
    onSuccess: (res) => {
      track('axis_renamed', { axisId: res.axisId });
      void qc.invalidateQueries({ queryKey: LEARNING_FACADE_KEY });
    },
  });
}
