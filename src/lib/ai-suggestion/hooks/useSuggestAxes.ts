import { useMutation } from '@tanstack/react-query';
import { suggestAxes } from '@/lib/api/endpoints/suggestion';
import type { AxisSuggestionRequest } from '@/lib/api/schemas/suggestion';

// product-ai-suggestion Story 1-2. Axis Port 뮤테이션 훅.
export function useSuggestAxes() {
  return useMutation({
    mutationFn: (payload: AxisSuggestionRequest) => suggestAxes(payload),
  });
}
