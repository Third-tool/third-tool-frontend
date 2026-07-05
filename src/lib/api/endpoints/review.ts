import { apiClient } from '@/lib/api/client';
import {
  ReviewCardSchema,
  ReviewSessionResponseSchema,
  NextCardResponseSchema,
  StartReviewRequestSchema,
  StartFromBatchRequestSchema,
  StartFromBatchResponseSchema,
  RecordViewRequestSchema,
  RecordViewResponseSchema,
  type ReviewCard,
  type ReviewSessionResponse,
  type NextCardResponse,
  type StartFromBatchResponse,
  type RecordViewResponse,
} from '@/lib/api/schemas/review';

// R-1 POST /api/v1/reviews — create a new session bound to one deck.
export async function startReviewSession(deckId: string): Promise<ReviewSessionResponse> {
  const validated = StartReviewRequestSchema.parse({ deckId });
  const { data } = await apiClient.post('/api/v1/reviews', validated);
  return ReviewSessionResponseSchema.parse(data);
}

// R-2 GET /api/v1/reviews/{sessionId}
export async function getReviewSession(sessionId: string): Promise<ReviewSessionResponse> {
  const { data } = await apiClient.get(`/api/v1/reviews/${sessionId}`);
  return ReviewSessionResponseSchema.parse(data);
}

// R-3 PATCH /api/v1/reviews/{sessionId}/comparing — populate keywordCues + summary.
export async function flipToComparing(sessionId: string): Promise<ReviewCard> {
  const { data } = await apiClient.patch(`/api/v1/reviews/${sessionId}/comparing`);
  return ReviewCardSchema.parse(data);
}

// R-4 PATCH /api/v1/reviews/{sessionId}/next — advance, increment viewCount BE-side.
export async function moveToNextCard(sessionId: string): Promise<NextCardResponse> {
  const { data } = await apiClient.patch(`/api/v1/reviews/${sessionId}/next`);
  return NextCardResponseSchema.parse(data);
}

// M5 신설(2026-07-22+): Story 2-1 · POST /api/v1/review-sessions/from-batch.
// 오늘 batch 기반 세션 생성 · 진행 중 세션 있으면 자동 finish + previousSessionAutoFinished=true.
export async function startReviewFromBatch(batchId: string): Promise<StartFromBatchResponse> {
  const validated = StartFromBatchRequestSchema.parse({ batchId });
  const { data } = await apiClient.post('/api/v1/review-sessions/from-batch', validated);
  return StartFromBatchResponseSchema.parse(data);
}

// M5 신설(2026-07-22+): Story 2-3 · POST /api/v1/review-sessions/{sessionId}/record-view.
// 개별 카드 clear 기록 · BE가 card.recordView + batch.markViewed 동시 처리 · batch progress 갱신.
export async function recordView(
  sessionId: string,
  cardId: string,
): Promise<RecordViewResponse> {
  const validated = RecordViewRequestSchema.parse({ cardId });
  const { data } = await apiClient.post(
    `/api/v1/review-sessions/${sessionId}/record-view`,
    validated,
  );
  return RecordViewResponseSchema.parse(data);
}
