import { apiClient } from '@/lib/api/client';
import {
  DeckCreateResponseSchema,
  DeckDetailSchema,
  DeckPageSchema,
  CreateDeckRequestSchema,
  type DeckCreateResponse,
  type DeckDetail,
  type DeckPage,
  type CreateDeckRequest,
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
