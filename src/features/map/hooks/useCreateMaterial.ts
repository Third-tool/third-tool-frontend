import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createMaterial } from '@/lib/api/endpoints/facade';
import { LEARNING_FACADE_KEY } from '@/features/auth/hooks/useLearningFacade';
import { track } from '@/lib/analytics/track';
import type { CreateMaterialRequest } from '@/lib/api/schemas/facade';

export function useCreateMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMaterialRequest) => createMaterial(payload),
    onSuccess: (res, vars) => {
      track('material_created', {
        materialId: res.materialId,
        type: vars.type,
        topicCount: res.topicIds.length,
        deckAutoCreated: res.deckAutoCreated,
      });
      if (res.deckAutoCreated) {
        track('deck_autocreate_prompt_seen', { deckId: res.deckId });
      }
      qc.invalidateQueries({ queryKey: LEARNING_FACADE_KEY });
    },
  });
}
