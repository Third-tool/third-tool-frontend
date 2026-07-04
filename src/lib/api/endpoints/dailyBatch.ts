import { apiClient } from '@/lib/api/client';
import {
  DailyLearningBatchSchema,
  type DailyLearningBatch,
} from '@/lib/api/schemas/dailyLearningBatch';

// product-review (FE) Epic 1 Story 1-1 · M5 신설 (2026-07-22+).
// BE endpoint: POST /api/v1/daily-batch/today · idempotent (같은 날 재호출 시 동일 batch)
// lazy 생성: batch 없으면 서버가 DailyLearningBatchService.getOrCreateToday(userId) 트리거.
export async function fetchTodayBatch(): Promise<DailyLearningBatch> {
  const { data } = await apiClient.post('/api/v1/daily-batch/today', {});
  return DailyLearningBatchSchema.parse(data);
}
