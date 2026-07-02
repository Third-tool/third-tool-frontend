import { useMutation } from '@tanstack/react-query';
import { suggestRoadmap } from '@/lib/api/endpoints/suggestion';
import type { RoadmapSuggestionRequest } from '@/lib/api/schemas/suggestion';

// product-ai-suggestion Story 1-3. Roadmap Port 뮤테이션 훅.
export function useSuggestRoadmap() {
  return useMutation({
    mutationFn: (payload: RoadmapSuggestionRequest) => suggestRoadmap(payload),
  });
}
