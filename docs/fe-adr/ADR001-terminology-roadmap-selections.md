# FE-ADR001 — roadmap / selection 어휘 정책

- 상태: **Accepted** (2026-07-03)
- 관련: BE `docs/adr/ADR023-terminology-roadmap-selections.md`
- 발효 시점: FE M3 / 0.0.3v (`FE-ADR023-TERMINOLOGY` · milestone.md PR#6)

## Context

BE ADR023 (2026-07-02 pivot · 이슈 #19)에서 roadmap / selection 어휘가 **사용자 정의**로 확정됐다.

- **roadmap = 축의 헌법 = 수렴 원리** — 축이 다루는 개념의 오래가는 판단 프레임. 새 사례에도 흔들리지 않는 뼈대.
- **selection = 축의 판례 = 발산 사례** — 축의 원리를 특정 상황·시대에 적용한 사례. 시점별로 여러 버전을 두고 관리.

FE 는 이 어휘를 UI 라벨 · 툴팁 · 주석 · i18n 문구에 그대로 반영해야 사용자 오해 · 팀 커뮤니케이션 dissonance 를 피할 수 있다.

## Decision

FE 는 다음 어휘를 **표준**으로 유지한다.

### 사용자 노출 (UI 라벨 · 안내 문구)

| 도메인 개념 | 표준 어휘 | 근거 |
|---|---|---|
| roadmap | **로드맵 · 헌법 · 수렴** | ADR023 |
| selection | **Selection · 판례 · 발산** | ADR023 |
| roadmap 챕터 노드 | **챕터 노드** (Roadmap 트리 구성 요소) | 이슈 #15 |
| selection 챕터 노드 | **챕터 노드** (Selection 트리 구성 요소) | 이슈 #16 |

**정문 문구 예시**:
- `<ConceptSpecTooltip mode="roadmap">` — "로드맵 = 수렴 (헌법)" · "축이 다루는 개념의 오래가는 원리·판단 프레임. 새 사례에도 흔들리지 않는 뼈대."
- `<ConceptSpecTooltip mode="selection">` — "Selection = 발산 (판례)" · "축의 원리를 특정 상황·시대에 적용한 사례. 시점별로 여러 버전을 두고 관리."

### 금지 어휘

다음 어휘는 사용자 노출 UI 에서 **금지**한다. 사용 시 도메인 오해를 유발한다.

- roadmap 을 **"초안"** 또는 **"임시 안"** 으로만 지칭 → 반드시 **"헌법"** 을 병기하거나 "AI 가 제안한 축 헌법 초안" 형태로 명시.
- selection 을 **"합의최종안"**, **"최종안"**, **"결론"** 으로 지칭.
- roadmap · selection 둘 다 **"draft"** 를 도메인 명칭으로 사용 → API record 명 (`roadmapDraft`) 은 이관 유예용이며 UI 에는 노출 금지 (`suggestion.handlers.ts` 스텁 응답 필드 · S1-3/1-4 SUPERSEDED · M4 삭제).

### 코드 · JSDoc

- 도메인 개념을 참조하는 주석 · JSDoc 은 사용자 어휘와 정합해야 한다.
- 예: `// roadmap = 축의 헌법 (ADR023)` 처럼 어휘 근거를 인라인 표기.

### i18n

- 현재 릴리스(0.1.0v)까지는 ko 단일 언어 · 위 표준 어휘를 하드코딩.
- 다국어 도입 시 `roadmap.title` · `selection.title` 등 리소스 키로 이관 · 이 ADR 이 원문 정본.

## Consequences

- FE 스펙 5개 (`product-learning-tower.md`, `product-ai-suggestion.md`, `product-ai-interactive-roadmap.md`, `product-card.md`, `product-review.md`) 의 UI 어휘가 이 ADR 을 참조.
- 이후 신규 컴포넌트 · 화면에서 새 어휘 도입 시 이 ADR 갱신 · 팀 리뷰 필수.
- BE ADR023 개정 시 이 FE-ADR 도 동조 개정.

## 검증 (grep) — 2026-07-03 기준

`src/**` 어휘 잔재 스캔 결과:

| 케이스 | 검색 결과 | 판정 |
|---|---|---|
| `roadmap` 을 "초안" 으로만 지칭 | `src/features/card-editor/CardEditorPage.tsx:20` — "AI가 정리한 초안" (Card 정리 컨텍스트 · roadmap 도메인 무관) | ✅ 위반 아님 |
| `roadmap` 을 "초안" 으로 지칭 + 헌법 병기 | `SuggestionResultDialog.tsx` · `SuggestionResultDialog.test.tsx` — "축 헌법 초안" · "AI 가 제안한 축 헌법 초안" | ✅ 정합 (병기) |
| `selection` 을 "합의최종안" 으로 지칭 | 0 건 | ✅ 정합 |
| `roadmap` 을 "헌법 / 수렴" 으로 지칭 | `ConceptSpecTooltip.tsx` · `SuggestionResultDialog.tsx` · `suggestion.handlers.ts` — ADR023 병기 | ✅ 정합 |
| `selection` 을 "판례 / 발산" 으로 지칭 | `ConceptSpecTooltip.tsx` · `SuggestionResultDialog.tsx` — "축 판례" · "판례 제안 목록" | ✅ 정합 |

### 향후 개선

- M6 이후 (릴리스 대비) grep CI job 도입 검토 — `roadmap.*초안(?!.*헌법)` · `합의최종안` 정규식으로 CI 실패 처리.
- 지금은 로컬 · 리뷰어 세션에서 수동 확인.

## 관련 문서

- BE: `docs/adr/ADR023-terminology-roadmap-selections.md` (원문 정본)
- FE spec 개정본 (2026-07-02 pivot):
  - `workflows/fe/fe-workspectrum/sdd/in-progress/product-learning-tower.md` §🔄 Fix 개정
  - `workflows/fe/fe-workspectrum/sdd/in-progress/product-ai-suggestion.md` Epic 1 (6-Port)
- 마일스톤: `workflows/fe/fe-milestones/version/0.0.3v/milestone.md` PR#6
