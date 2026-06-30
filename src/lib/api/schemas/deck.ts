import { z } from 'zod';

// Mirrors Deck/presentation/dto/DeckResponse.java records.

// progressStatus is derived from card states (no ON_FIELD/ARCHIVE → NOT_STARTED,
// at least one ON_FIELD → IN_PROGRESS, all ARCHIVE → COMPLETED). Optional so the
// UI degrades gracefully if BE hasn't yet exposed the field.
export const DeckProgressStatusSchema = z.enum([
  'NOT_STARTED',
  'IN_PROGRESS',
  'COMPLETED',
]);
export type DeckProgressStatus = z.infer<typeof DeckProgressStatusSchema>;

export const DeckSummarySchema = z.object({
  deckId: z.coerce.string(),
  name: z.string(),
  // axisId/axisName: the LearningAxis this deck is linked to (null = orphan deck,
  // not in any axis). Exposed so the card editor can group decks by axis.
  axisId: z.coerce.string().nullable().optional(),
  axisName: z.string().nullable().optional(),
  depth: z.number().int().nonnegative(),
  onLibrary: z.boolean(),
  lastAccessed: z.string().nullable().optional(),
  cardCount: z.number().int().nonnegative(),
  subDeckCount: z.number().int().nonnegative(),
  progressStatus: DeckProgressStatusSchema.optional(),
});
export type DeckSummary = z.infer<typeof DeckSummarySchema>;

export const DeckDetailSchema = z.object({
  deckId: z.coerce.string(),
  name: z.string(),
  axisId: z.coerce.string().nullable().optional(),
  axisName: z.string().nullable().optional(),
  parentDeckId: z.coerce.string().nullable().optional(),
  depth: z.number().int().nonnegative(),
  onLibrary: z.boolean(),
  publishedAt: z.string().nullable().optional(),
  lastAccessed: z.string().nullable().optional(),
  cardCount: z.number().int().nonnegative(),
  subDeckCount: z.number().int().nonnegative(),
  progressStatus: DeckProgressStatusSchema.optional(),
  createdDate: z.string().optional(),
  updatedDate: z.string().optional(),
});
export type DeckDetail = z.infer<typeof DeckDetailSchema>;

export const DeckCreateResponseSchema = z.object({
  deckId: z.coerce.string(),
  name: z.string(),
  axisId: z.coerce.string().nullable().optional(),
  axisName: z.string().nullable().optional(),
  parentDeckId: z.coerce.string().nullable().optional(),
  depth: z.number().int().nonnegative(),
  onLibrary: z.boolean(),
  publishedAt: z.string().nullable().optional(),
  lastAccessed: z.string().nullable().optional(),
  createdDate: z.string().optional(),
});
export type DeckCreateResponse = z.infer<typeof DeckCreateResponseSchema>;

// POST /api/v1/learning-facade/axes/{axisId}/decks { name } — creates a deck
// already linked to the axis (so its cards show up in that axis + today feed).
// Plan ref: FE 002.md Issue 4 / BE refactor-fe-intent.md A2 (B안).
export const CreateAxisDeckRequestSchema = z.object({ name: z.string().min(1) });
export type CreateAxisDeckRequest = z.infer<typeof CreateAxisDeckRequestSchema>;

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

export const RenameDeckRequestSchema = z.object({ name: z.string().min(1) });
export type RenameDeckRequest = z.infer<typeof RenameDeckRequestSchema>;

export const RenameDeckResponseSchema = z.object({
  deckId: z.coerce.string(),
  name: z.string(),
});
export type RenameDeckResponse = z.infer<typeof RenameDeckResponseSchema>;

export const MoveDeckRequestSchema = z.object({
  parentDeckId: z.coerce.string().nullable(),
});
export type MoveDeckRequest = z.infer<typeof MoveDeckRequestSchema>;

export const MoveDeckResponseSchema = z.object({
  deckId: z.coerce.string(),
  parentDeckId: z.coerce.string().nullable(),
});
export type MoveDeckResponse = z.infer<typeof MoveDeckResponseSchema>;

export const SubDeckListSchema = z.array(DeckSummarySchema);
export type SubDeckList = z.infer<typeof SubDeckListSchema>;
