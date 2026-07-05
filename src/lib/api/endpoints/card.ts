import { apiClient } from '@/lib/api/client';
import {
  CardSchema,
  CreateCardRequestSchema,
  RawCardDetailSchema,
  RawCardSummarySchema,
  AddTagRequestSchema,
  CardTagsResponseSchema,
  UpdateSummaryRequestSchema,
  UpdateSummaryResponseSchema,
  AddKeywordRequestSchema,
  ReplaceKeywordsRequestSchema,
  CardKeywordsResponseSchema,
  adaptCardDetail,
  adaptCardSummary,
  adaptCardTags,
  adaptCardKeywords,
  type Card,
  type CreateCardRequest,
  type TagOnCard,
  type KeywordOnCard,
  type UpdateSummaryResponse,
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

export async function getCard(cardId: string): Promise<Card> {
  const { data } = await apiClient.get(`/api/v1/cards/${cardId}`);
  const raw = RawCardDetailSchema.parse(data);
  return adaptCardDetail(raw);
}

export async function addCardTag(
  cardId: string,
  value: string,
): Promise<{ cardId: string; tags: TagOnCard[] }> {
  const validated = AddTagRequestSchema.parse({ value });
  const { data } = await apiClient.post(`/api/v1/cards/${cardId}/tags`, validated);
  const raw = CardTagsResponseSchema.parse(data);
  return adaptCardTags(raw);
}

export async function removeCardTag(
  cardId: string,
  tagId: string,
): Promise<{ cardId: string; tags: TagOnCard[] }> {
  const { data } = await apiClient.delete(`/api/v1/cards/${cardId}/tags/${tagId}`);
  const raw = CardTagsResponseSchema.parse(data);
  return adaptCardTags(raw);
}

export async function updateCardSummary(
  cardId: string,
  summary: string,
): Promise<UpdateSummaryResponse> {
  const validated = UpdateSummaryRequestSchema.parse({ summary });
  const { data } = await apiClient.patch(`/api/v1/cards/${cardId}/summary`, validated);
  return UpdateSummaryResponseSchema.parse(data);
}

export async function deleteCard(cardId: string): Promise<void> {
  await apiClient.delete(`/api/v1/cards/${cardId}`);
}

// K-1 POST /api/v1/cards/{cardId}/keywords { value }
export async function addCardKeyword(
  cardId: string,
  value: string,
): Promise<{ cardId: string; keywords: KeywordOnCard[] }> {
  const validated = AddKeywordRequestSchema.parse({ value });
  const { data } = await apiClient.post(`/api/v1/cards/${cardId}/keywords`, validated);
  const raw = CardKeywordsResponseSchema.parse(data);
  return adaptCardKeywords(raw);
}

// K-2 DELETE /api/v1/cards/{cardId}/keywords/{keywordCueId}
export async function removeCardKeyword(
  cardId: string,
  keywordId: string,
): Promise<{ cardId: string; keywords: KeywordOnCard[] }> {
  const { data } = await apiClient.delete(
    `/api/v1/cards/${cardId}/keywords/${keywordId}`,
  );
  const raw = CardKeywordsResponseSchema.parse(data);
  return adaptCardKeywords(raw);
}

// K-3 PUT /api/v1/cards/{cardId}/keywords { keywords: [{value}] }
export async function replaceCardKeywords(
  cardId: string,
  values: string[],
): Promise<{ cardId: string; keywords: KeywordOnCard[] }> {
  const validated = ReplaceKeywordsRequestSchema.parse({
    keywords: values.map((value) => ({ value })),
  });
  const { data } = await apiClient.put(`/api/v1/cards/${cardId}/keywords`, validated);
  const raw = CardKeywordsResponseSchema.parse(data);
  return adaptCardKeywords(raw);
}

// M5 재편(2026-07-22+): LT-E5-DECK-ABOLISH · POST /axes/{axisId}/cards.
// 기존 /decks/{deckId}/cards 엔드포인트 폐기 · Card → Axis 직접 매핑.
export async function createCard(payload: CreateCardRequest): Promise<Card> {
  const validated = CreateCardRequestSchema.parse(payload);
  const body = {
    mainNote: { textContent: validated.mainText, imageUrl: null },
    keywords: validated.keywords,
    summary: validated.summary,
    tags: validated.tags,
  };
  const { data } = await apiClient.post(`/api/v1/axes/${validated.axisId}/cards`, body);
  const raw = RawCardDetailSchema.parse(data);
  return adaptCardDetail(raw);
}

// M5 재편(2026-07-22+): Deck 폐기 후 archive filter는 axis 또는 tag 기반.
// axisId 미지정 시 tagId만 있으면 tag-scope · 둘 다 없으면 빈 배열.
interface ArchiveFilter {
  axisId?: string;
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
  if (!filter.axisId) return [];
  const { data } = await apiClient.get(`/api/v1/axes/${filter.axisId}/cards`);
  const list = z.array(RawCardSummarySchema).parse(data);
  return list
    .filter((c) => c.status === 'ARCHIVE')
    .map((c) => adaptCardSummary(c));
}

// M5 신설(2026-07-22+): LT-E4-CARD-AXIS · Card → Axis 직접 매핑 대응.
// GET /api/v1/axes/{axisId}/cards → 이 축에 연결된 카드 리스트.
// BE PR#4 (LT-E4-CARD-AXIS · `card.axis_id NOT NULL` 승격) 응답 소비.
export async function listAxisCards(axisId: string): Promise<Card[]> {
  const { data } = await apiClient.get(`/api/v1/axes/${axisId}/cards`);
  const list = z.array(RawCardSummarySchema).parse(data);
  return list.map((c) => adaptCardSummary(c));
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
