import { apiClient } from '@/lib/api/client';
import {
  CardSchema,
  CreateCardRequestSchema,
  RawCardDetailSchema,
  RawCardSummarySchema,
  adaptCardDetail,
  adaptCardSummary,
  type Card,
  type CreateCardRequest,
} from '@/lib/api/schemas/card';
import {
  ExtendReviewResponseSchema,
  TodayCandidatesSchema,
  adaptTodayCandidates,
  type ReviewSession,
  type ExtendReviewResponse,
} from '@/lib/api/schemas/review';
import { z } from 'zod';

interface TodayQueryParams {
  dailyTarget?: number;
}

// Backend's /api/v1/review-session/today takes an optional `target` query param
// that overrides the user's stored dailyTarget. Pass dailyTarget through as that
// override so existing FE callers keep their "+N more" semantics.
export async function getTodayReview(params: TodayQueryParams = {}): Promise<ReviewSession> {
  const query: Record<string, number> = {};
  if (params.dailyTarget !== undefined) query.target = params.dailyTarget;
  const { data } = await apiClient.get('/api/v1/review-session/today', { params: query });
  const raw = TodayCandidatesSchema.parse(data);
  return adaptTodayCandidates(raw);
}

export async function archiveCard(cardId: string): Promise<Card> {
  const { data } = await apiClient.post(`/api/v1/cards/${cardId}/archive`, {
    reason: 'MANUAL',
  });
  const raw = RawCardDetailSchema.parse(data);
  return adaptCardDetail(raw);
}

export async function returnToField(cardId: string): Promise<Card> {
  const { data } = await apiClient.post(`/api/v1/cards/${cardId}/return-to-field`);
  const raw = RawCardDetailSchema.parse(data);
  return adaptCardDetail(raw);
}

export async function createCard(payload: CreateCardRequest): Promise<Card> {
  const validated = CreateCardRequestSchema.parse(payload);
  const body = {
    mainNote: { textContent: validated.mainText, imageUrl: null },
    keywords: validated.keywords,
    summary: validated.summary,
    tags: validated.tags,
  };
  const { data } = await apiClient.post(`/api/v1/decks/${validated.deckId}/cards`, body);
  const raw = RawCardDetailSchema.parse(data);
  return adaptCardDetail(raw);
}

// Backend exposes archive only as a deck-scoped or tag-scoped list. ArchivePage
// currently passes a tagId filter or null; when no tagId the caller must supply
// a deckId so we can hit /api/v1/decks/{deckId}/cards and filter ARCHIVE locally.
interface ArchiveFilter {
  deckId?: string;
  tagId?: string;
}

export async function listArchiveCards(filter: ArchiveFilter = {}): Promise<Card[]> {
  if (filter.tagId) {
    const { data } = await apiClient.get(`/api/v1/tags/${filter.tagId}/cards`);
    const TagCardsSchema = z.object({
      onField: z.array(RawCardSummarySchema),
      archive: z.array(RawCardSummarySchema),
    });
    const parsed = TagCardsSchema.parse(data);
    return parsed.archive.map((c) => adaptCardSummary(c));
  }
  if (!filter.deckId) return [];
  const { data } = await apiClient.get(`/api/v1/decks/${filter.deckId}/cards`);
  const list = z.array(RawCardSummarySchema).parse(data);
  return list
    .filter((c) => c.status === 'ARCHIVE')
    .map((c) => adaptCardSummary(c, filter.deckId));
}

// Backend doesn't yet offer "extend session by N" — re-fetch today with a new
// target. completedAll is true when the new pool is empty.
export async function extendSession(params: { count: number }): Promise<ExtendReviewResponse> {
  const current = await getTodayReview({ dailyTarget: params.count });
  const result = {
    addedCards: current.cards,
    remainingAvailable: Math.max(current.cards.length - params.count, 0),
    completedAll: current.cards.length === 0,
  };
  return ExtendReviewResponseSchema.parse(result);
}

// Kept for backward compatibility with tests; backend has no /cards/{id}/view.
// The real recordView fires inside /api/v1/reviews/{id}/next.
export const CardListSchema = z.array(CardSchema);
