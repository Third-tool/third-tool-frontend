import { apiClient } from '@/lib/api/client';
import {
  LearningDashboardResponseSchema,
  type LearningDashboardResponse,
} from '@/lib/api/schemas/learningDashboard';

// product-review (FE) Epic 3 Story 3-1 · M5 신설 (2026-07-22+).
// BE endpoint: GET /api/v1/dashboard/summary · v1 raw stats · recommendations null.
export async function fetchDashboardSummary(): Promise<LearningDashboardResponse> {
  const { data } = await apiClient.get('/api/v1/dashboard/summary');
  return LearningDashboardResponseSchema.parse(data);
}
