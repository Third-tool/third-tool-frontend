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
  concept: z.string().nullable(),
  axes: z.array(AxisSchema),
  coverageSummary: CoverageSummarySchema,
  isAxisCountExceedsRecommended: z.boolean().optional(),
});
export type LearningFacade = z.infer<typeof LearningFacadeSchema>;

export const ConceptResponseSchema = z.object({
  facadeId: z.string(),
  concept: z.string(),
  changed: z.boolean(),
  updatedAt: z.string().optional(),
});
export type ConceptResponse = z.infer<typeof ConceptResponseSchema>;

export const AxisCreateResponseSchema = z.object({
  axisId: z.string(),
  name: z.string(),
  displayOrder: z.number().int().nonnegative(),
  isAxisCountExceedsRecommended: z.boolean().optional(),
  createdAt: z.string().optional(),
});
export type AxisCreateResponse = z.infer<typeof AxisCreateResponseSchema>;

export const AxisSuggestionSchema = z.object({
  description: z.string(),
  rationale: z.string(),
});
export type AxisSuggestion = z.infer<typeof AxisSuggestionSchema>;

export const AxisSuggestionResponseSchema = z.object({
  suggestions: z.array(AxisSuggestionSchema),
  suggestionsAvailable: z.boolean(),
  provider_context: z.string().optional(),
});
export type AxisSuggestionResponse = z.infer<typeof AxisSuggestionResponseSchema>;

export const CreateTopicsRequestSchema = z.object({
  topics: z
    .array(
      z.object({
        name: z.string().min(1),
        description: z.string().nullable().optional(),
      }),
    )
    .min(1),
});
export type CreateTopicsRequest = z.infer<typeof CreateTopicsRequestSchema>;

export const CreateTopicsResponseSchema = z.object({
  topics: z.array(TopicSchema),
  isTopicCountExceedsRecommended: z.boolean().optional(),
});
export type CreateTopicsResponse = z.infer<typeof CreateTopicsResponseSchema>;

export const TopicSuggestionResponseSchema = AxisSuggestionResponseSchema;
export type TopicSuggestionResponse = AxisSuggestionResponse;

export const MaterialBaseSchema = z.object({
  materialId: z.string(),
  type: MaterialTypeSchema,
  name: z.string(),
  proficiencyLevel: ProficiencyLevelSchema,
});
export type MaterialBase = z.infer<typeof MaterialBaseSchema>;

export const CreateMaterialRequestSchema = z.object({
  name: z.string().min(1),
  type: MaterialTypeSchema,
  topicIds: z.array(z.string()).default([]),
  author: z.string().optional(),
  platform: z.string().optional(),
  url: z.string().optional(),
  aiProvider: z.string().optional(),
  source: z.string().optional(),
  note: z.string().optional(),
});
export type CreateMaterialRequest = z.infer<typeof CreateMaterialRequestSchema>;

export const UpdatedTopicCoverageSchema = z.object({
  topicId: z.string(),
  coverageStatus: CoverageStatusSchema,
});

export const CreateMaterialResponseSchema = z.object({
  materialId: z.string(),
  name: z.string(),
  type: MaterialTypeSchema,
  topicIds: z.array(z.string()),
  deckId: z.string(),
  deckAutoCreated: z.boolean(),
  proficiencyLevel: ProficiencyLevelSchema,
  updatedTopicsCoverage: z.array(UpdatedTopicCoverageSchema),
});
export type CreateMaterialResponse = z.infer<typeof CreateMaterialResponseSchema>;

export const RevisionReasonSchema = z.object({
  id: z.number().int().positive(),
  label: z.string(),
  displayOrder: z.number().int().nonnegative(),
});
export type RevisionReason = z.infer<typeof RevisionReasonSchema>;

export const RevisionReasonsResponseSchema = z.object({
  options: z.array(RevisionReasonSchema),
});
export type RevisionReasonsResponse = z.infer<typeof RevisionReasonsResponseSchema>;

export const UpdateTopicRequestSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  revisionReasonId: z.number().int().positive().nullable().optional(),
});
export type UpdateTopicRequest = z.infer<typeof UpdateTopicRequestSchema>;

export const UpdateTopicResponseSchema = z.object({
  topicId: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  coverageStatus: CoverageStatusSchema,
  changed: z.boolean(),
  isRefinementSuggested: z.boolean().optional(),
  revisionCount: z.number().int().nonnegative().optional(),
});
export type UpdateTopicResponse = z.infer<typeof UpdateTopicResponseSchema>;
