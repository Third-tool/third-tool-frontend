import { useMutation } from '@tanstack/react-query';
import { suggestSelections } from '@/lib/api/endpoints/suggestion';
import type { SelectionsSuggestionRequest } from '@/lib/api/schemas/suggestion';

/**
 * @deprecated SUPERSEDED · 2026-07-02 (product-ai-suggestion Story 1-4).
 * 4-Port Selections 훅은 6-Port(`useSuggestSelectionOutline` + `useSuggestSelectionSubtree`)로 대체됨.
 * 이 파일은 M4 FE PR#5(`FE-AS-E2-E3-DIALOG-BUTTON-CLEANUP`)에서 물리 삭제 예정.
 * 신규 코드에서 사용 금지 · 6-Port 훅 사용할 것.
 */
// product-ai-suggestion Story 1-4. Selections Port 뮤테이션 훅.
export function useSuggestSelections() {
  return useMutation({
    mutationFn: (payload: SelectionsSuggestionRequest) =>
      suggestSelections(payload),
  });
}
