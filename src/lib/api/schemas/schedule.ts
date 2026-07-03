import { z } from 'zod';
import {
  LearningModeSchema,
  type LearningMode,
} from './learningMode';

// UserSchedule BC modes.
// M4 재편(2026-07-15+): 4옵션 (MODE_7D/14D/28D/60D · product-card Epic 1).
// 1~7 → MODE_7D · 8~14 → MODE_14D · 15~28 → MODE_28D · 29~60 → MODE_60D · 60+ clamp
// Source of truth: `learningMode.ts`. 하위 호환 위해 `ScheduleMode` 별칭 유지.
export const ScheduleModeSchema = LearningModeSchema;
export type ScheduleMode = LearningMode;

export const ScheduleSchema = z.object({
  rawInputDays: z.number().int().positive(),
  mappedMode: ScheduleModeSchema,
  modeDisplayName: z.string(),
  maxView: z.number().int().positive(),
  maxDuration: z.number().int().positive(),
  dailyTarget: z.number().int().positive(),
  softScheduleIntervals: z.array(z.number().int().positive()),
});
export type Schedule = z.infer<typeof ScheduleSchema>;

// S-2/S-3 also return `mappingGuide` describing how rawInputDays mapped to mode.
export const MappingGuideSchema = z
  .object({
    fromMode: ScheduleModeSchema.nullable().optional(),
    toMode: ScheduleModeSchema.optional(),
    message: z.string().optional(),
  })
  .passthrough();
export type MappingGuide = z.infer<typeof MappingGuideSchema>;

export const ScheduleResponseSchema = z.object({
  schedule: ScheduleSchema,
  updatedAt: z.string(),
  mappingGuide: MappingGuideSchema.optional(),
});
export type ScheduleResponse = z.infer<typeof ScheduleResponseSchema>;

export const ScheduleHistoryEntrySchema = z.object({
  historyId: z.coerce.string(),
  fromMode: ScheduleModeSchema.nullable().optional(),
  toMode: ScheduleModeSchema,
  rawInputDays: z.number().int().positive(),
  changedAt: z.string(),
});
export type ScheduleHistoryEntry = z.infer<typeof ScheduleHistoryEntrySchema>;

export const ScheduleHistorySchema = z.array(ScheduleHistoryEntrySchema);
export type ScheduleHistory = z.infer<typeof ScheduleHistorySchema>;

// PUT / PATCH bodies
export const SetScheduleRequestSchema = z.object({
  inputDays: z.number().int().min(1).max(365),
});
export type SetScheduleRequest = z.infer<typeof SetScheduleRequestSchema>;

export const UpdateDailyTargetRequestSchema = z.object({
  dailyTarget: z.number().int().min(1).max(200),
});
export type UpdateDailyTargetRequest = z.infer<typeof UpdateDailyTargetRequestSchema>;
