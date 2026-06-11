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
  viewCard,
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

describe('getTodayReview', () => {
  it('hits /api/review-session/today with dailyTarget', async () => {
    mockGet.mockResolvedValue({
      data: { stateBreakdown: { DAY_1: 1, DAY_3: 0, DAY_7: 0 }, recommended: 1, cards: [] },
    });
    const r = await getTodayReview({ dailyTarget: 30 });
    expect(mockGet).toHaveBeenCalledWith('/review-session/today', {
      params: { dailyTarget: 30 },
    });
    expect(r.recommended).toBe(1);
  });
});

describe('viewCard', () => {
  it('POSTs /cards/{id}/view and returns parsed response', async () => {
    mockPost.mockResolvedValue({
      data: {
        autoArchived: false,
        archiveReason: null,
        lastViewedAt: '2026-06-11T00:00:00Z',
        viewCount: 1,
      },
    });
    const r = await viewCard('c1');
    expect(mockPost).toHaveBeenCalledWith('/cards/c1/view');
    expect(r.viewCount).toBe(1);
  });
});

describe('archiveCard', () => {
  it('POSTs /cards/{id}/archive', async () => {
    mockPost.mockResolvedValue({
      data: {
        cardId: 'c1',
        status: 'ARCHIVE',
        enteredFieldAt: '2026-06-11T00:00:00Z',
        viewCount: 5,
        summary: 's',
        keywords: ['k'],
        tags: [],
      },
    });
    const r = await archiveCard('c1');
    expect(mockPost).toHaveBeenCalledWith('/cards/c1/archive');
    expect(r.status).toBe('ARCHIVE');
  });
});

describe('extendSession', () => {
  it('POSTs /review-session/extend with count', async () => {
    mockPost.mockResolvedValue({
      data: { addedCards: [], remainingAvailable: 0, completedAll: true },
    });
    const r = await extendSession({ count: 10 });
    expect(mockPost).toHaveBeenCalledWith('/review-session/extend', null, {
      params: { count: 10 },
    });
    expect(r.completedAll).toBe(true);
  });
});

describe('listArchiveCards', () => {
  it('GETs /cards with status=ARCHIVE', async () => {
    mockGet.mockResolvedValue({ data: [] });
    await listArchiveCards();
    expect(mockGet).toHaveBeenCalledWith('/cards', { params: { status: 'ARCHIVE' } });
  });
  it('passes tagId when provided', async () => {
    mockGet.mockResolvedValue({ data: [] });
    await listArchiveCards({ tagId: 't1' });
    expect(mockGet).toHaveBeenCalledWith('/cards', {
      params: { status: 'ARCHIVE', tagId: 't1' },
    });
  });
});

describe('returnToField', () => {
  it('POSTs /cards/{id}/return-to-field', async () => {
    mockPost.mockResolvedValue({
      data: {
        cardId: 'c1',
        status: 'ON_FIELD',
        enteredFieldAt: '2026-06-11T00:00:00Z',
        viewCount: 0,
        summary: 's',
        keywords: ['k'],
        tags: [],
      },
    });
    const r = await returnToField('c1');
    expect(mockPost).toHaveBeenCalledWith('/cards/c1/return-to-field');
    expect(r.viewCount).toBe(0);
  });
});

describe('createCard', () => {
  it('POSTs /cards with payload', async () => {
    mockPost.mockResolvedValue({
      data: {
        cardId: 'c-new',
        status: 'ON_FIELD',
        enteredFieldAt: '2026-06-11T00:00:00Z',
        viewCount: 0,
        summary: 'x',
        keywords: ['k'],
        tags: [],
      },
    });
    const r = await createCard({ summary: 'x', keywords: ['k'], tags: [] });
    expect(mockPost).toHaveBeenCalledWith('/cards', {
      summary: 'x',
      keywords: ['k'],
      tags: [],
    });
    expect(r.cardId).toBe('c-new');
  });
});
