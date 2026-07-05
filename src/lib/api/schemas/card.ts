import { z } from 'zod';
import {
  LearningModeSchema,
  LEARNING_MODE_META,
  type LearningMode,
} from './learningMode';

export const CardStatusSchema = z.enum(['ON_FIELD', 'ARCHIVE']);
export type CardStatus = z.infer<typeof CardStatusSchema>;

// M4 재편(2026-07-15+): 3-reason 재정의 · product-card Epic 2.
// - MANUAL             : 사용자 명시 아카이브
// - SCHEDULE_EXHAUSTED : maxView 도달 · 정상 소진 (구 MAX_VIEW/MAX_DURATION 통합)
// - MODE_DOWNGRADED    : 사용자가 스케줄 mode를 낮춰 effectiveMax가 재계산돼 소진 처리
// legacy MAX_VIEW/MAX_DURATION 응답 수신 시 SCHEDULE_EXHAUSTED로 재매핑 (adapter 담당).
export const ArchiveReasonSchema = z.enum([
  'MANUAL',
  'SCHEDULE_EXHAUSTED',
  'MODE_DOWNGRADED',
]);
export type ArchiveReason = z.infer<typeof ArchiveReasonSchema>;

const LegacyArchiveReasonSchema = z.enum([
  'MANUAL',
  'MAX_VIEW',
  'MAX_DURATION',
  'SCHEDULE_EXHAUSTED',
  'MODE_DOWNGRADED',
]);
export type LegacyArchiveReason = z.infer<typeof LegacyArchiveReasonSchema>;

export function normalizeArchiveReason(
  raw: LegacyArchiveReason | null | undefined,
): ArchiveReason | null {
  if (!raw) return null;
  if (raw === 'MAX_VIEW' || raw === 'MAX_DURATION') return 'SCHEDULE_EXHAUSTED';
  return raw;
}

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

// M4 재편(2026-07-15+): product-card Epic 2 · Card 배지 3종용 필드 신설.
// - createdMode : 카드 생성 시점의 LearningMode 스냅샷 (`ScheduleModeChangeAt` 이전 기준).
// - effectiveMax: 현재 활성 스케줄로 재계산된 유효 maxView + intervals + 파생 mode.
//                 사용자가 mode를 다운그레이드하면 createdMode > effectiveMax.mode 상황이 발생.
// null 허용: 이력 카드(M4 이전 생성)는 createdMode 미기록 · effectiveMax는 항상 존재.
export const EffectiveMaxSchema = z.object({
  mode: LearningModeSchema,
  maxView: z.number().int().positive(),
  intervals: z.array(z.number().int().positive()),
});
export type EffectiveMax = z.infer<typeof EffectiveMaxSchema>;

export const CardSchema = z.object({
  cardId: z.coerce.string(),
  deckId: z.coerce.string().optional(),
  // M5 신설(2026-07-22+): LT-E4-CARD-AXIS · Card → Axis 직접 매핑.
  // BE PR#4 응답의 `card.axis_id NOT NULL` 승격 대응. Deck 폐기 대비 optional 유지.
  axisId: z.string().nullable().optional(),
  status: CardStatusSchema,
  enteredFieldAt: z.string(),
  viewCount: z.number().int().nonnegative(),
  summary: z.string(),
  keywords: z.array(KeywordOnCardSchema),
  tags: z.array(TagSchema),
  lastViewedAt: z.string().nullable().optional(),
  createdMode: LearningModeSchema.nullable().optional(),
  effectiveMax: EffectiveMaxSchema.optional(),
  archiveReason: ArchiveReasonSchema.nullable().optional(),
});
export type Card = z.infer<typeof CardSchema>;

export const ViewCardResponseSchema = z.object({
  autoArchived: z.boolean(),
  archiveReason: ArchiveReasonSchema.nullable(),
  lastViewedAt: z.string(),
  viewCount: z.number().int().nonnegative(),
});
export type ViewCardResponse = z.infer<typeof ViewCardResponseSchema>;

/**
 * createdMode · effectiveMax · 진행 인덱스로 다음 노출 D일을 계산.
 * - createdMode가 없으면 effectiveMax.intervals 기준 (하위 호환).
 * - viewCount >= 유효 maxView 이면 null (더 이상 노출 없음 · 아카이브 대상).
 * (Story 2-4 · `<UpcomingExposureIndicator>` 코어 로직)
 */
export function nextExposureDays(input: {
  viewCount: number;
  createdMode?: LearningMode | null;
  effectiveMax: EffectiveMax;
}): number | null {
  const source = input.createdMode
    ? LEARNING_MODE_META[input.createdMode].intervals
    : input.effectiveMax.intervals;
  const maxView = input.effectiveMax.maxView;
  if (input.viewCount >= maxView) return null;
  const idx = input.viewCount;
  if (idx >= source.length) return null;
  return source[idx] ?? null;
}

// M4 재편(2026-07-15+): 4옵션 (MODE_7D/14D/28D/60D · product-card Epic 1).
// 기존 3옵션 (TEN_DAYS/TWENTY_DAYS/THIRTY_DAYS) SUPERSEDED · learningMode.ts SoT 사용.
export { LearningModeSchema as ScheduleModeSchema } from './learningMode';
export type { LearningMode as ScheduleMode } from './learningMode';

export const ScheduleConfigSchema = z.object({
  scheduleMode: LearningModeSchema,
  maxDurationInput: z.number().int().positive(),
  softScheduleIntervals: z.array(z.number().int().positive()),
  maxView: z.number().int().positive(),
});
export type ScheduleConfig = z.infer<typeof ScheduleConfigSchema>;

// Frontend create request — assembled in the form. The endpoint layer
// transforms it into Backend's CardRequest.Create shape (mainNote object,
// keyword string list, tag value list) and posts to /api/v1/axes/{axisId}/cards.
// M5 신설(2026-07-22+): LT-E5-DECK-ABOLISH · Deck 폐기 · Axis 직접 매핑.
export const CreateCardRequestSchema = z.object({
  axisId: z.string().min(1),
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
  axisId: z.string().nullable().optional(),
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
  createdMode: LearningModeSchema.nullable().optional(),
  effectiveMax: EffectiveMaxSchema.optional(),
  archiveReason: LegacyArchiveReasonSchema.nullable().optional(),
});
export type RawCardDetail = z.infer<typeof RawCardDetailSchema>;

export const RawCardSummarySchema = z.object({
  cardId: z.coerce.string(),
  axisId: z.string().nullable().optional(),
  keywords: z.array(RawKeywordDtoSchema),
  summary: z.string(),
  tags: z.array(RawTagDtoSchema),
  contentType: MainContentTypeSchema,
  status: CardStatusSchema,
  enteredFieldAt: z.string(),
  viewCount: z.number().int().nonnegative(),
  lastViewedAt: z.string().nullable().optional(),
  createdDate: z.string().optional(),
  createdMode: LearningModeSchema.nullable().optional(),
  effectiveMax: EffectiveMaxSchema.optional(),
  archiveReason: LegacyArchiveReasonSchema.nullable().optional(),
});
export type RawCardSummary = z.infer<typeof RawCardSummarySchema>;

export function adaptCardDetail(raw: RawCardDetail): Card {
  return {
    cardId: raw.cardId,
    deckId: raw.deckId,
    axisId: raw.axisId ?? null,
    status: raw.status,
    enteredFieldAt: raw.enteredFieldAt,
    viewCount: raw.viewCount,
    summary: raw.summary,
    keywords: raw.keywords.map((k) => ({ id: k.id, value: k.value })),
    tags: raw.tags.map((t) => ({ tagId: t.id, name: t.value })),
    lastViewedAt: raw.lastViewedAt ?? null,
    createdMode: raw.createdMode ?? null,
    effectiveMax: raw.effectiveMax,
    archiveReason: normalizeArchiveReason(raw.archiveReason),
  };
}

export function adaptCardSummary(raw: RawCardSummary, deckId?: string): Card {
  return {
    cardId: raw.cardId,
    deckId,
    axisId: raw.axisId ?? null,
    status: raw.status,
    enteredFieldAt: raw.enteredFieldAt,
    viewCount: raw.viewCount,
    summary: raw.summary,
    keywords: raw.keywords.map((k) => ({ id: k.id, value: k.value })),
    tags: raw.tags.map((t) => ({ tagId: t.id, name: t.value })),
    lastViewedAt: raw.lastViewedAt ?? null,
    createdMode: raw.createdMode ?? null,
    effectiveMax: raw.effectiveMax,
    archiveReason: normalizeArchiveReason(raw.archiveReason),
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
