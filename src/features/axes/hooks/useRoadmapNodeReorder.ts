import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reorderRoadmapNodes } from '@/lib/api/endpoints/axisRoadmapNode';
import type { AxisRoadmapNode } from '@/lib/api/schemas/axisRoadmapNode';
import { roadmapNodesKey } from './useAxisRoadmapNodes';

interface Ctx {
  previous: AxisRoadmapNode[] | undefined;
}

// product-learning-tower Story 3-9 dnd-kit reorder.
// useLayerReorder 패턴 재사용 — 낙관적 순서 갱신 · 실패 시 롤백.
export function useRoadmapNodeReorder(axisId: string) {
  const qc = useQueryClient();
  const key = roadmapNodesKey(axisId);
  return useMutation<
    Awaited<ReturnType<typeof reorderRoadmapNodes>>,
    unknown,
    string[],
    Ctx
  >({
    mutationFn: (orderedNodeIds) => reorderRoadmapNodes(axisId, orderedNodeIds),
    onMutate: async (orderedNodeIds) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<AxisRoadmapNode[]>(key);
      if (previous) {
        const byId = new Map(previous.map((n) => [n.id, n]));
        const next = orderedNodeIds
          .map((id, idx) => {
            const node = byId.get(id);
            return node ? { ...node, displayOrder: idx + 1 } : null;
          })
          .filter((n): n is AxisRoadmapNode => n !== null);
        qc.setQueryData<AxisRoadmapNode[]>(key, next);
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(key, ctx.previous);
      }
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: key });
    },
  });
}
