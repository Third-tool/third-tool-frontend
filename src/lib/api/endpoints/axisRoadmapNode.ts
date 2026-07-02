import { apiClient } from '@/lib/api/client';
import {
  AxisRoadmapNodeSchema,
  AxisRoadmapNodeListSchema,
  CreateAxisRoadmapNodeRequestSchema,
  UpdateAxisRoadmapNodeRequestSchema,
  ReorderRoadmapNodesRequestSchema,
  ReorderRoadmapNodesResponseSchema,
  type AxisRoadmapNode,
  type AxisRoadmapNodeList,
  type CreateAxisRoadmapNodeRequest,
  type UpdateAxisRoadmapNodeRequest,
  type ReorderRoadmapNodesResponse,
} from '@/lib/api/schemas/axisRoadmapNode';

// GET /api/v1/axes/{axisId}/roadmap-nodes — display_order ASC.
export async function listRoadmapNodes(axisId: string): Promise<AxisRoadmapNodeList> {
  const { data } = await apiClient.get(`/api/v1/axes/${axisId}/roadmap-nodes`);
  return AxisRoadmapNodeListSchema.parse(data);
}

// POST /api/v1/axes/{axisId}/roadmap-nodes { title, rationale?, body }
export async function createRoadmapNode(
  axisId: string,
  payload: CreateAxisRoadmapNodeRequest,
): Promise<AxisRoadmapNode> {
  const validated = CreateAxisRoadmapNodeRequestSchema.parse(payload);
  const { data } = await apiClient.post(
    `/api/v1/axes/${axisId}/roadmap-nodes`,
    validated,
  );
  return AxisRoadmapNodeSchema.parse(data);
}

// PATCH /api/v1/roadmap-nodes/{nodeId} { title?, rationale?, body? }
export async function updateRoadmapNode(
  nodeId: string,
  payload: UpdateAxisRoadmapNodeRequest,
): Promise<AxisRoadmapNode> {
  const validated = UpdateAxisRoadmapNodeRequestSchema.parse(payload);
  const { data } = await apiClient.patch(
    `/api/v1/roadmap-nodes/${nodeId}`,
    validated,
  );
  return AxisRoadmapNodeSchema.parse(data);
}

// DELETE /api/v1/roadmap-nodes/{nodeId} — Soft Delete, 204.
export async function deleteRoadmapNode(nodeId: string): Promise<void> {
  await apiClient.delete(`/api/v1/roadmap-nodes/${nodeId}`);
}

// PUT /api/v1/axes/{axisId}/roadmap-nodes/order { orderedNodeIds }
export async function reorderRoadmapNodes(
  axisId: string,
  orderedNodeIds: string[],
): Promise<ReorderRoadmapNodesResponse> {
  const validated = ReorderRoadmapNodesRequestSchema.parse({ orderedNodeIds });
  const { data } = await apiClient.put(
    `/api/v1/axes/${axisId}/roadmap-nodes/order`,
    validated,
  );
  return ReorderRoadmapNodesResponseSchema.parse(data);
}
