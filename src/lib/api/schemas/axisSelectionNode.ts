import { z } from 'zod';

// product-learning-tower Story 3-1 (부분) · 3-10 (신설 · 2026-07-02).
// BE `AxisSelectionNode` Entity 대응 — Selection 컨테이너 하위 챕터 노드.
// Roadmap 노드(axisRoadmapNode.ts)와 동일한 shape 이지만 selectionId 로 부모 참조.

export const AxisSelectionNodeSchema = z.object({
  id: z.coerce.string(),
  selectionId: z.coerce.string(),
  displayOrder: z.number().int().positive(), // 1-based
  title: z.string().min(1).max(200),
  rationale: z.string().max(500).nullable().optional(),
  body: z.string().min(1),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type AxisSelectionNode = z.infer<typeof AxisSelectionNodeSchema>;

export const AxisSelectionNodeListSchema = z.array(AxisSelectionNodeSchema);
export type AxisSelectionNodeList = z.infer<typeof AxisSelectionNodeListSchema>;

// POST /api/v1/selections/{selectionId}/nodes { title, rationale?, body }
export const CreateSelectionNodeRequestSchema = z.object({
  title: z.string().min(1).max(200),
  rationale: z.string().max(500).nullable().optional(),
  body: z.string().min(1),
});
export type CreateSelectionNodeRequest = z.infer<typeof CreateSelectionNodeRequestSchema>;

// PATCH /api/v1/selection-nodes/{nodeId} { title?, rationale?, body? }
export const UpdateSelectionNodeRequestSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    rationale: z.string().max(500).nullable().optional(),
    body: z.string().min(1).optional(),
  })
  .refine((v) => v.title !== undefined || v.rationale !== undefined || v.body !== undefined, {
    message: '변경할 필드가 최소 1개 필요합니다.',
  });
export type UpdateSelectionNodeRequest = z.infer<typeof UpdateSelectionNodeRequestSchema>;

// PUT /api/v1/selections/{selectionId}/nodes/order { orderedNodeIds }
export const ReorderSelectionNodesRequestSchema = z.object({
  orderedNodeIds: z.array(z.coerce.string()).min(1),
});
export type ReorderSelectionNodesRequest = z.infer<
  typeof ReorderSelectionNodesRequestSchema
>;

export const ReorderSelectionNodesResponseSchema = z.object({
  nodes: AxisSelectionNodeListSchema,
});
export type ReorderSelectionNodesResponse = z.infer<
  typeof ReorderSelectionNodesResponseSchema
>;
