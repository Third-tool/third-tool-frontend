import { describe, it, expect } from 'vitest';
import {
  DailyLearningBatchSchema,
  batchViewedCount,
  batchTotalCount,
  isBatchClosed,
} from './dailyLearningBatch';

describe('DailyLearningBatchSchema (Story 1-1 SoT)', () => {
  it('happy · 최소 유효 응답 parse', () => {
    const b = DailyLearningBatchSchema.parse({
      userId: 'user-1',
      batchDate: '2026-07-22',
      entries: [
        { cardId: '1', cardIntervalDay: 1, exposedAt: '2026-07-22T00:00:00Z', summary: 'JPA' },
      ],
      completionRate: 0,
      streak: 0,
    });
    expect(b.entries).toHaveLength(1);
    expect(b.entries[0]!.cardIntervalDay).toBe(1);
  });

  it('edge · closedAt 있는 응답 · isBatchClosed true', () => {
    const b = DailyLearningBatchSchema.parse({
      userId: 'user-1',
      batchDate: '2026-07-22',
      entries: [],
      completionRate: 0,
      streak: 3,
      closedAt: '2026-07-23T00:05:00Z',
    });
    expect(isBatchClosed(b)).toBe(true);
  });

  it('helper · batchViewedCount / batchTotalCount', () => {
    const b = DailyLearningBatchSchema.parse({
      userId: 'user-1',
      batchDate: '2026-07-22',
      entries: [
        { cardId: '1', cardIntervalDay: 1, exposedAt: '2026-07-22T00:00:00Z', viewedAt: '2026-07-22T09:00:00Z', summary: 'A' },
        { cardId: '2', cardIntervalDay: 3, exposedAt: '2026-07-22T00:00:00Z', viewedAt: null, summary: 'B' },
      ],
      completionRate: 0.5,
      streak: 1,
    });
    expect(batchViewedCount(b)).toBe(1);
    expect(batchTotalCount(b)).toBe(2);
  });
});
