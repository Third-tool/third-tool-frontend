import { describe, it, expect } from 'vitest';
import {
  LearningDashboardResponseSchema,
  isDashboardEmpty,
} from './learningDashboard';

describe('LearningDashboardResponseSchema (Story 3-1 SoT)', () => {
  it('happy · 유효 응답 parse · recommendations null v1 잠금', () => {
    const r = LearningDashboardResponseSchema.parse({
      today: { completed: 5, total: 10, ratio: 0.5 },
      recent7Days: {
        avgCompletionRatio: 0.7,
        perfectClearDays: 2,
        totalDays: 7,
        dailyRatios: [0.6, 0.8, 0.5, 1, 0.7, 0.9, 0.4],
      },
      streak: { current: 3, longest: 5 },
      recommendations: null,
    });
    expect(r.today.ratio).toBe(0.5);
    expect(r.recommendations).toBeNull();
  });

  it('edge · dailyRatios 배열 길이 != 7 → parse 실패', () => {
    expect(() =>
      LearningDashboardResponseSchema.parse({
        today: { completed: 0, total: 0, ratio: 0 },
        recent7Days: {
          avgCompletionRatio: 0,
          perfectClearDays: 0,
          totalDays: 0,
          dailyRatios: [0.5, 0.6],
        },
        streak: { current: 0, longest: 0 },
        recommendations: null,
      }),
    ).toThrow();
  });

  it('helper · isDashboardEmpty · total 0 + totalDays 0 + longest 0', () => {
    const empty = LearningDashboardResponseSchema.parse({
      today: { completed: 0, total: 0, ratio: 0 },
      recent7Days: {
        avgCompletionRatio: 0,
        perfectClearDays: 0,
        totalDays: 0,
        dailyRatios: [0, 0, 0, 0, 0, 0, 0],
      },
      streak: { current: 0, longest: 0 },
      recommendations: null,
    });
    expect(isDashboardEmpty(empty)).toBe(true);
  });
});
