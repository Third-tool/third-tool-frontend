import { useQuery } from '@tanstack/react-query';
import { listRoadmapNodes } from '@/lib/api/endpoints/axisRoadmapNode';

export const roadmapNodesKey = (axisId: string) =>
  ['axes', axisId, 'roadmap-nodes'] as const;

// product-learning-tower Story 3-9 진입점. axisId 로 노드 배열 조회.
export function useAxisRoadmapNodes(axisId: string, enabled = true) {
  return useQuery({
    queryKey: roadmapNodesKey(axisId),
    queryFn: () => listRoadmapNodes(axisId),
    enabled: enabled && Boolean(axisId),
    staleTime: 60 * 1000,
  });
}
