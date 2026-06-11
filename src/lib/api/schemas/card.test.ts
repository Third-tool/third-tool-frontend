import { describe, it, expect } from 'vitest';
import {
  CardStatusSchema,
  ArchiveReasonSchema,
  CardSchema,
  ViewCardResponseSchema,
  ScheduleConfigSchema,
} from './card';

describe('CardStatusSchema', () => {
  it('accepts ON_FIELD and ARCHIVE', () => {
    expect(CardStatusSchema.parse('ON_FIELD')).toBe('ON_FIELD');
    expect(CardStatusSchema.parse('ARCHIVE')).toBe('ARCHIVE');
  });
  it('rejects unknown', () => {
    expect(() => CardStatusSchema.parse('GONE')).toThrow();
  });
});

describe('CardSchema', () => {
  it('parses a minimal card', () => {
    const c = CardSchema.parse({
      cardId: 'c1',
      status: 'ON_FIELD',
      enteredFieldAt: '2026-06-11T00:00:00Z',
      viewCount: 0,
      summary: '관계형 모델링 기초',
      keywords: ['ER', 'normalization'],
      tags: [],
    });
    expect(c.viewCount).toBe(0);
  });
});

describe('ViewCardResponseSchema', () => {
  it('parses autoArchived true with reason', () => {
    const r = ViewCardResponseSchema.parse({
      autoArchived: true,
      archiveReason: 'MAX_VIEW',
      lastViewedAt: '2026-06-11T00:00:00Z',
      viewCount: 5,
    });
    expect(r.archiveReason).toBe('MAX_VIEW');
  });
  it('parses autoArchived false with null reason', () => {
    const r = ViewCardResponseSchema.parse({
      autoArchived: false,
      archiveReason: null,
      lastViewedAt: '2026-06-11T00:00:00Z',
      viewCount: 2,
    });
    expect(r.archiveReason).toBeNull();
  });
});

describe('ScheduleConfigSchema', () => {
  it('parses scheduleMode and soft intervals', () => {
    const s = ScheduleConfigSchema.parse({
      scheduleMode: 'TEN_DAYS',
      maxDurationInput: 10,
      softScheduleIntervals: [1, 3, 7],
      maxView: 5,
    });
    expect(s.softScheduleIntervals).toEqual([1, 3, 7]);
  });
});
