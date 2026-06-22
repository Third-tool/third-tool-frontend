import { z } from 'zod';

// Mirrors Deck/presentation/dto/DeckResponse.java records.

export const DeckSummarySchema = z.object({
  deckId: z.coerce.string(),
  name: z.string(),
  depth: z.number().int().nonnegative(),
  onLibrary: z.boolean(),
  lastAccessed: z.string().nullable().optional(),
  cardCount: z.number().int().nonnegative(),
  subDeckCount: z.number().int().nonnegative(),
});
export type DeckSummary = z.infer<typeof DeckSummarySchema>;

export const DeckDetailSchema = z.object({
  deckId: z.coerce.string(),
  name: z.string(),
  parentDeckId: z.coerce.string().nullable().optional(),
  depth: z.number().int().nonnegative(),
  onLibrary: z.boolean(),
  publishedAt: z.string().nullable().optional(),
  lastAccessed: z.string().nullable().optional(),
  cardCount: z.number().int().nonnegative(),
  subDeckCount: z.number().int().nonnegative(),
  createdDate: z.string().optional(),
  updatedDate: z.string().optional(),
});
export type DeckDetail = z.infer<typeof DeckDetailSchema>;

export const DeckCreateResponseSchema = z.object({
  deckId: z.coerce.string(),
  name: z.string(),
  parentDeckId: z.coerce.string().nullable().optional(),
  depth: z.number().int().nonnegative(),
  onLibrary: z.boolean(),
  publishedAt: z.string().nullable().optional(),
  lastAccessed: z.string().nullable().optional(),
  createdDate: z.string().optional(),
});
export type DeckCreateResponse = z.infer<typeof DeckCreateResponseSchema>;

export const DeckPageSchema = z.object({
  content: z.array(DeckSummarySchema),
  totalElements: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  page: z.number().int().nonnegative(),
  size: z.number().int().nonnegative(),
});
export type DeckPage = z.infer<typeof DeckPageSchema>;

export const CreateDeckRequestSchema = z.object({
  name: z.string().min(1),
  parentDeckId: z.coerce.string().nullable().optional(),
});
export type CreateDeckRequest = z.infer<typeof CreateDeckRequestSchema>;
