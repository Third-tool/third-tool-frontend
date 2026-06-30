import { describe, it, expect } from 'vitest';
import { ReviewStateLabelSchema, ReviewSessionSchema } from './review';

describe('ReviewStateLabelSchema', () => {
  it('accepts DAY_1/DAY_3/DAY_7', () => {
    ['DAY_1', 'DAY_3', 'DAY_7'].forEach((v) =>
      expect(ReviewStateLabelSchema.parse(v)).toBe(v),
    );
  });
});

describe('ReviewSessionSchema', () => {
  it('parses todays session with breakdown', () => {
    const s = ReviewSessionSchema.parse({
      stateBreakdown: { DAY_1: 4, DAY_3: 6, DAY_7: 2 },
      recommended: 12,
      cards: [
        { cardId: 'c1', state: 'DAY_1', summary: 'JPA 영속성' },
      ],
    });
    expect(s.recommended).toBe(12);
  });
});
