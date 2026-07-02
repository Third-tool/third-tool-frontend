import { useQuery } from '@tanstack/react-query';
import { listLayers } from '@/lib/api/endpoints/layer';

export const LAYERS_KEY = ['facades', 'me', 'layers'] as const;

// product-learning-tower Story 2-1. LayersListPage · LayerFormDialog 진입점.
export function useLayers(enabled = true) {
  return useQuery({
    queryKey: LAYERS_KEY,
    queryFn: listLayers,
    enabled,
    staleTime: 60 * 1000,
  });
}
