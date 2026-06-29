import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reorderAxes } from '@/lib/api/endpoints/facade';
import { LEARNING_FACADE_KEY } from '@/features/auth/hooks/useLearningFacade';
import { track } from '@/lib/analytics/track';

export function useReorderAxes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderedAxisIds: string[]) => reorderAxes(orderedAxisIds),
    onSuccess: (res) => {
      track('axes_reordered', { count: res.axes.length });
      void qc.invalidateQueries({ queryKey: LEARNING_FACADE_KEY });
    },
  });
}
