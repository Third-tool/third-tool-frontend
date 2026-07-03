import { useMutation } from '@tanstack/react-query';
import { suggestSelectionOutline } from '@/lib/api/endpoints/suggestion';
import type { SelectionOutlineRequest } from '@/lib/api/schemas/suggestion';

// product-ai-suggestion Story 1-7 (신설 · 2026-07-02).
// Selection outline (컨테이너 name + 챕터 리스트) 추천.
// Roadmap outline 을 context 로 함께 전달하여 대비 관점 유지.
export function useSuggestSelectionOutline() {
  return useMutation({
    mutationFn: (payload: SelectionOutlineRequest) => suggestSelectionOutline(payload),
  });
}
