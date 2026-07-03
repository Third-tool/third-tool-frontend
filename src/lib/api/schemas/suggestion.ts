import { z } from 'zod';

// product-ai-suggestion Epic 1 — 6-Port Zod 정본 (2026-07-02 pivot).
// - Layer / Axis Port (S1-1/S1-2) 유지.
// - Roadmap / Selections Port (S1-3/S1-4) SUPERSEDED — outline/subtree 2단계로 분리.
//   M4 FE PR#5 (2026-07-15+): 4-Port schema · 훅 · endpoint · MSW route 물리 삭제 완료.
// - ChaptersOutline / ChapterSubtree / SelectionOutline / SelectionSubtree (S1-5~S1-8) 신설.
// BE 이슈 #17 대응. 모든 응답에 공통: `suggestionsAvailable`(Cascade 폴백) · `providerContext`(dev only).
// (참조: `workflows/fe/fe-workspectrum/sdd/in-progress/product-ai-suggestion.md` Story 1-1~1-8)

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
// 3) Roadmap Port · 4) Selections Port
// ── SUPERSEDED · 2026-07-02 이슈 #17 pivot
// ── M4 FE PR#5 (2026-07-15+): 물리 삭제 완료
// ── 대체: (5) ChaptersOutline + (6) ChapterSubtree
//         (7) SelectionOutline + (8) SelectionSubtree
// ============================================================

// ============================================================
// 공통: 챕터 outline 항목 (5) ~ (8) 재사용
// ============================================================
export const chapterOutlineItemSchema = z.object({
  title: z.string(),      // 예: "1. 하네스 엔지니어링 기초"
  rationale: z.string(),  // 예: "AI 에이전트의 기본 프레임 확립"
});
export type ChapterOutlineItem = z.infer<typeof chapterOutlineItemSchema>;

// ============================================================
// 5) ChaptersOutlinePort — POST /api/v1/suggestions/chapters-outline
// ============================================================
export const chaptersOutlineRequestSchema = z.object({
  concepts: z.array(z.string()).min(1).max(5),
  layerName: z.string(),
  axisName: z.string(),
});
export type ChaptersOutlineRequest = z.infer<typeof chaptersOutlineRequestSchema>;

export const chaptersOutlineResponseSchema = z.object({
  chapters: z.array(chapterOutlineItemSchema).min(1).max(10),
  suggestionsAvailable: z.boolean(),
  providerContext: z.string().optional(),
});
export type ChaptersOutlineResponse = z.infer<typeof chaptersOutlineResponseSchema>;

// ============================================================
// 6) ChapterSubtreePort — POST /api/v1/suggestions/chapter-subtree
// ============================================================
export const chapterSubtreeRequestSchema = z.object({
  chapter: chapterOutlineItemSchema,
  siblings: z.array(chapterOutlineItemSchema),
  layerName: z.string(),
  axisName: z.string(),
});
export type ChapterSubtreeRequest = z.infer<typeof chapterSubtreeRequestSchema>;

export const chapterSubtreeResponseSchema = z.object({
  bodyAsciiTree: z.string(), // "├── 1-1. 정의와 본질\n│       ..."
  suggestionsAvailable: z.boolean(),
  providerContext: z.string().optional(),
});
export type ChapterSubtreeResponse = z.infer<typeof chapterSubtreeResponseSchema>;

// ============================================================
// 7) SelectionOutlinePort — POST /api/v1/suggestions/selection-outline
// ============================================================
export const selectionOutlineRequestSchema = z.object({
  concepts: z.array(z.string()).min(1).max(5),
  layerName: z.string(),
  axisName: z.string(),
  roadmapChapters: z.array(chapterOutlineItemSchema),
});
export type SelectionOutlineRequest = z.infer<typeof selectionOutlineRequestSchema>;

export const selectionOutlineResponseSchema = z.object({
  containerName: z.string(), // 예: "웹 서비스 실전 v1"
  chapters: z.array(chapterOutlineItemSchema).min(1).max(10),
  suggestionsAvailable: z.boolean(),
  providerContext: z.string().optional(),
});
export type SelectionOutlineResponse = z.infer<typeof selectionOutlineResponseSchema>;

// ============================================================
// 8) SelectionSubtreePort — POST /api/v1/suggestions/selection-subtree
// ============================================================
export const selectionSubtreeRequestSchema = z.object({
  chapter: chapterOutlineItemSchema,
  siblings: z.array(chapterOutlineItemSchema),
  containerName: z.string(),
  layerName: z.string(),
  axisName: z.string(),
});
export type SelectionSubtreeRequest = z.infer<typeof selectionSubtreeRequestSchema>;

export const selectionSubtreeResponseSchema = z.object({
  bodyAsciiTree: z.string(),
  suggestionsAvailable: z.boolean(),
  providerContext: z.string().optional(),
});
export type SelectionSubtreeResponse = z.infer<typeof selectionSubtreeResponseSchema>;
