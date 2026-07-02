import { apiClient } from '@/lib/api/client';
import {
  layerSuggestionRequestSchema,
  layerSuggestionsResponseSchema,
  axisSuggestionRequestSchema,
  axisSuggestionsResponseSchema,
  roadmapSuggestionRequestSchema,
  roadmapSuggestionResponseSchema,
  selectionsSuggestionRequestSchema,
  selectionsSuggestionsResponseSchema,
  type LayerSuggestionRequest,
  type LayerSuggestionsResponse,
  type AxisSuggestionRequest,
  type AxisSuggestionsResponse,
  type RoadmapSuggestionRequest,
  type RoadmapSuggestionResponse,
  type SelectionsSuggestionRequest,
  type SelectionsSuggestionsResponse,
} from '@/lib/api/schemas/suggestion';

// product-ai-suggestion Epic 1. 4-Port POST endpoint 함수.

export async function suggestLayers(
  payload: LayerSuggestionRequest,
): Promise<LayerSuggestionsResponse> {
  const validated = layerSuggestionRequestSchema.parse(payload);
  const { data } = await apiClient.post('/api/v1/suggestions/layers', validated);
  return layerSuggestionsResponseSchema.parse(data);
}

export async function suggestAxes(
  payload: AxisSuggestionRequest,
): Promise<AxisSuggestionsResponse> {
  const validated = axisSuggestionRequestSchema.parse(payload);
  const { data } = await apiClient.post('/api/v1/suggestions/axes', validated);
  return axisSuggestionsResponseSchema.parse(data);
}

export async function suggestRoadmap(
  payload: RoadmapSuggestionRequest,
): Promise<RoadmapSuggestionResponse> {
  const validated = roadmapSuggestionRequestSchema.parse(payload);
  const { data } = await apiClient.post('/api/v1/suggestions/roadmaps', validated);
  return roadmapSuggestionResponseSchema.parse(data);
}

export async function suggestSelections(
  payload: SelectionsSuggestionRequest,
): Promise<SelectionsSuggestionsResponse> {
  const validated = selectionsSuggestionRequestSchema.parse(payload);
  const { data } = await apiClient.post(
    '/api/v1/suggestions/selections',
    validated,
  );
  return selectionsSuggestionsResponseSchema.parse(data);
}
