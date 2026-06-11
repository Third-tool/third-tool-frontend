import { describe, it, expect } from 'vitest';
import { SuggestionsResponseSchema, ProviderContextSchema } from './suggestion';

describe('SuggestionsResponseSchema', () => {
  it('parses unavailable response', () => {
    const r = SuggestionsResponseSchema.parse({
      suggestions: [],
      suggestionsAvailable: false,
      provider_context: 'none',
    });
    expect(r.suggestionsAvailable).toBe(false);
  });
  it('parses gap-aware response', () => {
    const r = SuggestionsResponseSchema.parse({
      suggestions: [{ description: '관계형 모델링', rationale: '자료 없음 보완' }],
      suggestionsAvailable: true,
      provider_context: 'gap_aware',
    });
    expect(ProviderContextSchema.parse(r.provider_context)).toBe('gap_aware');
  });
});
