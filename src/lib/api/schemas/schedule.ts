import { z } from 'zod';

// UserSchedule BC modes — BE picks one based on rawInputDays.
// 1~14 → MODE_10D, 15~24 → MODE_20D, 25+ → MODE_30D.
export const ScheduleModeSchema = z.enum(['MODE_10D', 'MODE_20D', 'MODE_30D']);
export type ScheduleMode = z.infer<typeof ScheduleModeSchema>;

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
