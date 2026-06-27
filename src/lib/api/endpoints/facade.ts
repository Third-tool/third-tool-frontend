import { apiClient } from '@/lib/api/client';
import {
  LearningFacadeSchema,
  CreateFacadeRequestSchema,
  CreateFacadeResponseSchema,
  UpdateConceptRequestSchema,
  UpdateConceptResponseSchema,
  AxisCreateResponseSchema,
  CreateTopicRequestSchema,
  CreateTopicResponseSchema,
  CreateMaterialRequestSchema,
  CreateMaterialResponseSchema,
  RevisionReasonsResponseSchema,
  UpdateTopicRequestSchema,
  UpdateTopicResponseSchema,
  type LearningFacade,
  type CreateFacadeResponse,
  type UpdateConceptResponse,
  type AxisCreateResponse,
  type CreateTopicRequest,
  type CreateTopicResponse,
  type CreateMaterialRequest,
  type CreateMaterialResponse,
  type RevisionReasonsResponse,
  type UpdateTopicRequest,
  type UpdateTopicResponse,
} from '@/lib/api/schemas/facade';

export async function getLearningFacade(): Promise<LearningFacade> {
  const { data } = await apiClient.get('/api/v1/learning-facade');
  return LearningFacadeSchema.parse(data);
}

// Creates the (UNIQUE per-user) facade with an initial concept.
export async function createFacade(concept: string): Promise<CreateFacadeResponse> {
  const validated = CreateFacadeRequestSchema.parse({ concept });
  const { data } = await apiClient.post('/api/v1/learning-facade', validated);
  return CreateFacadeResponseSchema.parse(data);
}

// Updates the concept of an existing facade.
export async function updateConcept(concept: string): Promise<UpdateConceptResponse> {
  const validated = UpdateConceptRequestSchema.parse({ concept });
  const { data } = await apiClient.patch('/api/v1/learning-facade/concept', validated);
  return UpdateConceptResponseSchema.parse(data);
}

export async function createAxis(name: string): Promise<AxisCreateResponse> {
  const { data } = await apiClient.post('/api/v1/learning-facade/axes', { name });
  return AxisCreateResponseSchema.parse(data);
}

// BE accepts a single topic per call; callers that want to add N must loop.
export async function createTopic(
  axisId: string,
  payload: CreateTopicRequest,
): Promise<CreateTopicResponse> {
  const validated = CreateTopicRequestSchema.parse(payload);
  const { data } = await apiClient.post(
    `/api/v1/learning-facade/axes/${axisId}/topics`,
    validated,
  );
  return CreateTopicResponseSchema.parse(data);
}

export async function createMaterial(
  payload: CreateMaterialRequest,
): Promise<CreateMaterialResponse> {
  const validated = CreateMaterialRequestSchema.parse(payload);
  const { data } = await apiClient.post('/api/v1/learning-facade/materials', validated);
  return CreateMaterialResponseSchema.parse(data);
}

export async function listRevisionReasons(): Promise<RevisionReasonsResponse> {
  const { data } = await apiClient.get('/api/v1/learning-facade/revision-reason-options');
  return RevisionReasonsResponseSchema.parse(data);
}

// BE PATCH path requires both axisId and topicId.
export async function updateTopic(
  axisId: string,
  topicId: string,
  payload: UpdateTopicRequest,
): Promise<UpdateTopicResponse> {
  const validated = UpdateTopicRequestSchema.parse(payload);
  const { data } = await apiClient.patch(
    `/api/v1/learning-facade/axes/${axisId}/topics/${topicId}`,
    validated,
  );
  return UpdateTopicResponseSchema.parse(data);
}
