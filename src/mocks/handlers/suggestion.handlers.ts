import { http, HttpResponse } from 'msw';

// product-ai-suggestion Epic 1 로컬 stub. BE Adapter(Epic 2~4) 완성 전까지 사용.
// 응답은 shape 정합 위주 — 텍스트 값은 시각적으로 구분되는 최소 stub.
// `suggestionsAvailable=true` · `providerContext="stub"` 로 dev only 표시.

const STUB_PROVIDER = 'stub';

export const suggestionHandlers = [
  http.post('/api/v1/suggestions/layers', async () => {
    return HttpResponse.json({
      layers: [
        { name: 'CS 기초', rationale: 'concepts 에 백엔드 언어가 포함됨', suggestedAxisCount: 4 },
        { name: '언어/문법', rationale: '입문~중급 필수', suggestedAxisCount: 3 },
      ],
      suggestionsAvailable: true,
      providerContext: STUB_PROVIDER,
    });
  }),

  http.post('/api/v1/suggestions/axes', async () => {
    return HttpResponse.json({
      axes: [
        { name: '자료구조', rationale: 'CS 기초 축의 표준 구성', roadmapDraft: '# 자료구조 로드맵\n1. 배열\n2. 연결리스트' },
        { name: '알고리즘', rationale: 'CS 기초 축의 표준 구성', roadmapDraft: '# 알고리즘 로드맵\n1. 정렬\n2. 탐색' },
      ],
      suggestionsAvailable: true,
      providerContext: STUB_PROVIDER,
    });
  }),

  http.post('/api/v1/suggestions/roadmaps', async () => {
    return HttpResponse.json({
      // ADR023: roadmap = 축의 "헌법". 여기서 '초안' 은 AI 제안 상태(미저장)를
      // 뜻하며 도메인 어휘와 무관 — "헌법" 어휘를 병기해 사용자 오해를 차단.
      roadmapDraft: '# 축 헌법 초안 (AI 제안)\n\n주제 A → 주제 B → 주제 C',
      suggestionsAvailable: true,
      providerContext: STUB_PROVIDER,
    });
  }),

  http.post('/api/v1/suggestions/selections', async () => {
    return HttpResponse.json({
      selections: [
        { name: '사례 A', content: '실무 적용 요약' },
        { name: '사례 B', content: '반대 사례 요약' },
      ],
      suggestionsAvailable: true,
      providerContext: STUB_PROVIDER,
    });
  }),
];
