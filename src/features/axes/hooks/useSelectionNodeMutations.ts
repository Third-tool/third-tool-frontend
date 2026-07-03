import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createSelectionNode,
  updateSelectionNode,
  deleteSelectionNode,
  reorderSelectionNodes,
} from '@/lib/api/endpoints/axisSelectionNode';
import type {
  AxisSelectionNode,
  CreateSelectionNodeRequest,
  UpdateSelectionNodeRequest,
} from '@/lib/api/schemas/axisSelectionNode';
import { axisSelectionsKey } from './useAxisSelections';
import type { AxisSelection } from '@/lib/api/schemas/axisSelection';

// product-learning-tower Story 3-10. Selection 자식 노드 CRUD · reorder.
// 컨테이너 목록 캐시(`axisSelectionsKey(axisId)`) 안의 nodes[] 를 함께 갱신하기 위해
// invalidate 대상은 컨테이너 리스트로 지정.

export function useCreateSelectionNode(axisId: string, selectionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSelectionNodeRequest) =>
      createSelectionNode(selectionId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: axisSelectionsKey(axisId) });
    },
  });
}

export function useUpdateSelectionNode(axisId: string, nodeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateSelectionNodeRequest) =>
      updateSelectionNode(nodeId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: axisSelectionsKey(axisId) });
    },
  });
}

export function useDeleteSelectionNode(axisId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (nodeId: string) => deleteSelectionNode(nodeId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: axisSelectionsKey(axisId) });
    },
  });
}

interface ReorderCtx {
  previous: AxisSelection[] | undefined;
}

// dnd-kit reorder — 낙관적 갱신 · 실패 시 롤백 (useRoadmapNodeReorder 패턴 재사용).
export function useSelectionNodeReorder(axisId: string, selectionId: string) {
  const qc = useQueryClient();
  const key = axisSelectionsKey(axisId);
  return useMutation<
    Awaited<ReturnType<typeof reorderSelectionNodes>>,
    unknown,
    string[],
    ReorderCtx
  >({
    mutationFn: (orderedNodeIds) => reorderSelectionNodes(selectionId, orderedNodeIds),
    onMutate: async (orderedNodeIds) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<AxisSelection[]>(key);
      if (previous) {
        const next = previous.map((sel) => {
          if (sel.id !== selectionId) return sel;
          const byId = new Map(sel.nodes.map((n) => [n.id, n]));
          const nextNodes = orderedNodeIds
            .map((id, idx) => {
              const node = byId.get(id);
              return node ? { ...node, displayOrder: idx + 1 } : null;
            })
            .filter((n): n is AxisSelectionNode => n !== null);
          return { ...sel, nodes: nextNodes };
        });
        qc.setQueryData<AxisSelection[]>(key, next);
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
