import { z } from 'zod';

export const CardStatusSchema = z.enum(['ON_FIELD', 'ARCHIVE']);
export type CardStatus = z.infer<typeof CardStatusSchema>;

export const ArchiveReasonSchema = z.enum(['MAX_VIEW', 'MAX_DURATION']);
export type ArchiveReason = z.infer<typeof ArchiveReasonSchema>;

export const TagSchema = z.object({
  tagId: z.string(),
  name: z.string(),
});

export const CardSchema = z.object({
  cardId: z.string(),
  status: CardStatusSchema,
  enteredFieldAt: z.string(),
  viewCount: z.number().int().nonnegative(),
  summary: z.string(),
  keywords: z.array(z.string()),
  tags: z.array(TagSchema),
  lastViewedAt: z.string().nullable().optional(),
});
export type Card = z.infer<typeof CardSchema>;

export const ViewCardResponseSchema = z.object({
  autoArchived: z.boolean(),
  archiveReason: ArchiveReasonSchema.nullable(),
  lastViewedAt: z.string(),
  viewCount: z.number().int().nonnegative(),
});
export type ViewCardResponse = z.infer<typeof ViewCardResponseSchema>;

export const ScheduleModeSchema = z.enum(['TEN_DAYS', 'TWENTY_DAYS', 'THIRTY_DAYS']);
export type ScheduleMode = z.infer<typeof ScheduleModeSchema>;

export const ScheduleConfigSchema = z.object({
  scheduleMode: ScheduleModeSchema,
  maxDurationInput: z.number().int().positive(),
  softScheduleIntervals: z.array(z.number().int().positive()),
  maxView: z.number().int().positive(),
});
export type ScheduleConfig = z.infer<typeof ScheduleConfigSchema>;

export const CreateCardRequestSchema = z.object({
  summary: z.string().min(1).max(500),
  keywords: z.array(z.string().min(1)).min(1),
  tags: z.array(z.string()).default([]),
});
export type CreateCardRequest = z.infer<typeof CreateCardRequestSchema>;
