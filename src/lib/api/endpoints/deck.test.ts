import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/api/client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
  ApiError: class extends Error {
    code: string;
    status: number;
    constructor(code: string, msg: string, status: number) {
      super(msg);
      this.code = code;
      this.status = status;
    }
  },
}));

import { apiClient } from '@/lib/api/client';
import { listDecks, createAxisDeck } from './deck';

const mockGet = apiClient.get as unknown as ReturnType<typeof vi.fn>;
const mockPost = apiClient.post as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockGet.mockReset();
  mockPost.mockReset();
});

describe('listDecks', () => {
  it('coerces numeric Long axisId to string on summaries', async () => {
    mockGet.mockResolvedValue({
      data: {
        content: [
          { deckId: 7, name: 'd', axisId: 3, depth: 0, onLibrary: false, cardCount: 0, subDeckCount: 0 },
          { deckId: 8, name: 'orphan', axisId: null, depth: 0, onLibrary: false, cardCount: 0, subDeckCount: 0 },
        ],
        totalElements: 2,
        totalPages: 1,
        page: 0,
        size: 20,
      },
    });
    const page = await listDecks({ page: 0, size: 20 });
    expect(page.content[0]).toMatchObject({ deckId: '7', axisId: '3' });
    expect(page.content[1].axisId).toBeNull();
  });
});

describe('createAxisDeck', () => {
  it('POSTs to the axis-scoped path and returns an axis-linked deck', async () => {
    mockPost.mockResolvedValue({
      data: { deckId: 42, name: '도메인 모델링', axisId: 3, depth: 0, onLibrary: false },
    });
    const res = await createAxisDeck('3', '도메인 모델링');
    expect(mockPost).toHaveBeenCalledWith(
      '/api/v1/learning-facade/axes/3/decks',
      { name: '도메인 모델링' },
    );
    expect(res).toMatchObject({ deckId: '42', axisId: '3', name: '도메인 모델링' });
  });
});
