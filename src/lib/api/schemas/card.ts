import { z } from 'zod';

export const CardStatusSchema = z.enum(['ON_FIELD', 'ARCHIVE']);
export type CardStatus = z.infer<typeof CardStatusSchema>;

export const ArchiveReasonSchema = z.enum(['MANUAL', 'MAX_VIEW', 'MAX_DURATION']);
export type ArchiveReason = z.infer<typeof ArchiveReasonSchema>;

export const MainContentTypeSchema = z.enum(['TEXT', 'IMAGE', 'BOTH']);
export type MainContentType = z.infer<typeof MainContentTypeSchema>;

// FE-facing tag shape used inside Card. Backend returns { id, value, linkedAt } —
// the endpoint adapter normalizes it to this shape.
export const TagSchema = z.object({
  tagId: z.coerce.string(),
  name: z.string(),
});
export type TagOnCard = z.infer<typeof TagSchema>;

// FE-facing keyword shape. Edit endpoints (POST/DELETE/PUT) need the id, so we
// keep it on Card rather than flattening to string[].
export const KeywordOnCardSchema = z.object({
  id: z.coerce.string(),
  value: z.string(),
});
export type KeywordOnCard = z.infer<typeof KeywordOnCardSchema>;

export const CardSchema = z.object({
  cardId: z.coerce.string(),
  deckId: z.coerce.string().optional(),
  status: CardStatusSchema,
  enteredFieldAt: z.string(),
  viewCount: z.number().int().nonnegative(),
  summary: z.string(),
  keywords: z.array(KeywordOnCardSchema),
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

// Frontend create request — assembled in the form. The endpoint layer
// transforms it into Backend's CardRequest.Create shape (mainNote object,
// keyword string list, tag value list) and posts to /api/v1/decks/{deckId}/cards.
export const CreateCardRequestSchema = z.object({
  deckId: z.coerce.string(),
  summary: z.string().min(1).max(500),
  keywords: z.array(z.string().min(1)).min(1),
  tags: z.array(z.string()).max(3).default([]),
  mainText: z.string().min(1),
});
export type CreateCardRequest = z.infer<typeof CreateCardRequestSchema>;

// ─── Raw backend shapes ─────────────────────────────────────────────────────
// These mirror Java records in Card/presentation/dto/CardResponse.java.

const RawKeywordDtoSchema = z.object({
  id: z.coerce.string(),
  value: z.string(),
});

const RawTagDtoSchema = z.object({
  id: z.coerce.string(),
  value: z.string(),
  linkedAt: z.string().nullable().optional(),
});

const RawMainNoteDtoSchema = z.object({
  textContent: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  contentType: MainContentTypeSchema,
});

export const RawCardDetailSchema = z.object({
  cardId: z.coerce.string(),
  deckId: z.coerce.string(),
  mainNote: RawMainNoteDtoSchema,
  keywords: z.array(RawKeywordDtoSchema),
  summary: z.string(),
  tags: z.array(RawTagDtoSchema),
  status: CardStatusSchema,
  enteredFieldAt: z.string(),
  viewCount: z.number().int().nonnegative(),
  lastViewedAt: z.string().nullable().optional(),
  createdDate: z.string().optional(),
  updatedDate: z.string().optional(),
});
export type RawCardDetail = z.infer<typeof RawCardDetailSchema>;

export const RawCardSummarySchema = z.object({
  cardId: z.coerce.string(),
  keywords: z.array(RawKeywordDtoSchema),
  summary: z.string(),
  tags: z.array(RawTagDtoSchema),
  contentType: MainContentTypeSchema,
  status: CardStatusSchema,
  enteredFieldAt: z.string(),
  viewCount: z.number().int().nonnegative(),
  lastViewedAt: z.string().nullable().optional(),
  createdDate: z.string().optional(),
});
export type RawCardSummary = z.infer<typeof RawCardSummarySchema>;

export function adaptCardDetail(raw: RawCardDetail): Card {
  return {
    cardId: raw.cardId,
    deckId: raw.deckId,
    status: raw.status,
    enteredFieldAt: raw.enteredFieldAt,
    viewCount: raw.viewCount,
    summary: raw.summary,
    keywords: raw.keywords.map((k) => ({ id: k.id, value: k.value })),
    tags: raw.tags.map((t) => ({ tagId: t.id, name: t.value })),
    lastViewedAt: raw.lastViewedAt ?? null,
  };
}

export function adaptCardSummary(raw: RawCardSummary, deckId?: string): Card {
  return {
    cardId: raw.cardId,
    deckId,
    status: raw.status,
    enteredFieldAt: raw.enteredFieldAt,
    viewCount: raw.viewCount,
    summary: raw.summary,
    keywords: raw.keywords.map((k) => ({ id: k.id, value: k.value })),
    tags: raw.tags.map((t) => ({ tagId: t.id, name: t.value })),
    lastViewedAt: raw.lastViewedAt ?? null,
  };
}

// POST /api/v1/cards/{cardId}/tags { value } — find-or-create with limit 3
export const AddTagRequestSchema = z.object({ value: z.string().min(1) });
export type AddTagRequest = z.infer<typeof AddTagRequestSchema>;

// Both POST /tags and DELETE /tags/{tagId} return the same shape: card + full tags.
export const CardTagsResponseSchema = z.object({
  cardId: z.coerce.string(),
  tags: z.array(
    z.object({
      id: z.coerce.string(),
      value: z.string(),
      linkedAt: z.string().nullable().optional(),
    }),
  ),
});
export type CardTagsResponse = z.infer<typeof CardTagsResponseSchema>;

export function adaptCardTags(raw: CardTagsResponse): { cardId: string; tags: TagOnCard[] } {
  return {
    cardId: raw.cardId,
    tags: raw.tags.map((t) => ({ tagId: t.id, name: t.value })),
  };
}

// POST /api/v1/cards/{cardId}/keywords { value }
export const AddKeywordRequestSchema = z.object({ value: z.string().min(1) });
export type AddKeywordRequest = z.infer<typeof AddKeywordRequestSchema>;

// PUT /api/v1/cards/{cardId}/keywords { keywords: [{ value }] }
export const ReplaceKeywordsRequestSchema = z.object({
  keywords: z.array(z.object({ value: z.string().min(1) })).min(1),
});
export type ReplaceKeywordsRequest = z.infer<typeof ReplaceKeywordsRequestSchema>;

// Common response for POST/DELETE/PUT keyword endpoints.
export const CardKeywordsResponseSchema = z.object({
  cardId: z.coerce.string(),
  keywords: z.array(
    z.object({
      id: z.coerce.string(),
      value: z.string(),
      displayOrder: z.number().int().nonnegative().optional(),
    }),
  ),
});
export type CardKeywordsResponse = z.infer<typeof CardKeywordsResponseSchema>;

export function adaptCardKeywords(raw: CardKeywordsResponse): {
  cardId: string;
  keywords: KeywordOnCard[];
} {
  return {
    cardId: raw.cardId,
    keywords: raw.keywords.map((k) => ({ id: k.id, value: k.value })),
  };
}

// PATCH /api/v1/cards/{cardId}/summary { summary }
export const UpdateSummaryRequestSchema = z.object({ summary: z.string().min(1) });
export type UpdateSummaryRequest = z.infer<typeof UpdateSummaryRequestSchema>;

export const UpdateSummaryResponseSchema = z.object({
  cardId: z.coerce.string(),
  summary: z.string(),
});
export type UpdateSummaryResponse = z.infer<typeof UpdateSummaryResponseSchema>;
