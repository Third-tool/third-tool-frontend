import { z } from 'zod';
import { AxisSelectionNodeListSchema } from './axisSelectionNode';

// product-learning-tower Story 3-1 (부분) · 3-10 (신설 · 2026-07-02).
// BE `AxisSelection` Aggregate 대응 — 축의 사례/응용 컨테이너.
// 컨테이너 정책 (이슈 #11 계승): name UNIQUE per axis · created_at DESC · hard delete.
// nodes[] 는 SDD S3-10 명세 — 응답에 자식 노드 배열 포함.

export const AxisSelectionSchema = z.object({
  id: z.coerce.string(),
  axisId: z.coerce.string(),
  name: z.string().min(1).max(100),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  nodes: AxisSelectionNodeListSchema.default([]),
});
export type AxisSelection = z.infer<typeof AxisSelectionSchema>;

export const AxisSelectionListSchema = z.array(AxisSelectionSchema);
export type AxisSelectionList = z.infer<typeof AxisSelectionListSchema>;

// POST /api/v1/axes/{axisId}/selections { name }
export const CreateAxisSelectionRequestSchema = z.object({
  name: z.string().min(1).max(100),
});
export type CreateAxisSelectionRequest = z.infer<typeof CreateAxisSelectionRequestSchema>;

// PATCH /api/v1/selections/{selectionId} { name }
export const UpdateAxisSelectionRequestSchema = z.object({
  name: z.string().min(1).max(100),
});
export type UpdateAxisSelectionRequest = z.infer<typeof UpdateAxisSelectionRequestSchema>;
