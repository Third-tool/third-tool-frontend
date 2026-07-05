import { z } from 'zod';

// FE-friendly aggregated label. Backend SoftScheduleState
// (FRESH / INTERVAL_1D / 3D / 7D / 14D / 21D) collapses into these three.
export const ReviewStateLabelSchema = z.enum(['DAY_1', 'DAY_3', 'DAY_7']);
export type ReviewStateLabel = z.infer<typeof ReviewStateLabelSchema>;

export const ReviewSessionCardSchema = z.object({
  cardId: z.coerce.string(),
  state: ReviewStateLabelSchema,
  summary: z.string(),
  deckId: z.coerce.string().optional(),
  deckName: z.string().optional(),
});
export type ReviewSessionCard = z.infer<typeof ReviewSessionCardSchema>;

export const ReviewSessionSchema = z.object({
  stateBreakdown: z.object({
    DAY_1: z.number().int().nonnegative(),
    DAY_3: z.number().int().nonnegative(),
    DAY_7: z.number().int().nonnegative(),
  }),
  recommended: z.number().int().nonnegative(),
  cards: z.array(ReviewSessionCardSchema),
});
export type ReviewSession = z.infer<typeof ReviewSessionSchema>;

export const ExtendReviewResponseSchema = z.object({
  addedCards: z.array(ReviewSessionCardSchema),
  remainingAvailable: z.number().int().nonnegative(),
  completedAll: z.boolean(),
});
export type ExtendReviewResponse = z.infer<typeof ExtendReviewResponseSchema>;

// Raw backend shape for /api/v1/review-session/today. The endpoint adapter
// collapses byState/recommendedByState into the FE-friendly ReviewSession above.
export const SoftScheduleStateSchema = z.enum([
  'FRESH',
  'INTERVAL_1D',
  'INTERVAL_3D',
  'INTERVAL_7D',
  'INTERVAL_14D',
  'INTERVAL_21D',
]);
export type SoftScheduleState = z.infer<typeof SoftScheduleStateSchema>;

export const TodayCandidateItemSchema = z.object({
  cardId: z.coerce.string(),
  deckId: z.coerce.string(),
  deckName: z.string(),
  summary: z.string(),
});
export type TodayCandidateItem = z.infer<typeof TodayCandidateItemSchema>;

export const TodayCandidatesSchema = z.object({
  total: z.number().int().nonnegative(),
  dailyTarget: z.number().int().nonnegative(),
  recommendedTotal: z.number().int().nonnegative(),
  recommendedByState: z.record(SoftScheduleStateSchema, z.number().int().nonnegative()),
  byState: z.record(SoftScheduleStateSchema, z.array(TodayCandidateItemSchema)),
});
export type TodayCandidates = z.infer<typeof TodayCandidatesSchema>;

const STATE_TO_DAY: Record<SoftScheduleState, ReviewStateLabel> = {
  FRESH: 'DAY_1',
  INTERVAL_1D: 'DAY_1',
  INTERVAL_3D: 'DAY_3',
  INTERVAL_7D: 'DAY_7',
  INTERVAL_14D: 'DAY_7',
  INTERVAL_21D: 'DAY_7',
};

// ─── Review BC session schemas (R-1 ~ R-4) ───────────────────────────────────
// Backend Review BC drives RECALLING → COMPARING progression and viewCount per
// card. keywordCues + summary are populated only after the COMPARING flip.

export const ReviewStepSchema = z.enum(['RECALLING', 'COMPARING']);
export type ReviewStep = z.infer<typeof ReviewStepSchema>;

export const ReviewCardSchema = z.object({
  cardReviewId: z.coerce.string(),
  cardId: z.coerce.string(),
  cardOrder: z.number().int().nonnegative(),
  reviewStep: ReviewStepSchema,
  isLastView: z.boolean(),
  mainNote: z.object({ text: z.string() }),
  keywordCues: z.array(z.object({ value: z.string() })).optional(),
  summary: z.string().nullable().optional(),
  comparingStartedAt: z.string().nullable().optional(),
});
export type ReviewCard = z.infer<typeof ReviewCardSchema>;

export const ReviewSessionResponseSchema = z.object({
  sessionId: z.coerce.string(),
  deckId: z.coerce.string(),
  deckName: z.string(),
  totalCardCount: z.number().int().nonnegative(),
  currentIndex: z.number().int().nonnegative(),
  isFinished: z.boolean(),
  currentCard: ReviewCardSchema.nullable(),
});
export type ReviewSessionResponse = z.infer<typeof ReviewSessionResponseSchema>;

export const NextCardResponseSchema = z.object({
  sessionId: z.coerce.string(),
  currentIndex: z.number().int().nonnegative(),
  isFinished: z.boolean(),
  currentCard: ReviewCardSchema.nullable(),
});
export type NextCardResponse = z.infer<typeof NextCardResponseSchema>;

export const StartReviewRequestSchema = z.object({
  deckId: z.coerce.string(),
});
export type StartReviewRequest = z.infer<typeof StartReviewRequestSchema>;

// M5 신설(2026-07-22+): product-review Epic 2 Story 2-1.
// BE 이슈 #25 (Cross-Layer scope 재편) · Session이 daily batch를 원천으로 카드 pull.
// deck-scope 세션 (`StartReviewRequest`)는 하위 호환 유지 · 신규 진입은 from-batch 사용.
export const StartFromBatchRequestSchema = z.object({
  batchId: z.string(),
});
export type StartFromBatchRequest = z.infer<typeof StartFromBatchRequestSchema>;

// POST /api/v1/review-sessions/from-batch 응답 · 이전 세션 자동 finish 여부 포함.
export const StartFromBatchResponseSchema = z.object({
  sessionId: z.coerce.string(),
  dailyBatchId: z.string().nullable().optional(),
  totalCardCount: z.number().int().nonnegative(),
  currentIndex: z.number().int().nonnegative(),
  isFinished: z.boolean(),
  currentCard: ReviewCardSchema.nullable(),
  // BE가 이전 진행 중 세션을 자동 finish 처리했으면 previousSessionAutoFinished=true.
  previousSessionAutoFinished: z.boolean().default(false),
});
export type StartFromBatchResponse = z.infer<typeof StartFromBatchResponseSchema>;

// M5 신설(2026-07-22+): Story 2-3 record-view.
// POST /api/v1/review-sessions/{sessionId}/record-view { cardId } · batch.markViewed 트리거.
export const RecordViewRequestSchema = z.object({
  cardId: z.string(),
});
export type RecordViewRequest = z.infer<typeof RecordViewRequestSchema>;

export const RecordViewResponseSchema = z.object({
  sessionId: z.coerce.string(),
  cardId: z.coerce.string(),
  viewedAt: z.string(),
  // batch 동기화 결과 · UI progress 갱신용.
  batchViewedCount: z.number().int().nonnegative(),
  batchTotalCount: z.number().int().positive(),
});
export type RecordViewResponse = z.infer<typeof RecordViewResponseSchema>;

export function adaptTodayCandidates(raw: TodayCandidates): ReviewSession {
  const cards: ReviewSessionCard[] = [];
  const breakdown = { DAY_1: 0, DAY_3: 0, DAY_7: 0 };
  for (const state of Object.keys(raw.byState) as SoftScheduleState[]) {
    const items = raw.byState[state] ?? [];
    const day = STATE_TO_DAY[state];
    for (const item of items) {
      cards.push({
        cardId: item.cardId,
        state: day,
        summary: item.summary,
        deckId: item.deckId,
        deckName: item.deckName,
      });
      breakdown[day] += 1;
    }
  }
  return {
    stateBreakdown: breakdown,
    recommended: raw.recommendedTotal,
    cards,
  };
}
