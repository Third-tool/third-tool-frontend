import { useMutation } from '@tanstack/react-query';
import { suggestChaptersOutline } from '@/lib/api/endpoints/suggestion';
import type { ChaptersOutlineRequest } from '@/lib/api/schemas/suggestion';

// product-ai-suggestion Story 1-5 (신설 · 2026-07-02).
// Roadmap outline (챕터 title + rationale 리스트) 추천 — 사용자 승인 후 subtree 병렬 요청.
// 429(Rate Limit) 대응은 Epic 5 (RateLimitToast) 에서 확장.
export function useSuggestChaptersOutline() {
  return useMutation({
    mutationFn: (payload: ChaptersOutlineRequest) => suggestChaptersOutline(payload),
  });
}
