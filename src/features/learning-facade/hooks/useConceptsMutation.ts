import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateConcepts } from '@/lib/api/endpoints/facade';
import { LEARNING_FACADE_KEY } from '@/features/auth/hooks/useLearningFacade';
import type { LearningFacade } from '@/lib/api/schemas/facade';

interface Ctx {
  previous: LearningFacade | undefined;
}

export function useConceptsMutation() {
  const qc = useQueryClient();
  return useMutation<Awaited<ReturnType<typeof updateConcepts>>, unknown, string[], Ctx>({
    mutationFn: (concepts) => updateConcepts(concepts),
    onMutate: async (concepts) => {
      await qc.cancelQueries({ queryKey: LEARNING_FACADE_KEY });
      const previous = qc.getQueryData<LearningFacade>(LEARNING_FACADE_KEY);
      if (previous) {
        qc.setQueryData<LearningFacade>(LEARNING_FACADE_KEY, {
          ...previous,
          concepts,
          concept: concepts[0] ?? previous.concept ?? null,
        });
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(LEARNING_FACADE_KEY, ctx.previous);
      }
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: LEARNING_FACADE_KEY });
    },
  });
}
