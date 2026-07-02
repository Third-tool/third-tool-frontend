import { useMutation } from '@tanstack/react-query';
import { suggestLayers } from '@/lib/api/endpoints/suggestion';
import type { LayerSuggestionRequest } from '@/lib/api/schemas/suggestion';

// product-ai-suggestion Story 1-1. Layer Port 뮤테이션 훅.
// 429(Rate Limit) 대응은 Epic 5 (RateLimitToast) 에서 확장.
export function useSuggestLayers() {
  return useMutation({
    mutationFn: (payload: LayerSuggestionRequest) => suggestLayers(payload),
  });
}
