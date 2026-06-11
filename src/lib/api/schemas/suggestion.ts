import { z } from 'zod';

export const ProviderContextSchema = z.enum(['none', 'gap_aware']);
export type ProviderContext = z.infer<typeof ProviderContextSchema>;

export const SuggestionSchema = z.object({
  description: z.string(),
  rationale: z.string(),
});
export type Suggestion = z.infer<typeof SuggestionSchema>;

export const SuggestionsResponseSchema = z.object({
  suggestions: z.array(SuggestionSchema),
  suggestionsAvailable: z.boolean(),
  provider_context: ProviderContextSchema,
});
export type SuggestionsResponse = z.infer<typeof SuggestionsResponseSchema>;
