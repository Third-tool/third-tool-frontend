import { apiClient } from '@/lib/api/client';
import {
  LayersResponseSchema,
  LayerSchema,
  CreateLayerRequestSchema,
  CreateLayerResponseSchema,
  UpdateLayerRequestSchema,
  UpdateLayerResponseSchema,
  ReorderLayersRequestSchema,
  ReorderLayersResponseSchema,
  type LayersResponse,
  type Layer,
  type CreateLayerRequest,
  type CreateLayerResponse,
  type UpdateLayerRequest,
  type UpdateLayerResponse,
  type ReorderLayersResponse,
} from '@/lib/api/schemas/layer';

// GET /api/v1/facades/me/layers — 소유 Layer 목록 (deletedAt IS NULL 서버 필터).
export async function listLayers(): Promise<LayersResponse> {
  const { data } = await apiClient.get('/api/v1/facades/me/layers');
  return LayersResponseSchema.parse(data);
}

// GET /api/v1/facades/me/layers/{layerId} — 단건 조회 (FE-7/8 preview 용).
export async function getLayer(layerId: string): Promise<Layer> {
  const { data } = await apiClient.get(`/api/v1/facades/me/layers/${layerId}`);
  return LayerSchema.parse(data);
}

// POST /api/v1/facades/me/layers { name }
export async function createLayer(
  payload: CreateLayerRequest,
): Promise<CreateLayerResponse> {
  const validated = CreateLayerRequestSchema.parse(payload);
  const { data } = await apiClient.post('/api/v1/facades/me/layers', validated);
  return CreateLayerResponseSchema.parse(data);
}

// PATCH /api/v1/facades/me/layers/{layerId} { name }
export async function updateLayer(
  layerId: string,
  payload: UpdateLayerRequest,
): Promise<UpdateLayerResponse> {
  const validated = UpdateLayerRequestSchema.parse(payload);
  const { data } = await apiClient.patch(
    `/api/v1/facades/me/layers/${layerId}`,
    validated,
  );
  return UpdateLayerResponseSchema.parse(data);
}

// DELETE /api/v1/facades/me/layers/{layerId} — softDelete.
export async function deleteLayer(layerId: string): Promise<void> {
  await apiClient.delete(`/api/v1/facades/me/layers/${layerId}`);
}

// PUT /api/v1/facades/me/layers/order { orderedLayerIds }
export async function reorderLayers(
  orderedLayerIds: string[],
): Promise<ReorderLayersResponse> {
  const validated = ReorderLayersRequestSchema.parse({ orderedLayerIds });
  const { data } = await apiClient.put(
    '/api/v1/facades/me/layers/order',
    validated,
  );
  return ReorderLayersResponseSchema.parse(data);
}
