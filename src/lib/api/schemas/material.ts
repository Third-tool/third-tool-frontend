import { z } from 'zod';
import { ProficiencyLevelSchema } from './facade';

const Base = {
  materialId: z.string(),
  name: z.string(),
  proficiencyLevel: ProficiencyLevelSchema,
};

export const BookMaterialSchema = z.object({
  ...Base,
  type: z.literal('BOOK'),
  author: z.string(),
});

export const CourseMaterialSchema = z.object({
  ...Base,
  type: z.literal('COURSE'),
  platform: z.string(),
  url: z.string().url(),
});

export const AiConversationMaterialSchema = z.object({
  ...Base,
  type: z.literal('AI_CONVERSATION'),
  aiProvider: z.string(),
  note: z.string().optional(),
});

export const WebResourceMaterialSchema = z.object({
  ...Base,
  type: z.literal('WEB_RESOURCE'),
  source: z.string(),
  url: z.string().url(),
});

export const MaterialSchema = z.discriminatedUnion('type', [
  BookMaterialSchema,
  CourseMaterialSchema,
  AiConversationMaterialSchema,
  WebResourceMaterialSchema,
]);
export type Material = z.infer<typeof MaterialSchema>;
