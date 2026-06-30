import { apiClient } from '@/lib/api/client';
import {
  DeckCreateResponseSchema,
  DeckDetailSchema,
  DeckPageSchema,
  CreateDeckRequestSchema,
  CreateAxisDeckRequestSchema,
  RenameDeckRequestSchema,
  RenameDeckResponseSchema,
  MoveDeckRequestSchema,
  MoveDeckResponseSchema,
  SubDeckListSchema,
  type DeckCreateResponse,
  type DeckDetail,
  type DeckPage,
  type CreateDeckRequest,
  type RenameDeckResponse,
  type MoveDeckResponse,
  type SubDeckList,
} from '@/lib/api/schemas/deck';

interface ListParams {
  page?: number;
  size?: number;
}

export async function listDecks(params: ListParams = {}): Promise<DeckPage> {
  const { data } = await apiClient.get('/api/v1/decks', {
    params: { page: params.page ?? 0, size: params.size ?? 50 },
  });
  return DeckPageSchema.parse(data);
}

export async function getDeck(deckId: string): Promise<DeckDetail> {
  const { data } = await apiClient.get(`/api/v1/decks/${deckId}`);
  return DeckDetailSchema.parse(data);
}

export async function createDeck(payload: CreateDeckRequest): Promise<DeckCreateResponse> {
  const validated = CreateDeckRequestSchema.parse(payload);
  const { data } = await apiClient.post('/api/v1/decks', validated);
  return DeckCreateResponseSchema.parse(data);
}

// Creates a deck already linked to the given axis (cards land inside the axis
// scope, so they appear in the axis view + today feed instead of an orphan deck).
export async function createAxisDeck(
  axisId: string,
  name: string,
): Promise<DeckCreateResponse> {
  const validated = CreateAxisDeckRequestSchema.parse({ name });
  const { data } = await apiClient.post(
    `/api/v1/learning-facade/axes/${axisId}/decks`,
    validated,
  );
  return DeckCreateResponseSchema.parse(data);
}

export async function listSubDecks(deckId: string): Promise<SubDeckList> {
  const { data } = await apiClient.get(`/api/v1/decks/${deckId}/sub-decks`);
  return SubDeckListSchema.parse(data);
}

export async function renameDeck(deckId: string, name: string): Promise<RenameDeckResponse> {
  const validated = RenameDeckRequestSchema.parse({ name });
  const { data } = await apiClient.patch(`/api/v1/decks/${deckId}/name`, validated);
  return RenameDeckResponseSchema.parse(data);
}

export async function moveDeck(
  deckId: string,
  parentDeckId: string | null,
): Promise<MoveDeckResponse> {
  const validated = MoveDeckRequestSchema.parse({ parentDeckId });
  const { data } = await apiClient.patch(`/api/v1/decks/${deckId}/parent`, validated);
  return MoveDeckResponseSchema.parse(data);
}

export async function deleteDeck(deckId: string): Promise<void> {
  await apiClient.delete(`/api/v1/decks/${deckId}`);
}
