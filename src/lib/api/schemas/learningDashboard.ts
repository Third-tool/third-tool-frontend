import { z } from 'zod';
import { LearningModeSchema } from './learningMode';

// product-review (FE) Epic 3 · M5 신설 (2026-07-22+).
// BE 이슈 #26 (캐시 측정 대시보드 L2) 응답 대응.
// - v1 L2: raw stats만 (Today · Recent7 · Streak)
// - L3 (recommendations) UI 잠금 · nullable 필드 신설 · v2 (M6+) 활성화 대기

export const TodayStatsSchema = z.object({
  completed: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  ratio: z.number().min(0).max(1),
});
export type TodayStats = z.infer<typeof TodayStatsSchema>;

export const Recent7DaysStatsSchema = z.object({
  avgCompletionRatio: z.number().min(0).max(1),
  perfectClearDays: z.number().int().nonnegative(),
  totalDays: z.number().int().nonnegative(),
  // v1 daily bar chart 데이터 · 최근 7일 (오래된 것 먼저).
  dailyRatios: z.array(z.number().min(0).max(1)).length(7),
});
export type Recent7DaysStats = z.infer<typeof Recent7DaysStatsSchema>;

export const StreakStatsSchema = z.object({
  current: z.number().int().nonnegative(),
  longest: z.number().int().nonnegative(),
});
export type StreakStats = z.infer<typeof StreakStatsSchema>;

// v1은 항상 null · v2(M6)에서 배열로 활성화.
// BE PR#5가 응답에 데이터를 넣어도 FE v1은 무시하는 정책 (milestone.md 명시).
export const RecommendationTypeSchema = z.enum([
  'SUGGEST_DOWNGRADE',
  'SUGGEST_UPGRADE',
]);
export type RecommendationType = z.infer<typeof RecommendationTypeSchema>;

export const RecommendationSchema = z.object({
  id: z.string(),
  type: RecommendationTypeSchema,
  fromMode: LearningModeSchema.nullable().optional(),
  toMode: LearningModeSchema.nullable().optional(),
  message: z.string(),
});
export type Recommendation = z.infer<typeof RecommendationSchema>;

export const LearningDashboardResponseSchema = z.object({
  today: TodayStatsSchema,
  recent7Days: Recent7DaysStatsSchema,
  streak: StreakStatsSchema,
  recommendations: z.array(RecommendationSchema).nullable(),
});
export type LearningDashboardResponse = z.infer<typeof LearningDashboardResponseSchema>;

// v1은 활동 0 상태 판정 helper (empty state 조건).
export function isDashboardEmpty(res: LearningDashboardResponse): boolean {
  return (
    res.today.total === 0 &&
    res.recent7Days.totalDays === 0 &&
    res.streak.longest === 0
  );
}
