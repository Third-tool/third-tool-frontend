import { z } from 'zod';
import { LearningModeSchema } from './learningMode';

// product-review (FE) Epic 1 · M5 신설 (2026-07-22+).
// BE 이슈 #24 (DailyLearningBatch Aggregate) 응답 대응.
// - 하루당 1개 · UNIQUE(userId, batchDate)
// - lazy 생성 · cross-layer 짬뽕 (Deck 폐기 후 axis 스코프만)
// - 자정 00:05 KST cron close · closedAt 세팅 시 record-view 거절

export const DailyCardEntrySchema = z.object({
  cardId: z.coerce.string(),
  cardIntervalDay: z.number().int().positive(),
  exposedAt: z.string(),
  viewedAt: z.string().nullable().optional(),
  // preview 표시용 · BE가 join으로 제공 · 카드 전량 재조회 없이 큐 렌더.
  summary: z.string(),
  layerName: z.string().nullable().optional(),
  axisName: z.string().nullable().optional(),
  createdMode: LearningModeSchema.nullable().optional(),
});
export type DailyCardEntry = z.infer<typeof DailyCardEntrySchema>;

export const DailyLearningBatchSchema = z.object({
  userId: z.string(),
  batchDate: z.string(), // KST YYYY-MM-DD
  entries: z.array(DailyCardEntrySchema),
  completionRate: z.number().min(0).max(1),
  streak: z.number().int().nonnegative(),
  closedAt: z.string().nullable().optional(),
});
export type DailyLearningBatch = z.infer<typeof DailyLearningBatchSchema>;

// 응답 요약 파생값 · UI 계산 헬퍼.
export function batchViewedCount(batch: DailyLearningBatch): number {
  return batch.entries.filter((e) => e.viewedAt !== null && e.viewedAt !== undefined).length;
}
export function batchTotalCount(batch: DailyLearningBatch): number {
  return batch.entries.length;
}
export function isBatchClosed(batch: DailyLearningBatch): boolean {
  return Boolean(batch.closedAt);
}
