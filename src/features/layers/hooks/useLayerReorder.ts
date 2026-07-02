import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reorderLayers } from '@/lib/api/endpoints/layer';
import { LAYERS_KEY } from './useLayers';
import type { Layer } from '@/lib/api/schemas/layer';

interface Ctx {
  previous: Layer[] | undefined;
}

// PUT /facades/me/layers/order — 낙관적으로 order 를 갱신하고 실패 시 롤백.
export function useLayerReorder() {
  const qc = useQueryClient();
  return useMutation<Awaited<ReturnType<typeof reorderLayers>>, unknown, string[], Ctx>({
    mutationFn: (orderedLayerIds) => reorderLayers(orderedLayerIds),
    onMutate: async (orderedLayerIds) => {
      await qc.cancelQueries({ queryKey: LAYERS_KEY });
      const previous = qc.getQueryData<Layer[]>(LAYERS_KEY);
      if (previous) {
        const byId = new Map(previous.map((l) => [l.layerId, l]));
        const next = orderedLayerIds
          .map((id, idx) => {
            const layer = byId.get(id);
            return layer ? { ...layer, displayOrder: idx } : null;
          })
          .filter((l): l is Layer => l !== null);
        qc.setQueryData<Layer[]>(LAYERS_KEY, next);
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(LAYERS_KEY, ctx.previous);
      }
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: LAYERS_KEY });
    },
  });
}
