import { z } from 'zod';

// product-learning-tower Story 2-1. BE `LearningFacadeLayer` 도메인 대응.
// 상태 enum 은 서버 파생값(하위 axis 상태로 계산). FE 는 표시만.
export const LayerProgressStatusSchema = z.enum([
  'NOT_STARTED',
  'IN_PROGRESS',
  'COMPLETED',
]);
export type LayerProgressStatus = z.infer<typeof LayerProgressStatusSchema>;

// deletedAt 은 softDelete 결과 필드. 목록은 서버가 filter 하므로 기본 응답에는 null.
export const LayerSchema = z.object({
  layerId: z.coerce.string(),
  name: z.string(),
  displayOrder: z.number().int().nonnegative(),
  progressStatus: LayerProgressStatusSchema.optional(),
  deletedAt: z.string().nullable().optional(),
  createdAt: z.string().optional(),
});
export type Layer = z.infer<typeof LayerSchema>;

export const LayersResponseSchema = z.array(LayerSchema);
export type LayersResponse = z.infer<typeof LayersResponseSchema>;

// POST /api/v1/facades/me/layers { name }
export const CreateLayerRequestSchema = z.object({
  name: z.string().min(1).max(50),
});
export type CreateLayerRequest = z.infer<typeof CreateLayerRequestSchema>;

export const CreateLayerResponseSchema = LayerSchema;
export type CreateLayerResponse = z.infer<typeof CreateLayerResponseSchema>;

// PATCH /api/v1/facades/me/layers/{layerId} { name }
export const UpdateLayerRequestSchema = z.object({
  name: z.string().min(1).max(50),
});
export type UpdateLayerRequest = z.infer<typeof UpdateLayerRequestSchema>;

export const UpdateLayerResponseSchema = LayerSchema.extend({
  changed: z.boolean().optional(),
});
export type UpdateLayerResponse = z.infer<typeof UpdateLayerResponseSchema>;

// PUT /api/v1/facades/me/layers/order { orderedLayerIds }
export const ReorderLayersRequestSchema = z.object({
  orderedLayerIds: z.array(z.coerce.string()).min(1),
});
export type ReorderLayersRequest = z.infer<typeof ReorderLayersRequestSchema>;

export const ReorderLayersResponseSchema = z.object({
  layers: z.array(LayerSchema),
});
export type ReorderLayersResponse = z.infer<typeof ReorderLayersResponseSchema>;
