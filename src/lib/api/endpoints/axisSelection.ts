import { apiClient } from '@/lib/api/client';
import {
  AxisSelectionSchema,
  AxisSelectionListSchema,
  CreateAxisSelectionRequestSchema,
  UpdateAxisSelectionRequestSchema,
  type AxisSelection,
  type AxisSelectionList,
  type CreateAxisSelectionRequest,
  type UpdateAxisSelectionRequest,
} from '@/lib/api/schemas/axisSelection';

// GET /api/v1/axes/{axisId}/selections — created_at DESC (컨테이너 정책 계승).
export async function listAxisSelections(axisId: string): Promise<AxisSelectionList> {
  const { data } = await apiClient.get(`/api/v1/axes/${axisId}/selections`);
  return AxisSelectionListSchema.parse(data);
}

// POST /api/v1/axes/{axisId}/selections { name }
export async function createAxisSelection(
  axisId: string,
  payload: CreateAxisSelectionRequest,
): Promise<AxisSelection> {
  const validated = CreateAxisSelectionRequestSchema.parse(payload);
  const { data } = await apiClient.post(`/api/v1/axes/${axisId}/selections`, validated);
  return AxisSelectionSchema.parse(data);
}

// PATCH /api/v1/selections/{selectionId} { name }
export async function updateAxisSelection(
  selectionId: string,
  payload: UpdateAxisSelectionRequest,
): Promise<AxisSelection> {
  const validated = UpdateAxisSelectionRequestSchema.parse(payload);
  const { data } = await apiClient.patch(`/api/v1/selections/${selectionId}`, validated);
  return AxisSelectionSchema.parse(data);
}

// DELETE /api/v1/selections/{selectionId} — hard delete (softDelete 없음).
export async function deleteAxisSelection(selectionId: string): Promise<void> {
  await apiClient.delete(`/api/v1/selections/${selectionId}`);
}
