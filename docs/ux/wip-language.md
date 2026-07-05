# FE UX 명명 원칙 (WIP · 2026-07-22+)

> **역할**: FE 사용자 노출 문구의 명명 규칙 정리. 기술 용어(도메인 · 구조) vs 사용자 표현의 매핑.
> M5 신설 (LT E6 S6-5) — Layer 명명 대체 방침 · 앞으로 문구 갱신 시 참조.

---

## Layer

**기술 용어 (코드·SDD)**: `Layer` · `LearningFacadeLayer` · `layerId` · `layer.progressStatus`

**사용자 노출 문구**:
- **"레이어"** (직역 · v1 기본 · Landing · Sidebar · TopBar 등에 사용)
- **"학습 축 그룹"** (v1 대안 · 초심자 UX 튜토리얼에서 소개)
- ❌ "Layer 1" · "Layer 2" 같은 번호 표기는 **금지**. 사용자가 직접 명명한 이름을 사용 (예: "시스템 설계 · 알고리즘 · 아키텍처")

**Progress Status 3-state 문구** (M5 · `<LayerHeaderBadge>` progressStatus):
- `NOT_STARTED` → "아직 시작 안 함" (회색 · bg-glass · text-cream-mute)
- `IN_PROGRESS` → "학습 중" (주황 · bg-amber/20 · text-amber-deep)
- `COMPLETED` → "완료" (녹색 · bg-emerald/20 · text-emerald)

**Layer 명명 미기입 시 대체 표기**:
- 사용자가 이름 미지정 시 `Uncategorized` 표기 유지 · UX 문구에는 "미분류"로 노출
- 자동 제안 이름 (예: `Uncategorized` · `Layer 1`)은 v1엔 미도입 (v0.1.1v+ 관찰 후 결정)

---

## Axis

**기술 용어 (코드·SDD)**: `Axis` · `LearningFacadeAxis` · `axisId` · `axis.progressStatus` (v0.1.1v+ 이관)

**사용자 노출 문구**:
- **"축"** (v1 기본 · UI 표기)
- **"학습 축"** (강조 시 · Wizard 튜토리얼)

**Axis 상세 3-탭 명명** (`<AxisDetailPage>` M4 신설):
- **Roadmap** → "로드맵" (수렴 · 헌법 · FE-ADR001)
- **Selections** → "발산" (판례 · FE-ADR001)
- **Cards** → "카드" (Card BC 매핑)

---

## Card

**기술 용어**: `Card` · `cardId` · `createdMode` · `effectiveMax` · `archiveReason`

**사용자 노출 문구**:
- **"카드"** (기본)
- **"학습 카드"** (강조 시)

**Archive Reason 3-reason 문구** (M4 · `<ArchiveReasonBadge>`):
- `MANUAL` → "수동 아카이브" (회색)
- `SCHEDULE_EXHAUSTED` → "학습 완료" (녹색)
- `MODE_DOWNGRADED` → "스케줄 조정 소진" (주황)

**Card Schedule Mode 4-옵션 문구** (M4 · `LearningMode`):
- `MODE_7D` → "집중 학습 모드 · 1~7일"
- `MODE_14D` → "단기 학습 모드 · 8~14일"
- `MODE_28D` → "중기 학습 모드 · 15~28일"
- `MODE_60D` → "장기 학습 모드 · 29~60일"

---

## Review · DailyBatch

**기술 용어**: `DailyLearningBatch` · `DailyCardEntry` · `ReviewSession` · `batchDate`

**사용자 노출 문구**:
- **"오늘의 학습"** · **"매일 학습"** (v1 기본)
- **"학습 세션"** (진행 중 흐름)
- **"복습"** vs **"학습"** — v1은 **"학습"** 통일 (사용자 인지 부담 감소)

**Batch Closed Banner 문구** (M5 · `<BatchClosedBanner>`):
- "어제 학습이 종료됐어요"
- "지나간 카드는 다음 노출 때 다시 만나요"

---

## Deck (🚨 폐기 · M5)

**기술 용어**: (M5 · LT-E5-DECK-ABOLISH · 물리 삭제 완료)

**사용자 노출 문구 대체**:
- 기존 "Deck" · "덱" · "덱 관리" → **삭제**
- 카드 컬렉션은 이제 **Axis** 단위 (사용자 문구도 "축의 카드"로 통일)
- 저장 URL 방어 (6개월 유지): `/decks` · `/decks/:deckId` → `/review` hard redirect

---

## AI Suggestion (Provider Context)

**기술 용어**: `providerContext` (dev-only · v1 badge)

**사용자 노출 문구**:
- `static:planner` → "AI 초안 (설계자)" (v1 관찰 후 튜닝)
- `static:designer` → "AI 초안 (디자이너)"
- `static:problem-solver` → "AI 초안 (문제 해결자)"
- `llm:gemini-flash-2.5` → "AI 초안 (LLM)" (M7 배선 · v2)

---

## 갱신 이력

- 2026-07-22 (M5 · PR#5 · LT E6 S6-5): 최초 신설 · Layer 3-state progressStatus 문구 + Deck 폐기 대체
- (예정) 2026-08-XX (M6+): Home 재편 UX 문구 · Dashboard L3 Recommendation 안내 문구

---

## 참고

- FE-ADR001 (roadmap=수렴/헌법 · selection=발산/판례) — `docs/fe-adr/FE-ADR001-terminology-roadmap-selections.md`
- FE M5 milestone.md § LT E6 S6-5 대응 (본 문서 갱신 지시)
- BE 대응 마일스톤 `workflow/task/milestones/version/0.0.5v/milestone.md` § LT E6 · `Layer.progressStatus` 파생 로직
