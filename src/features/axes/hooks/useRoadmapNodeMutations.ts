import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createRoadmapNode,
  updateRoadmapNode,
  deleteRoadmapNode,
} from '@/lib/api/endpoints/axisRoadmapNode';
import type {
  CreateAxisRoadmapNodeRequest,
  UpdateAxisRoadmapNodeRequest,
} from '@/lib/api/schemas/axisRoadmapNode';
import { roadmapNodesKey } from './useAxisRoadmapNodes';

// product-learning-tower Story 3-9. add · update · delete 3종 mutation.
// reorder 는 낙관적 처리가 필요해 별도 hook (`useRoadmapNodeReorder`).

export function useCreateRoadmapNode(axisId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAxisRoadmapNodeRequest) =>
      createRoadmapNode(axisId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: roadmapNodesKey(axisId) });
    },
  });
}

export function useUpdateRoadmapNode(axisId: string, nodeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateAxisRoadmapNodeRequest) =>
      updateRoadmapNode(nodeId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: roadmapNodesKey(axisId) });
    },
  });
}

export function useDeleteRoadmapNode(axisId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (nodeId: string) => deleteRoadmapNode(nodeId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: roadmapNodesKey(axisId) });
    },
  });
}
