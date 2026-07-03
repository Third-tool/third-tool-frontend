import { useMutation } from '@tanstack/react-query';
import { suggestSelectionSubtree } from '@/lib/api/endpoints/suggestion';
import type { SelectionSubtreeRequest } from '@/lib/api/schemas/suggestion';

// product-ai-suggestion Story 1-8 (신설 · 2026-07-02).
// Selection 챕터별 body (ASCII 트리) 추천.
export function useSuggestSelectionSubtree() {
  return useMutation({
    mutationFn: (payload: SelectionSubtreeRequest) => suggestSelectionSubtree(payload),
  });
}
