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
import {
  getTodayReview,
  archiveCard,
  extendSession,
  listArchiveCards,
  returnToField,
  createCard,
} from './card';

const mockGet = apiClient.get as unknown as ReturnType<typeof vi.fn>;
const mockPost = apiClient.post as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockGet.mockReset();
  mockPost.mockReset();
});

const detail = (overrides: Partial<{ cardId: number; status: 'ON_FIELD' | 'ARCHIVE'; viewCount: number }> = {}) => ({
  cardId: overrides.cardId ?? 1,
  deckId: 10,
  mainNote: { textContent: 'hi', imageUrl: null, contentType: 'TEXT' },
  keywords: [{ id: 100, value: 'k' }],
  summary: 's',
  tags: [{ id: 200, value: 't', linkedAt: '2026-06-11T00:00:00Z' }],
  status: overrides.status ?? 'ON_FIELD',
  enteredFieldAt: '2026-06-11T00:00:00Z',
  viewCount: overrides.viewCount ?? 0,
  lastViewedAt: null,
});

describe('getTodayReview', () => {
  it('hits /api/v1/review-session/today and adapts byState to stateBreakdown', async () => {
    mockGet.mockResolvedValue({
      data: {
        total: 2,
        dailyTarget: 30,
        recommendedTotal: 2,
        recommendedByState: { FRESH: 1, INTERVAL_3D: 1 },
        byState: {
          FRESH: [{ cardId: 1, deckId: 10, deckName: 'Default', summary: 'a' }],
          INTERVAL_3D: [{ cardId: 2, deckId: 10, deckName: 'Default', summary: 'b' }],
        },
      },
    });
    const r = await getTodayReview({ dailyTarget: 30 });
    expect(mockGet).toHaveBeenCalledWith('/api/v1/review-session/today', {
      params: { target: 30 },
    });
    expect(r.recommended).toBe(2);
    expect(r.stateBreakdown).toEqual({ DAY_1: 1, DAY_3: 1, DAY_7: 0 });
    expect(r.cards).toHaveLength(2);
  });
});

describe('archiveCard', () => {
  it('POSTs /api/v1/cards/{id}/archive with MANUAL reason', async () => {
    mockPost.mockResolvedValue({ data: detail({ cardId: 1, status: 'ARCHIVE' }) });
    const r = await archiveCard('1');
    expect(mockPost).toHaveBeenCalledWith('/api/v1/cards/1/archive', { reason: 'MANUAL' });
    expect(r.status).toBe('ARCHIVE');
    expect(r.keywords).toEqual([{ id: '100', value: 'k' }]);
    expect(r.tags).toEqual([{ tagId: '200', name: 't' }]);
  });
});

describe('returnToField', () => {
  it('POSTs /api/v1/cards/{id}/return-to-field', async () => {
    mockPost.mockResolvedValue({ data: detail({ cardId: 1, status: 'ON_FIELD', viewCount: 0 }) });
    const r = await returnToField('1');
    expect(mockPost).toHaveBeenCalledWith('/api/v1/cards/1/return-to-field');
    expect(r.viewCount).toBe(0);
  });
});

describe('createCard', () => {
  it('POSTs /api/v1/decks/{deckId}/cards with mainNote body', async () => {
    mockPost.mockResolvedValue({ data: detail({ cardId: 7, status: 'ON_FIELD' }) });
    const r = await createCard({
      deckId: '10',
      summary: 's',
      mainText: 'body',
      keywords: ['k'],
      tags: [],
    });
    expect(mockPost).toHaveBeenCalledWith('/api/v1/decks/10/cards', {
      mainNote: { textContent: 'body', imageUrl: null },
      keywords: ['k'],
      summary: 's',
      tags: [],
    });
    expect(r.cardId).toBe('7');
  });
});

describe('listArchiveCards', () => {
  it('returns empty array when no scope provided', async () => {
    const r = await listArchiveCards();
    expect(mockGet).not.toHaveBeenCalled();
    expect(r).toEqual([]);
  });

  it('hits deck-scoped endpoint and filters ARCHIVE', async () => {
    mockGet.mockResolvedValue({
      data: [
        {
          cardId: 1, keywords: [{ id: 1, value: 'k' }], summary: 'on-field one', tags: [],
          contentType: 'TEXT', status: 'ON_FIELD', enteredFieldAt: '2026-06-11T00:00:00Z', viewCount: 1, lastViewedAt: null,
        },
        {
          cardId: 2, keywords: [{ id: 2, value: 'k' }], summary: 'archived one', tags: [],
          contentType: 'TEXT', status: 'ARCHIVE', enteredFieldAt: '2026-06-11T00:00:00Z', viewCount: 5, lastViewedAt: null,
        },
      ],
    });
    const r = await listArchiveCards({ deckId: '10' });
    expect(mockGet).toHaveBeenCalledWith('/api/v1/decks/10/cards');
    expect(r).toHaveLength(1);
    expect(r[0]!.summary).toBe('archived one');
  });
});

describe('extendSession', () => {
  it('re-fetches today queue with new target', async () => {
    mockGet.mockResolvedValue({
      data: {
        total: 0, dailyTarget: 10, recommendedTotal: 0,
        recommendedByState: {}, byState: {},
      },
    });
    const r = await extendSession({ count: 10 });
    expect(mockGet).toHaveBeenCalledWith('/api/v1/review-session/today', { params: { target: 10 } });
    expect(r.completedAll).toBe(true);
  });
});
