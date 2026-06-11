import { apiClient } from '@/lib/api/client';
import {
  CardSchema,
  ViewCardResponseSchema,
  CreateCardRequestSchema,
  type Card,
  type ViewCardResponse,
  type CreateCardRequest,
} from '@/lib/api/schemas/card';
import {
  ReviewSessionSchema,
  ExtendReviewResponseSchema,
  type ReviewSession,
  type ExtendReviewResponse,
} from '@/lib/api/schemas/review';
import { z } from 'zod';

export async function getTodayReview(params: { dailyTarget: number }): Promise<ReviewSession> {
  const { data } = await apiClient.get('/review-session/today', { params });
  return ReviewSessionSchema.parse(data);
}

export async function viewCard(cardId: string): Promise<ViewCardResponse> {
  const { data } = await apiClient.post(`/cards/${cardId}/view`);
  return ViewCardResponseSchema.parse(data);
}

export async function archiveCard(cardId: string): Promise<Card> {
  const { data } = await apiClient.post(`/cards/${cardId}/archive`);
  return CardSchema.parse(data);
}

export async function extendSession(params: { count: number }): Promise<ExtendReviewResponse> {
  const { data } = await apiClient.post('/review-session/extend', null, { params });
  return ExtendReviewResponseSchema.parse(data);
}

const ArchiveListSchema = z.array(CardSchema);

export async function listArchiveCards(filter: { tagId?: string } = {}): Promise<Card[]> {
  const params: Record<string, string> = { status: 'ARCHIVE' };
  if (filter.tagId) params.tagId = filter.tagId;
  const { data } = await apiClient.get('/cards', { params });
  return ArchiveListSchema.parse(data);
}

export async function returnToField(cardId: string): Promise<Card> {
  const { data } = await apiClient.post(`/cards/${cardId}/return-to-field`);
  return CardSchema.parse(data);
}

export async function createCard(payload: CreateCardRequest): Promise<Card> {
  const validated = CreateCardRequestSchema.parse(payload);
  const { data } = await apiClient.post('/cards', validated);
  return CardSchema.parse(data);
}
