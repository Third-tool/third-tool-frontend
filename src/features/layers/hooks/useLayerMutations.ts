import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createLayer, deleteLayer, updateLayer } from '@/lib/api/endpoints/layer';
import { LAYERS_KEY } from './useLayers';
import type { CreateLayerRequest, UpdateLayerRequest } from '@/lib/api/schemas/layer';

export function useCreateLayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLayerRequest) => createLayer(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: LAYERS_KEY });
    },
  });
}

export function useUpdateLayer(layerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateLayerRequest) => updateLayer(layerId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: LAYERS_KEY });
    },
  });
}

export function useDeleteLayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (layerId: string) => deleteLayer(layerId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: LAYERS_KEY });
    },
  });
}
