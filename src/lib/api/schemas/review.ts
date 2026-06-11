import { z } from 'zod';

export const ReviewStateLabelSchema = z.enum(['DAY_1', 'DAY_3', 'DAY_7']);
export type ReviewStateLabel = z.infer<typeof ReviewStateLabelSchema>;

export const ReviewSessionCardSchema = z.object({
  cardId: z.string(),
  state: ReviewStateLabelSchema,
  summary: z.string(),
});

export const ReviewSessionSchema = z.object({
  stateBreakdown: z.object({
    DAY_1: z.number().int().nonnegative(),
    DAY_3: z.number().int().nonnegative(),
    DAY_7: z.number().int().nonnegative(),
  }),
  recommended: z.number().int().nonnegative(),
  cards: z.array(ReviewSessionCardSchema),
});
export type ReviewSession = z.infer<typeof ReviewSessionSchema>;

export const ExtendReviewResponseSchema = z.object({
  addedCards: z.array(ReviewSessionCardSchema),
  remainingAvailable: z.number().int().nonnegative(),
  completedAll: z.boolean(),
});
export type ExtendReviewResponse = z.infer<typeof ExtendReviewResponseSchema>;
