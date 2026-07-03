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
  chaptersOutlineRequestSchema,
  chaptersOutlineResponseSchema,
  chapterSubtreeRequestSchema,
  chapterSubtreeResponseSchema,
  selectionOutlineRequestSchema,
  selectionOutlineResponseSchema,
  selectionSubtreeRequestSchema,
  selectionSubtreeResponseSchema,
  type LayerSuggestionRequest,
  type LayerSuggestionsResponse,
  type AxisSuggestionRequest,
  type AxisSuggestionsResponse,
  type RoadmapSuggestionRequest,
  type RoadmapSuggestionResponse,
  type SelectionsSuggestionRequest,
  type SelectionsSuggestionsResponse,
  type ChaptersOutlineRequest,
  type ChaptersOutlineResponse,
  type ChapterSubtreeRequest,
  type ChapterSubtreeResponse,
  type SelectionOutlineRequest,
  type SelectionOutlineResponse,
  type SelectionSubtreeRequest,
  type SelectionSubtreeResponse,
} from '@/lib/api/schemas/suggestion';

// product-ai-suggestion Epic 1. 6-Port POST endpoint 함수 (2026-07-02 pivot).

// ─── S1-1 Layer ─────────────────────────────────────────────
export async function suggestLayers(
  payload: LayerSuggestionRequest,
): Promise<LayerSuggestionsResponse> {
  const validated = layerSuggestionRequestSchema.parse(payload);
  const { data } = await apiClient.post('/api/v1/suggestions/layers', validated);
  return layerSuggestionsResponseSchema.parse(data);
}

// ─── S1-2 Axis ──────────────────────────────────────────────
export async function suggestAxes(
  payload: AxisSuggestionRequest,
): Promise<AxisSuggestionsResponse> {
  const validated = axisSuggestionRequestSchema.parse(payload);
  const { data } = await apiClient.post('/api/v1/suggestions/axes', validated);
  return axisSuggestionsResponseSchema.parse(data);
}

// ─── S1-3 Roadmap (SUPERSEDED · 2026-07-02) ─────────────────
/** @deprecated 이슈 #17 pivot — `suggestChaptersOutline` + `suggestChapterSubtree` 로 대체. */
export async function suggestRoadmap(
  payload: RoadmapSuggestionRequest,
): Promise<RoadmapSuggestionResponse> {
  const validated = roadmapSuggestionRequestSchema.parse(payload);
  const { data } = await apiClient.post('/api/v1/suggestions/roadmaps', validated);
  return roadmapSuggestionResponseSchema.parse(data);
}

// ─── S1-4 Selections (SUPERSEDED · 2026-07-02) ──────────────
/** @deprecated 이슈 #17 pivot — `suggestSelectionOutline` + `suggestSelectionSubtree` 로 대체. */
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

// ─── S1-5 ChaptersOutline (신설) ────────────────────────────
export async function suggestChaptersOutline(
  payload: ChaptersOutlineRequest,
): Promise<ChaptersOutlineResponse> {
  const validated = chaptersOutlineRequestSchema.parse(payload);
  const { data } = await apiClient.post(
    '/api/v1/suggestions/chapters-outline',
    validated,
  );
  return chaptersOutlineResponseSchema.parse(data);
}

// ─── S1-6 ChapterSubtree (신설) ─────────────────────────────
export async function suggestChapterSubtree(
  payload: ChapterSubtreeRequest,
): Promise<ChapterSubtreeResponse> {
  const validated = chapterSubtreeRequestSchema.parse(payload);
  const { data } = await apiClient.post(
    '/api/v1/suggestions/chapter-subtree',
    validated,
  );
  return chapterSubtreeResponseSchema.parse(data);
}

// ─── S1-7 SelectionOutline (신설) ───────────────────────────
export async function suggestSelectionOutline(
  payload: SelectionOutlineRequest,
): Promise<SelectionOutlineResponse> {
  const validated = selectionOutlineRequestSchema.parse(payload);
  const { data } = await apiClient.post(
    '/api/v1/suggestions/selection-outline',
    validated,
  );
  return selectionOutlineResponseSchema.parse(data);
}

// ─── S1-8 SelectionSubtree (신설) ───────────────────────────
export async function suggestSelectionSubtree(
  payload: SelectionSubtreeRequest,
): Promise<SelectionSubtreeResponse> {
  const validated = selectionSubtreeRequestSchema.parse(payload);
  const { data } = await apiClient.post(
    '/api/v1/suggestions/selection-subtree',
    validated,
  );
  return selectionSubtreeResponseSchema.parse(data);
}
