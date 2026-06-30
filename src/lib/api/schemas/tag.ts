import { z } from 'zod';

// Backend TagResponse.Item — { tagId, value, cardCount }.
// FE consumers historically use { tagId, name } — adapt at the endpoint layer.
export const TagSummarySchema = z.object({
  tagId: z.coerce.string(),
  name: z.string(),
  cardCount: z.number().int().nonnegative(),
});
export type TagSummary = z.infer<typeof TagSummarySchema>;

export const TagsListResponseSchema = z.object({
  tags: z.array(TagSummarySchema),
});
export type TagsListResponse = z.infer<typeof TagsListResponseSchema>;

export const TagCardItemSchema = z.object({
  cardId: z.coerce.string(),
  summary: z.string(),
});
export type TagCardItem = z.infer<typeof TagCardItemSchema>;

export const TagCardsByStatusSchema = z.object({
  onField: z.array(TagCardItemSchema),
  archive: z.array(TagCardItemSchema),
});
export type TagCardsByStatus = z.infer<typeof TagCardsByStatusSchema>;

// Raw backend item shape: { tagId, value, cardCount }
export const RawTagItemSchema = z.object({
  tagId: z.coerce.string(),
  value: z.string(),
  cardCount: z.number().int().nonnegative(),
});
export type RawTagItem = z.infer<typeof RawTagItemSchema>;
