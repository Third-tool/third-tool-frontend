import { describe, it, expect } from 'vitest';
import {
  CardStatusSchema,
  ArchiveReasonSchema,
  CardSchema,
  ViewCardResponseSchema,
  ScheduleConfigSchema,
  CreateCardRequestSchema,
  normalizeArchiveReason,
  nextExposureDays,
  EffectiveMaxSchema,
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
      keywords: [
        { id: 'k1', value: 'ER' },
        { id: 'k2', value: 'normalization' },
      ],
      tags: [],
    });
    expect(c.viewCount).toBe(0);
    expect(c.keywords[0]!.value).toBe('ER');
  });
});

describe('ViewCardResponseSchema', () => {
  it('parses autoArchived true with SCHEDULE_EXHAUSTED reason (M4)', () => {
    const r = ViewCardResponseSchema.parse({
      autoArchived: true,
      archiveReason: 'SCHEDULE_EXHAUSTED',
      lastViewedAt: '2026-06-11T00:00:00Z',
      viewCount: 5,
    });
    expect(r.archiveReason).toBe('SCHEDULE_EXHAUSTED');
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
  it('rejects legacy MAX_VIEW at parse boundary (adapter re-maps)', () => {
    expect(() =>
      ViewCardResponseSchema.parse({
        autoArchived: true,
        archiveReason: 'MAX_VIEW',
        lastViewedAt: '2026-06-11T00:00:00Z',
        viewCount: 5,
      }),
    ).toThrow();
  });
});

describe('ArchiveReasonSchema (M4 3-reason)', () => {
  it('accepts MANUAL · SCHEDULE_EXHAUSTED · MODE_DOWNGRADED', () => {
    expect(ArchiveReasonSchema.parse('MANUAL')).toBe('MANUAL');
    expect(ArchiveReasonSchema.parse('SCHEDULE_EXHAUSTED')).toBe('SCHEDULE_EXHAUSTED');
    expect(ArchiveReasonSchema.parse('MODE_DOWNGRADED')).toBe('MODE_DOWNGRADED');
  });
  it('rejects legacy MAX_VIEW/MAX_DURATION at parse boundary', () => {
    expect(() => ArchiveReasonSchema.parse('MAX_VIEW')).toThrow();
    expect(() => ArchiveReasonSchema.parse('MAX_DURATION')).toThrow();
  });
});

describe('normalizeArchiveReason (M4 legacy 재매핑)', () => {
  it('re-maps legacy MAX_VIEW → SCHEDULE_EXHAUSTED', () => {
    expect(normalizeArchiveReason('MAX_VIEW')).toBe('SCHEDULE_EXHAUSTED');
  });
  it('re-maps legacy MAX_DURATION → SCHEDULE_EXHAUSTED', () => {
    expect(normalizeArchiveReason('MAX_DURATION')).toBe('SCHEDULE_EXHAUSTED');
  });
  it('preserves MANUAL · SCHEDULE_EXHAUSTED · MODE_DOWNGRADED', () => {
    expect(normalizeArchiveReason('MANUAL')).toBe('MANUAL');
    expect(normalizeArchiveReason('SCHEDULE_EXHAUSTED')).toBe('SCHEDULE_EXHAUSTED');
    expect(normalizeArchiveReason('MODE_DOWNGRADED')).toBe('MODE_DOWNGRADED');
  });
  it('returns null for null/undefined', () => {
    expect(normalizeArchiveReason(null)).toBeNull();
    expect(normalizeArchiveReason(undefined)).toBeNull();
  });
});

describe('nextExposureDays (Story 2-4 · UpcomingExposureIndicator core)', () => {
  const eff28 = EffectiveMaxSchema.parse({
    mode: 'MODE_28D',
    maxView: 5,
    intervals: [1, 3, 7, 14, 28],
  });
  it('happy · viewCount=0 → 1일 (createdMode 없어도 effectiveMax intervals)', () => {
    expect(nextExposureDays({ viewCount: 0, effectiveMax: eff28 })).toBe(1);
  });
  it('happy · createdMode=MODE_28D, viewCount=2 → 7일', () => {
    expect(nextExposureDays({ viewCount: 2, createdMode: 'MODE_28D', effectiveMax: eff28 })).toBe(7);
  });
  it('edge · createdMode=MODE_28D · effectiveMax=MODE_7D (mode-down) · viewCount=2 → null (7D maxView=3 도달)', () => {
    const eff7 = EffectiveMaxSchema.parse({
      mode: 'MODE_7D',
      maxView: 3,
      intervals: [1, 3, 7],
    });
    expect(nextExposureDays({ viewCount: 3, createdMode: 'MODE_28D', effectiveMax: eff7 })).toBeNull();
  });
  it('error · viewCount >= maxView → null (아카이브 대상)', () => {
    expect(nextExposureDays({ viewCount: 5, effectiveMax: eff28 })).toBeNull();
  });
});

describe('ScheduleConfigSchema', () => {
  it('parses scheduleMode and soft intervals', () => {
    const s = ScheduleConfigSchema.parse({
      // M4 재편(2026-07-15+): TEN_DAYS → MODE_7D · product-card Epic 1.
      scheduleMode: 'MODE_7D',
      maxDurationInput: 7,
      softScheduleIntervals: [1, 3, 7],
      maxView: 3,
    });
    expect(s.softScheduleIntervals).toEqual([1, 3, 7]);
  });
});

describe('CreateCardRequestSchema', () => {
  it('parses a minimal valid request', () => {
    const r = CreateCardRequestSchema.parse({
      axisId: 'axis-1',
      summary: 'JPA 영속성 컨텍스트가 1차 캐시 역할',
      mainText: 'body',
      keywords: ['JPA'],
      tags: [],
    });
    expect(r.keywords).toHaveLength(1);
  });
  it('rejects empty keywords', () => {
    expect(() =>
      CreateCardRequestSchema.parse({
        axisId: 'axis-1',
        summary: 'x',
        mainText: 'body',
        keywords: [],
        tags: [],
      }),
    ).toThrow();
  });
  it('rejects summary longer than 500', () => {
    expect(() =>
      CreateCardRequestSchema.parse({
        axisId: 'axis-1',
        summary: 'x'.repeat(501),
        mainText: 'body',
        keywords: ['k'],
        tags: [],
      }),
    ).toThrow();
  });
});
