import { z } from 'zod';

// product-learning-tower Story 3-1 (부분) · 3-9 (신설 · 2026-07-02).
// BE `AxisRoadmapNode` Aggregate 대응. 챕터 노드 first-class 스키마.
// Story 3-3 (`<AxisRoadmapEditor>` textarea 원안 · SUPERSEDED) 대체.

export const AxisRoadmapNodeSchema = z.object({
  id: z.coerce.string(),
  axisId: z.coerce.string(),
  displayOrder: z.number().int().positive(), // 1-based
  title: z.string().min(1).max(200),
  rationale: z.string().max(500).nullable().optional(),
  body: z.string().min(1),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type AxisRoadmapNode = z.infer<typeof AxisRoadmapNodeSchema>;

export const AxisRoadmapNodeListSchema = z.array(AxisRoadmapNodeSchema);
export type AxisRoadmapNodeList = z.infer<typeof AxisRoadmapNodeListSchema>;

// POST /api/v1/axes/{axisId}/roadmap-nodes { title, rationale?, body }
export const CreateAxisRoadmapNodeRequestSchema = z.object({
  title: z.string().min(1).max(200),
  rationale: z.string().max(500).nullable().optional(),
  body: z.string().min(1),
});
export type CreateAxisRoadmapNodeRequest = z.infer<
  typeof CreateAxisRoadmapNodeRequestSchema
>;

// PATCH /api/v1/roadmap-nodes/{nodeId} { title?, rationale?, body? }
export const UpdateAxisRoadmapNodeRequestSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    rationale: z.string().max(500).nullable().optional(),
    body: z.string().min(1).optional(),
  })
  .refine((v) => v.title !== undefined || v.rationale !== undefined || v.body !== undefined, {
    message: '변경할 필드가 최소 1개 필요합니다.',
  });
export type UpdateAxisRoadmapNodeRequest = z.infer<
  typeof UpdateAxisRoadmapNodeRequestSchema
>;

// PUT /api/v1/axes/{axisId}/roadmap-nodes/order { orderedNodeIds }
export const ReorderRoadmapNodesRequestSchema = z.object({
  orderedNodeIds: z.array(z.coerce.string()).min(1),
});
export type ReorderRoadmapNodesRequest = z.infer<
  typeof ReorderRoadmapNodesRequestSchema
>;

export const ReorderRoadmapNodesResponseSchema = z.object({
  nodes: AxisRoadmapNodeListSchema,
});
export type ReorderRoadmapNodesResponse = z.infer<
  typeof ReorderRoadmapNodesResponseSchema
>;
