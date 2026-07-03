import { http, HttpResponse } from 'msw';

// product-ai-suggestion Epic 1 로컬 stub. BE Adapter(Epic 2~4) 완성 전까지 사용.
// 응답은 shape 정합 위주 — 텍스트 값은 시각적으로 구분되는 최소 stub.
// `suggestionsAvailable=true` · `providerContext="stub"` 로 dev only 표시.
// 6-Port 후반 4개 (chaptersOutline/chapterSubtree/selectionOutline/selectionSubtree)는
// BE Static Adapter (backend-developer role catalog) 응답 형태 mock.

const STUB_PROVIDER = 'stub';
const STATIC_ADAPTER = 'static:backend-developer';

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

  // ── 6-Port 후반 4종 (2026-07-02 pivot) ─────────────────────
  // BE Static Adapter (backend-developer role catalog) 응답 형태 재현.

  http.post('/api/v1/suggestions/chapters-outline', async () => {
    return HttpResponse.json({
      chapters: [
        {
          title: '1. 하네스 엔지니어링 기초',
          rationale: 'AI 에이전트의 기본 프레임 확립',
        },
        {
          title: '2. 프롬프트 설계',
          rationale: '시스템/유저 프롬프트 분리와 재현성',
        },
        {
          title: '3. 도구 통합',
          rationale: 'MCP · function calling 등 tool 활용',
        },
        {
          title: '4. 평가와 관측',
          rationale: '평가 harness 와 traceability',
        },
      ],
      suggestionsAvailable: true,
      providerContext: STATIC_ADAPTER,
    });
  }),

  http.post('/api/v1/suggestions/chapter-subtree', async () => {
    return HttpResponse.json({
      bodyAsciiTree: [
        '├── 1-1. 정의와 본질',
        '│       모델 + 하네스 — 왜 두 축인가',
        '├── 1-2. 파라다임 전환',
        '│       Deterministic → Probabilistic',
        '└── 1-3. 실전 최소 구성',
        '        System prompt + tool + eval',
      ].join('\n'),
      suggestionsAvailable: true,
      providerContext: STATIC_ADAPTER,
    });
  }),

  http.post('/api/v1/suggestions/selection-outline', async () => {
    return HttpResponse.json({
      containerName: '웹 서비스 실전 v1',
      chapters: [
        {
          title: '1. 사이드 프로젝트 구성',
          rationale: '작은 실전 스택으로 원리 확인',
        },
        {
          title: '2. 프로덕션 롤아웃',
          rationale: '트래픽/장애 시 실제 판단 근거',
        },
      ],
      suggestionsAvailable: true,
      providerContext: STATIC_ADAPTER,
    });
  }),

  http.post('/api/v1/suggestions/selection-subtree', async () => {
    return HttpResponse.json({
      bodyAsciiTree: [
        '├── 스택 선정',
        '│       익숙한 언어 + 익숙하지 않은 축',
        '├── 배포',
        '│       CI/CD 최소 + 실패 rollback',
        '└── 관측',
        '        메트릭 + 로그 최소 파이프라인',
      ].join('\n'),
      suggestionsAvailable: true,
      providerContext: STATIC_ADAPTER,
    });
  }),
];
