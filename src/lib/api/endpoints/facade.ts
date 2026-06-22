import { apiClient } from '@/lib/api/client';
import {
  LearningFacadeSchema,
  ConceptResponseSchema,
  AxisCreateResponseSchema,
  AxisSuggestionResponseSchema,
  CreateTopicsRequestSchema,
  CreateTopicsResponseSchema,
  TopicSuggestionResponseSchema,
  CreateMaterialRequestSchema,
  CreateMaterialResponseSchema,
  RevisionReasonsResponseSchema,
  UpdateTopicRequestSchema,
  UpdateTopicResponseSchema,
  type LearningFacade,
  type ConceptResponse,
  type AxisCreateResponse,
  type AxisSuggestionResponse,
  type CreateTopicsRequest,
  type CreateTopicsResponse,
  type TopicSuggestionResponse,
  type CreateMaterialRequest,
  type CreateMaterialResponse,
  type RevisionReasonsResponse,
  type UpdateTopicRequest,
  type UpdateTopicResponse,
} from '@/lib/api/schemas/facade';

export async function getLearningFacade(): Promise<LearningFacade> {
  const { data } = await apiClient.get('/api/learning-facade');
  return LearningFacadeSchema.parse(data);
}

export async function createConcept(concept: string): Promise<ConceptResponse> {
  const { data } = await apiClient.post('/api/learning-facade/concept', { concept });
  return ConceptResponseSchema.parse(data);
}

export async function createAxis(name: string): Promise<AxisCreateResponse> {
  const { data } = await apiClient.post('/api/learning-facade/axes', { name });
  return AxisCreateResponseSchema.parse(data);
}

export async function suggestAxes(limit = 5): Promise<AxisSuggestionResponse> {
  const { data } = await apiClient.post('/api/learning-facade/axes/suggestions', { limit });
  return AxisSuggestionResponseSchema.parse(data);
}

export async function createTopics(
  axisId: string,
  payload: CreateTopicsRequest,
): Promise<CreateTopicsResponse> {
  const validated = CreateTopicsRequestSchema.parse(payload);
  const { data } = await apiClient.post(
    `/learning-facade/axes/${axisId}/topics`,
    validated,
  );
  return CreateTopicsResponseSchema.parse(data);
}

export async function suggestTopics(
  axisId: string,
  limit = 5,
): Promise<TopicSuggestionResponse> {
  const { data } = await apiClient.post(
    `/learning-facade/axes/${axisId}/topics/suggestions`,
    { limit },
  );
  return TopicSuggestionResponseSchema.parse(data);
}

export async function createMaterial(
  payload: CreateMaterialRequest,
): Promise<CreateMaterialResponse> {
  const validated = CreateMaterialRequestSchema.parse(payload);
  const { data } = await apiClient.post('/api/learning-facade/materials', validated);
  return CreateMaterialResponseSchema.parse(data);
}

export async function listRevisionReasons(): Promise<RevisionReasonsResponse> {
  const { data } = await apiClient.get('/api/learning-facade/revision-reasons');
  return RevisionReasonsResponseSchema.parse(data);
}

export async function updateTopic(
  topicId: string,
  payload: UpdateTopicRequest,
): Promise<UpdateTopicResponse> {
  const validated = UpdateTopicRequestSchema.parse(payload);
  const { data } = await apiClient.patch(`/learning-facade/topics/${topicId}`, validated);
  return UpdateTopicResponseSchema.parse(data);
}
