import { apiClient } from '@/lib/api/client';
import { z } from 'zod';
import {
  RawTagItemSchema,
  TagsListResponseSchema,
  TagCardsByStatusSchema,
  type TagsListResponse,
  type TagCardsByStatus,
} from '@/lib/api/schemas/tag';
import { RawCardSummarySchema, adaptCardSummary } from '@/lib/api/schemas/card';

export async function listTags(): Promise<TagsListResponse> {
  const { data } = await apiClient.get('/api/v1/tags');
  const raw = z.array(RawTagItemSchema).parse(data);
  return TagsListResponseSchema.parse({
    tags: raw.map((t) => ({ tagId: t.tagId, name: t.value, cardCount: t.cardCount })),
  });
}

export async function listCardsByTag(tagId: string): Promise<TagCardsByStatus> {
  const { data } = await apiClient.get(`/api/v1/tags/${tagId}/cards`);
  const Schema = z.object({
    onField: z.array(RawCardSummarySchema),
    archive: z.array(RawCardSummarySchema),
  });
  const parsed = Schema.parse(data);
  return TagCardsByStatusSchema.parse({
    onField: parsed.onField.map((c) => ({
      cardId: adaptCardSummary(c).cardId,
      summary: c.summary,
    })),
    archive: parsed.archive.map((c) => ({
      cardId: adaptCardSummary(c).cardId,
      summary: c.summary,
    })),
  });
}
