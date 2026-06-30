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
  // BE serializes IDs as Long (JSON number); coerce so z.string() consumers keep working.
  topicId: z.coerce.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  displayOrder: z.number().int().nonnegative(),
  coverageStatus: CoverageStatusSchema,
  isFocused: z.boolean().default(false),
  isRefinementSuggested: z.boolean().optional(),
  revisionCount: z.number().int().nonnegative().optional(),
});
export type Topic = z.infer<typeof TopicSchema>;

export const AxisSchema = z.object({
  axisId: z.coerce.string(),
  name: z.string(),
  displayOrder: z.number().int().nonnegative(),
  topics: z.array(TopicSchema).default([]),
  isTopicCountExceedsRecommended: z.boolean().optional(),
});
export type Axis = z.infer<typeof AxisSchema>;

export const CoverageSummarySchema = z.object({
  totalTopics: z.number().int().nonnegative(),
  uncoveredTopics: z.number().int().nonnegative(),
  // BE FacadeDetail.CoverageSummary only sends totalTopics/uncoveredTopics.
  axesWithUncovered: z.array(z.string()).default([]),
});

export const LearningFacadeSchema = z.object({
  facadeId: z.coerce.string(),
  concept: z.string().nullable(),
  axes: z.array(AxisSchema),
  coverageSummary: CoverageSummarySchema,
  isAxisCountExceedsRecommended: z.boolean().optional(),
});
export type LearningFacade = z.infer<typeof LearningFacadeSchema>;

// POST /api/v1/learning-facade { concept } — creates the (unique-per-user) facade
export const CreateFacadeRequestSchema = z.object({
  concept: z.string().min(1),
});
export type CreateFacadeRequest = z.infer<typeof CreateFacadeRequestSchema>;

export const CreateFacadeResponseSchema = z.object({
  facadeId: z.coerce.string(),
  concept: z.string(),
  createdAt: z.string().optional(),
});
export type CreateFacadeResponse = z.infer<typeof CreateFacadeResponseSchema>;

// PATCH /api/v1/learning-facade/concept { concept } — updates existing concept
export const UpdateConceptRequestSchema = z.object({
  concept: z.string().min(1),
});
export type UpdateConceptRequest = z.infer<typeof UpdateConceptRequestSchema>;

export const UpdateConceptResponseSchema = z.object({
  facadeId: z.coerce.string(),
  concept: z.string(),
  changed: z.boolean(),
  updatedAt: z.string().optional(),
});
export type UpdateConceptResponse = z.infer<typeof UpdateConceptResponseSchema>;

export const AxisCreateResponseSchema = z.object({
  axisId: z.coerce.string(),
  name: z.string(),
  displayOrder: z.number().int().nonnegative(),
  isAxisCountExceedsRecommended: z.boolean().optional(),
  createdAt: z.string().optional(),
});
export type AxisCreateResponse = z.infer<typeof AxisCreateResponseSchema>;

// POST /api/v1/learning-facade/axes/{axisId}/topics — single topic per call
export const CreateTopicRequestSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
});
export type CreateTopicRequest = z.infer<typeof CreateTopicRequestSchema>;

export const CreateTopicResponseSchema = z.object({
  topicId: z.coerce.string(),
  axisId: z.coerce.string().optional(),
  name: z.string(),
  description: z.string().nullable().optional(),
  displayOrder: z.number().int().nonnegative(),
  coverageStatus: CoverageStatusSchema,
  isFocused: z.boolean().default(false),
  isTopicCountExceedsRecommended: z.boolean().optional(),
});
export type CreateTopicResponse = z.infer<typeof CreateTopicResponseSchema>;

export const MaterialBaseSchema = z.object({
  materialId: z.coerce.string(),
  type: MaterialTypeSchema,
  name: z.string(),
  proficiencyLevel: ProficiencyLevelSchema,
});
export type MaterialBase = z.infer<typeof MaterialBaseSchema>;

// POST /api/v1/learning-facade/materials — BE expects materialType / linkedTopicIds / webSource / memo
export const CreateMaterialRequestSchema = z.object({
  name: z.string().min(1),
  materialType: MaterialTypeSchema,
  linkedTopicIds: z.array(z.string()).default([]),
  url: z.string().optional(),
  author: z.string().optional(),
  platform: z.string().optional(),
  aiProvider: z.string().optional(),
  webSource: z.string().optional(),
  memo: z.string().optional(),
  deckName: z.string().max(100).optional(),
  forceCreateDeck: z.boolean().optional(),
});
export type CreateMaterialRequest = z.infer<typeof CreateMaterialRequestSchema>;

export const UpdatedTopicCoverageSchema = z.object({
  topicId: z.coerce.string(),
  coverageStatus: CoverageStatusSchema,
});

export const CreateMaterialResponseSchema = z.object({
  materialId: z.coerce.string(),
  name: z.string(),
  materialType: MaterialTypeSchema,
  linkedTopicIds: z.array(z.coerce.string()),
  deckId: z.coerce.string(),
  deckAutoCreated: z.boolean(),
  proficiencyLevel: ProficiencyLevelSchema,
  updatedTopicsCoverage: z.array(UpdatedTopicCoverageSchema),
});
export type CreateMaterialResponse = z.infer<typeof CreateMaterialResponseSchema>;

// BE GET /revision-reason-options returns a BARE array of items keyed by
// `optionId` (List<RevisionReasonOptionItem>). Normalize each item to `id` and
// wrap into { options } so FE consumers keep using `data.options` / `r.id`.
export const RevisionReasonSchema = z
  .object({
    optionId: z.number().int().positive(),
    label: z.string(),
    displayOrder: z.number().int().nonnegative(),
  })
  .transform((r) => ({ id: r.optionId, label: r.label, displayOrder: r.displayOrder }));
export type RevisionReason = z.infer<typeof RevisionReasonSchema>;

export const RevisionReasonsResponseSchema = z
  .array(RevisionReasonSchema)
  .transform((options) => ({ options }));
export type RevisionReasonsResponse = z.infer<typeof RevisionReasonsResponseSchema>;

export const UpdateTopicRequestSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  revisionReasonOptionId: z.number().int().positive().nullable().optional(),
});
export type UpdateTopicRequest = z.infer<typeof UpdateTopicRequestSchema>;

export const UpdateTopicResponseSchema = z.object({
  topicId: z.coerce.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  coverageStatus: CoverageStatusSchema,
  changed: z.boolean(),
  isRefinementSuggested: z.boolean().optional(),
  revisionCount: z.number().int().nonnegative().optional(),
});
export type UpdateTopicResponse = z.infer<typeof UpdateTopicResponseSchema>;

// PATCH /api/v1/learning-facade/axes/{axisId} { name } — rename axis only
export const RenameAxisRequestSchema = z.object({ name: z.string().min(1) });
export type RenameAxisRequest = z.infer<typeof RenameAxisRequestSchema>;

export const RenameAxisResponseSchema = z.object({
  axisId: z.coerce.string(),
  name: z.string(),
  displayOrder: z.number().int().nonnegative(),
});
export type RenameAxisResponse = z.infer<typeof RenameAxisResponseSchema>;

// PUT /api/v1/learning-facade/axes/order { orderedAxisIds }
export const ReorderAxesRequestSchema = z.object({
  orderedAxisIds: z.array(z.coerce.string()).min(1),
});
export type ReorderAxesRequest = z.infer<typeof ReorderAxesRequestSchema>;

export const ReorderAxesResponseSchema = z.object({
  axes: z.array(
    z.object({
      axisId: z.coerce.string(),
      name: z.string(),
      displayOrder: z.number().int().nonnegative(),
    }),
  ),
});
export type ReorderAxesResponse = z.infer<typeof ReorderAxesResponseSchema>;
