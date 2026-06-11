import { z } from 'zod';

export const CoverageStatusSchema = z.enum(['NO_MATERIAL', 'PARTIAL', 'COVERED']);
export type CoverageStatus = z.infer<typeof CoverageStatusSchema>;

export const ProficiencyLevelSchema = z
  .enum(['UNFAMILIAR', 'FAMILIARIZING', 'MASTERED'])
  .nullable();
export type ProficiencyLevel = z.infer<typeof ProficiencyLevelSchema>;

export const MaterialTypeSchema = z.enum(['BOOK', 'COURSE', 'AI_CONVERSATION', 'WEB_RESOURCE']);
export type MaterialType = z.infer<typeof MaterialTypeSchema>;

export const TopicSchema = z.object({
  topicId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  displayOrder: z.number().int().nonnegative(),
  coverageStatus: CoverageStatusSchema,
  isFocused: z.boolean().default(false),
  isRefinementSuggested: z.boolean().optional(),
  revisionCount: z.number().int().nonnegative().optional(),
});
export type Topic = z.infer<typeof TopicSchema>;

export const AxisSchema = z.object({
  axisId: z.string(),
  name: z.string(),
  displayOrder: z.number().int().nonnegative(),
  topics: z.array(TopicSchema).default([]),
  isTopicCountExceedsRecommended: z.boolean().optional(),
});
export type Axis = z.infer<typeof AxisSchema>;

export const CoverageSummarySchema = z.object({
  totalTopics: z.number().int().nonnegative(),
  uncoveredTopics: z.number().int().nonnegative(),
  axesWithUncovered: z.array(z.string()),
});

export const LearningFacadeSchema = z.object({
  facadeId: z.string(),
  concept: z.string(),
  axes: z.array(AxisSchema),
  coverageSummary: CoverageSummarySchema,
  isAxisCountExceedsRecommended: z.boolean().optional(),
});
export type LearningFacade = z.infer<typeof LearningFacadeSchema>;

export const MaterialBaseSchema = z.object({
  materialId: z.string(),
  type: MaterialTypeSchema,
  name: z.string(),
  proficiencyLevel: ProficiencyLevelSchema,
});
export type MaterialBase = z.infer<typeof MaterialBaseSchema>;
