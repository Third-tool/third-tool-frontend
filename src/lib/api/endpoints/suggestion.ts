import { apiClient } from '@/lib/api/client';
import {
  layerSuggestionRequestSchema,
  layerSuggestionsResponseSchema,
  axisSuggestionRequestSchema,
  axisSuggestionsResponseSchema,
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
// M4 FE PR#5 (2026-07-15+): 4-Port (Roadmap/Selections) SUPERSEDED 물리 삭제 완료.

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

// ─── S1-5 ChaptersOutline ───────────────────────────────────
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

// ─── S1-6 ChapterSubtree ────────────────────────────────────
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

// ─── S1-7 SelectionOutline ──────────────────────────────────
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

// ─── S1-8 SelectionSubtree ──────────────────────────────────
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
