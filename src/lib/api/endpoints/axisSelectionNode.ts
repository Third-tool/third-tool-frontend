import { apiClient } from '@/lib/api/client';
import {
  AxisSelectionNodeSchema,
  AxisSelectionNodeListSchema,
  CreateSelectionNodeRequestSchema,
  UpdateSelectionNodeRequestSchema,
  ReorderSelectionNodesRequestSchema,
  ReorderSelectionNodesResponseSchema,
  type AxisSelectionNode,
  type AxisSelectionNodeList,
  type CreateSelectionNodeRequest,
  type UpdateSelectionNodeRequest,
  type ReorderSelectionNodesResponse,
} from '@/lib/api/schemas/axisSelectionNode';

// GET /api/v1/selections/{selectionId}/nodes — display_order ASC.
export async function listSelectionNodes(
  selectionId: string,
): Promise<AxisSelectionNodeList> {
  const { data } = await apiClient.get(`/api/v1/selections/${selectionId}/nodes`);
  return AxisSelectionNodeListSchema.parse(data);
}

// POST /api/v1/selections/{selectionId}/nodes { title, rationale?, body }
export async function createSelectionNode(
  selectionId: string,
  payload: CreateSelectionNodeRequest,
): Promise<AxisSelectionNode> {
  const validated = CreateSelectionNodeRequestSchema.parse(payload);
  const { data } = await apiClient.post(
    `/api/v1/selections/${selectionId}/nodes`,
    validated,
  );
  return AxisSelectionNodeSchema.parse(data);
}

// PATCH /api/v1/selection-nodes/{nodeId} { title?, rationale?, body? }
export async function updateSelectionNode(
  nodeId: string,
  payload: UpdateSelectionNodeRequest,
): Promise<AxisSelectionNode> {
  const validated = UpdateSelectionNodeRequestSchema.parse(payload);
  const { data } = await apiClient.patch(`/api/v1/selection-nodes/${nodeId}`, validated);
  return AxisSelectionNodeSchema.parse(data);
}

// DELETE /api/v1/selection-nodes/{nodeId} — Soft Delete, 204.
export async function deleteSelectionNode(nodeId: string): Promise<void> {
  await apiClient.delete(`/api/v1/selection-nodes/${nodeId}`);
}

// PUT /api/v1/selections/{selectionId}/nodes/order { orderedNodeIds }
export async function reorderSelectionNodes(
  selectionId: string,
  orderedNodeIds: string[],
): Promise<ReorderSelectionNodesResponse> {
  const validated = ReorderSelectionNodesRequestSchema.parse({ orderedNodeIds });
  const { data } = await apiClient.put(
    `/api/v1/selections/${selectionId}/nodes/order`,
    validated,
  );
  return ReorderSelectionNodesResponseSchema.parse(data);
}
