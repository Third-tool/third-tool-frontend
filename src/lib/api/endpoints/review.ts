import { apiClient } from '@/lib/api/client';
import {
  ReviewCardSchema,
  ReviewSessionResponseSchema,
  NextCardResponseSchema,
  StartReviewRequestSchema,
  type ReviewCard,
  type ReviewSessionResponse,
  type NextCardResponse,
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
