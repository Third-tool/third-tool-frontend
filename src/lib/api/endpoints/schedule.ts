import { apiClient } from '@/lib/api/client';
import {
  ScheduleResponseSchema,
  ScheduleHistorySchema,
  SetScheduleRequestSchema,
  UpdateDailyTargetRequestSchema,
  type ScheduleResponse,
  type ScheduleHistory,
} from '@/lib/api/schemas/schedule';

// S-1 GET /api/v1/users/me/schedule
export async function getMySchedule(): Promise<ScheduleResponse> {
  const { data } = await apiClient.get('/api/v1/users/me/schedule');
  return ScheduleResponseSchema.parse(data);
}

// S-2 PUT /api/v1/users/me/schedule — first-time set and any later change.
export async function setSchedule(inputDays: number): Promise<ScheduleResponse> {
  const validated = SetScheduleRequestSchema.parse({ inputDays });
  const { data } = await apiClient.put('/api/v1/users/me/schedule', validated);
  return ScheduleResponseSchema.parse(data);
}

// S-3 PATCH /api/v1/users/me/schedule/daily-target — change dailyTarget alone.
export async function updateDailyTarget(dailyTarget: number): Promise<ScheduleResponse> {
  const validated = UpdateDailyTargetRequestSchema.parse({ dailyTarget });
  const { data } = await apiClient.patch(
    '/api/v1/users/me/schedule/daily-target',
    validated,
  );
  return ScheduleResponseSchema.parse(data);
}

// S-4 GET /api/v1/users/me/schedule/history?limit=
export async function getScheduleHistory(limit?: number): Promise<ScheduleHistory> {
  const { data } = await apiClient.get('/api/v1/users/me/schedule/history', {
    params: limit !== undefined ? { limit } : {},
  });
  return ScheduleHistorySchema.parse(data);
}
