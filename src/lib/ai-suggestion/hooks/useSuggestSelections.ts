import { useMutation } from '@tanstack/react-query';
import { suggestSelections } from '@/lib/api/endpoints/suggestion';
import type { SelectionsSuggestionRequest } from '@/lib/api/schemas/suggestion';

// product-ai-suggestion Story 1-4. Selections Port 뮤테이션 훅.
export function useSuggestSelections() {
  return useMutation({
    mutationFn: (payload: SelectionsSuggestionRequest) =>
      suggestSelections(payload),
  });
}
