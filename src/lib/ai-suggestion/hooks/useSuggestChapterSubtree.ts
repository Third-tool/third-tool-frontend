import { useMutation } from '@tanstack/react-query';
import { suggestChapterSubtree } from '@/lib/api/endpoints/suggestion';
import type { ChapterSubtreeRequest } from '@/lib/api/schemas/suggestion';

// product-ai-suggestion Story 1-6 (신설 · 2026-07-02).
// 개별 챕터 body (ASCII 트리) 추천 — outline 승인 후 챕터별 병렬 요청.
export function useSuggestChapterSubtree() {
  return useMutation({
    mutationFn: (payload: ChapterSubtreeRequest) => suggestChapterSubtree(payload),
  });
}
