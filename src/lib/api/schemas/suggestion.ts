import { z } from 'zod';

// product-ai-suggestion Epic 1 — 4-Port(Layer/Axis/Roadmap/Selections) Zod 정본.
// BE Story 11 4-Port record 시그니처와 정합. Signature drift 발견 시 본 파일 갱신.
// 모든 응답에 공통: `suggestionsAvailable`(Cascade 폴백 여부) · `providerContext`(dev only 관측).
// (참조: `workflows/fe/fe-workspectrum/sdd/in-progress/product-ai-suggestion.md` Story 1-1~1-4)

// ============================================================
// 1) Layer Port — POST /api/v1/suggestions/layers
// ============================================================
export const layerSuggestionRequestSchema = z.object({
  concepts: z.array(z.string().min(1)).min(1).max(5),
  facadeId: z.coerce.string().optional(),
});
export type LayerSuggestionRequest = z.infer<typeof layerSuggestionRequestSchema>;

export const layerSuggestionSchema = z.object({
  name: z.string(),
  rationale: z.string(),
  suggestedAxisCount: z.number().int().nonnegative(),
});
export type LayerSuggestion = z.infer<typeof layerSuggestionSchema>;

export const layerSuggestionsResponseSchema = z.object({
  layers: z.array(layerSuggestionSchema),
  suggestionsAvailable: z.boolean(),
  providerContext: z.string().optional(),
});
export type LayerSuggestionsResponse = z.infer<typeof layerSuggestionsResponseSchema>;

// ============================================================
// 2) Axis Port — POST /api/v1/suggestions/axes
// ============================================================
export const axisSuggestionRequestSchema = z.object({
  layerId: z.coerce.string(),
});
export type AxisSuggestionRequest = z.infer<typeof axisSuggestionRequestSchema>;

export const axisSuggestionSchema = z.object({
  name: z.string(),
  rationale: z.string(),
  roadmapDraft: z.string(),
});
export type AxisSuggestion = z.infer<typeof axisSuggestionSchema>;

export const axisSuggestionsResponseSchema = z.object({
  axes: z.array(axisSuggestionSchema),
  suggestionsAvailable: z.boolean(),
  providerContext: z.string().optional(),
});
export type AxisSuggestionsResponse = z.infer<typeof axisSuggestionsResponseSchema>;

// ============================================================
// 3) Roadmap Port — POST /api/v1/suggestions/roadmaps
// ============================================================
export const roadmapSuggestionRequestSchema = z.object({
  axisId: z.coerce.string(),
});
export type RoadmapSuggestionRequest = z.infer<typeof roadmapSuggestionRequestSchema>;

export const roadmapSuggestionResponseSchema = z.object({
  roadmapDraft: z.string(),
  suggestionsAvailable: z.boolean(),
  providerContext: z.string().optional(),
});
export type RoadmapSuggestionResponse = z.infer<typeof roadmapSuggestionResponseSchema>;

// ============================================================
// 4) Selections Port — POST /api/v1/suggestions/selections
// ============================================================
export const selectionsSuggestionRequestSchema = z.object({
  axisId: z.coerce.string(),
});
export type SelectionsSuggestionRequest = z.infer<typeof selectionsSuggestionRequestSchema>;

export const selectionSuggestionSchema = z.object({
  name: z.string(),
  content: z.string(),
});
export type SelectionSuggestion = z.infer<typeof selectionSuggestionSchema>;

export const selectionsSuggestionsResponseSchema = z.object({
  selections: z.array(selectionSuggestionSchema),
  suggestionsAvailable: z.boolean(),
  providerContext: z.string().optional(),
});
export type SelectionsSuggestionsResponse = z.infer<
  typeof selectionsSuggestionsResponseSchema
>;
