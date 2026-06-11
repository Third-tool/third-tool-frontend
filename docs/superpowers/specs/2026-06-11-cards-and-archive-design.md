# 2차 Spec — Card 세션(`/study`) + Archive(`/archive`) + 카드 생성

작성일: 2026-06-11
대상 프로젝트: third-tool-frontend
선행 spec: `2026-06-11-landing-and-scaffold-design.md` (1차 — Vite + 디자인 시스템 + 랜딩)
관련 백엔드: `workflows/backend-boundary/api-card.md`, `screen-state-and-flags.md`, `ux-writing.md`

---

## 1. 목적과 컨셉

1차에서 만든 디자인 시스템과 모킹 인프라 위에 **매일 사용하는 핵심 동선**(오늘의 카드 세션) + **배경 지식 서가**(archive) + **카드 생성**을 얹는다.

핵심 사용자 가치:
- 매일 카페에 앉아 "오늘의 카드"를 한 장씩 만난다 → 자동으로 순환.
- 충분히 만난 카드는 **배경 지식**으로 옮겨가서 잠시 쉬고, 필요할 때 다시 만난다.
- 새로운 카드를 어디서든 빠르게 추가할 수 있다.

UX 톤(백엔드 ux-writing 컨벤션 그대로):
- "실패" 절대 금지. "순환 완료", "배경 지식", "쉬러", "잠시 후 다시 만나요" 사용.
- 모든 flag는 차단이 아닌 안내. "검토해보세요", "다음에 만나요" 톤.

---

## 2. 화면 구조

### 2.1 `/study` — 오늘의 Card 세션

| 상태 | UI |
|---|---|
| 로딩 | 큰 중앙 스피너 또는 카드 모양 skeleton 1장 |
| 세션 있음 | **싱글 포커스 카드 뷰어** (한 번에 1장, 큰 글씨) + 상단 진행 (`3/12 · DAY_3`) + 우상단 `+ 새 카드` 버튼 |
| 마지막 카드 직전 노출 | 카드 위에 작은 라벨 "이번이 마지막 노출입니다" (warning 컬러, 톤은 부드럽게) |
| 큐 완료 | "오늘 학습 가능한 카드를 모두 완료했습니다 👋" + `+ 10장 더 학습하기` 버튼(가용 시) + `오늘은 여기까지` 버튼(holding 페이지로) |
| 에러(시스템) | "지금 카드를 가져오는 길이 막혀있어요. 잠시 후 다시 시도해주세요." + 재시도 버튼 |
| 빈 상태(애초에 0장) | "아직 만날 카드가 없어요. 첫 카드를 써볼까요?" + `새 카드 펴기` CTA |

**카드 노출 흐름** (한 카드 진입 시):
1. 진입과 동시에 `POST /api/cards/{id}/view` (한 번만).
2. 응답을 보고:
   - `autoArchived: true` & `archiveReason: MAX_VIEW` → "이 카드는 충분히 노출되었습니다. 배경 지식으로 이동합니다." toast → 1.2s 뒤 자동으로 다음 카드.
   - `autoArchived: true` & `archiveReason: MAX_DURATION` → "이 카드는 순환을 완료했습니다. 잠시 후 다시 만나요 👋" toast → 다음 카드.
   - `autoArchived: false` & `viewCount === maxView - 1` → 화면 안에 라벨 표시(toast 아님).
   - 그 외엔 일반 표시.
3. 사용자 액션:
   - `다음 카드` 버튼 → 다음 카드로.
   - `잠시 쉬러 보내기` (manual archive) → `POST /api/cards/{id}/archive` → "배경 지식으로 옮겼어요" toast → 다음 카드.
   - `편집`은 이번 spec에서 제외.
4. 마지막 카드 끝 → 큐 완료 상태로 전환.

**+10장 더**: `POST /api/review-session/extend?count=10`
- `completedAll: true` 이면 버튼 비활성화 + "오늘은 모두 만났어요" 메시지.
- 성공 시 `addedCards`를 큐 뒤에 append, "10장이 더 추가됐어요" toast, 사용자는 즉시 첫 번째 추가 카드를 만나도록 큐 인덱스를 그 위치로 이동(휴식 화면에서 자동으로 벗어남).

**dailyTarget**: 코드 상수 30. 설정 UI 없음(4차 spec).

### 2.2 `/archive` — 배경 지식 서가

| 상태 | UI |
|---|---|
| 로딩 | 카드 모양 skeleton 6개 (masonry 위치에) |
| 데이터 있음 | **masonry 레이아웃** (Voices 섹션 톤) — Double-Bezel 카드들이 다른 높이로 배치 |
| 카드 클릭 | 자리에서 펼쳐서(인라인 expand) summary 전체 + keywords + tags + `다시 만나러 보내기` 버튼 |
| 다시 만나러 보내기 | `POST /api/cards/{id}/return-to-field` → "오늘부터 다시 만나요" toast + 해당 카드 잠깐 강조 후 목록에서 제거(또는 회색 처리) |
| 빈 상태 | "아직 배경 지식이 모이지 않았어요. 오늘의 카드를 충분히 만나면 여기에 쌓여요." |
| 에러 | 동일 톤의 안내 + 재시도 |

**태그 필터**:
- 상단에 `EyebrowTag` 줄 — `전체` + 카드들에 붙은 태그 chip들(빈도 desc).
- 선택 시 `GET /api/cards?status=ARCHIVE&tagId={id}` (단일 선택, 다중 선택 없음).
- 선택 칩에는 다른 색(amber 배경).

### 2.3 카드 생성 모달 (공통)

진입점:
- `/study` 우상단 `+ 새 카드`
- `/archive` 빈 상태 CTA
- 랜딩의 Closing CTA `창가 자리로 앉기` → `/study` 진입 직후 모달 열기? — 이번 spec에선 그냥 `/study`로만 이동.

레이아웃:
- 데스크탑: 중앙 Dialog (Double-Bezel)
- 모바일(<768px): 화면 하단에서 슬라이드업 BottomSheet (같은 컴포넌트, 위치/모션만 분기)

필드:
| 필드 | 타입 | 검증 |
|---|---|---|
| summary | textarea (자동 높이) | 필수, 1~500자 |
| keywords | KeywordInput (chip + Enter) | 필수, 1개 이상 (`CARD_KEYWORD_MIN_REQUIRED` 코드 매핑) |
| tags | TagInput (chip + Enter) | 옵션 |

액션:
- `취소`: 모달 닫기 (입력 내용 폐기, 확인 없이)
- `카드 펴기`: `POST /api/cards` → 성공 시 모달 닫고 직전 페이지에 "새 카드를 펼쳤어요" toast + `react-query` invalidate (today, on-field, archive).
- 에러: 인라인 필드 에러 (`code`에 따라 분기). 시스템 에러는 모달 상단 banner.

---

## 3. API ↔ 화면 매핑

| Endpoint | 화면 | 트리거 |
|---|---|---|
| `GET /api/review-session/today?dailyTarget=30` | `/study` 진입 | 페이지 로드, mount |
| `POST /api/cards/{id}/view` | `/study` 현재 카드 진입 | 한 번/카드 |
| `POST /api/cards/{id}/archive` | `/study` 수동 archive | 버튼 클릭 |
| `POST /api/review-session/extend?count=10` | `/study` 큐 종료 화면 | 버튼 클릭 |
| `GET /api/cards?status=ARCHIVE&tagId?=X` | `/archive` | mount + 필터 변경 |
| `POST /api/cards/{id}/return-to-field` | `/archive` 카드 expand | 버튼 클릭 |
| `POST /api/cards` | 생성 모달 | submit |

**MSW 핸들러 (모두 새로 작성)**: 위 7개 + facade(기존). 더미 데이터: ON_FIELD 4장(DAY_1×2, DAY_3×1, DAY_7×1), ARCHIVE 5장(태그 분산).

---

## 4. 신규 컴포넌트 / 폴더 구조

```
src/
  features/
    cards/
      index.ts                        # barrel for routes
      StudyPage.tsx                   # /study orchestration
      ArchivePage.tsx                 # /archive orchestration
      sections/
        TodayQueueView.tsx            # 큐 진행 + 싱글 카드 뷰어 컨테이너
        TodayEmptyView.tsx            # 큐 비었을 때(휴식 화면)
        ArchiveMasonry.tsx            # masonry + 필터 컨테이너
        ArchiveCard.tsx               # 카드 1장(접힘/펼침)
      components/
        OnFieldCardFace.tsx           # 큰 글씨 싱글 카드 UI
        ProgressIndicator.tsx         # 3/12 · DAY_3
        KeywordInput.tsx
        TagInput.tsx
        TagFilterRow.tsx
      hooks/
        useTodayReview.ts             # useQuery + extend mutation + 큐 큐 상태
        useViewCard.ts                # mutation; 자동 archive 메시지 매핑
        useArchive.ts                 # useQuery (tagId param)
        useReturnToField.ts
        useArchiveCard.ts             # manual archive
        useCreateCard.ts
  components/                          # 공통 primitives 추가
    Dialog.tsx                        # Desktop 중앙 / Mobile bottom sheet 반응형
    Toast.tsx
    ToastProvider.tsx                 # provider + portal + queue
    Skeleton.tsx
    EmptyState.tsx
    TagChip.tsx
  lib/
    api/
      endpoints/
        card.ts                       # 함수형 API wrappers (Zod parse 포함)
    toast/
      toastQueue.ts                   # store
      useToast.ts                     # hook
  mocks/
    handlers/
      card.handlers.ts                # 7개 새 핸들러
      index.ts                        # 갱신: facade + card
```

---

## 5. 상태 관리

- **TanStack Query**가 단일 source of truth.
- Query keys:
  - `['review-session','today',{ dailyTarget }]`
  - `['cards','archive',{ tagId }]`
  - `['cards','on-field']` (이번 spec에선 invalidate 용도로만)
- Mutations:
  - `viewCard(cardId)` → 응답에서 `autoArchived/archiveReason` 추출 → toast 발사 + `cards/archive` & `review-session/today` invalidate(부분만).
  - `archiveCard(cardId)` → today 큐에서 카드 제거(`setQueryData`로 낙관적 업데이트), archive invalidate.
  - `returnToField(cardId)` → archive에서 제거, today invalidate.
  - `createCard(payload)` → 모든 cards 쿼리 invalidate.
  - `extendSession(count)` → today 결과에 addedCards append.

- 큐 인덱스(현재 보는 카드)는 React state(`StudyPage`). 카드 ID로 추적해서 invalidate 후에도 인덱스 유지.

---

## 6. UX 디테일

- **양보 톤 라벨** ("이번이 마지막 노출입니다"): warning이 아닌 amber-soft 배경, 일반 톤.
- **자동 archive 토스트**: 1.5-2초 머문 뒤 fade-out. 사용자가 보고 다음 카드로 이동 인지 가능한 시간.
- **싱글 포커스 뷰어 모션**: 카드 전환 시 `cubic-bezier(0.16,1,0.3,1)` 0.5s. 직전 카드는 살짝 좌측으로 fade out, 새 카드는 우측에서 fade in.
- **Archive expand**: spring + opacity. expand 카드는 row를 차지 (masonry breaking).
- **prefers-reduced-motion**: 모든 모션 즉시 전환으로 fallback (이미 globals.css에 있음, 이번에도 준수).
- **break-keep + leading-snug**: 한글 컴포넌트 전부 적용.

---

## 7. 에러/플래그 처리 매트릭스

| code (예) | 처리 |
|---|---|
| `CARD_KEYWORD_MIN_REQUIRED` | 모달 keywords 필드 인라인 에러 |
| `CARD_SUMMARY_REQUIRED` | summary 인라인 에러 |
| `CARD_NOT_FOUND` | toast "이 카드는 더 이상 없어요" + 큐에서 제거 |
| `AUTH_FORBIDDEN` | 페이지 상단 banner "다시 로그인해야 해요" (라우팅은 X — 4차 spec) |
| 429 (rate limit) | toast "분당 10회까지 가능해요. 잠시 후 다시 시도해주세요" |
| 기타 5xx | "지금 길이 막혀있어요" 일반 banner + 재시도 |

`ApiError`의 `code`로 분기. 알려지지 않은 code는 기본 메시지로 fallback.

---

## 8. 라우팅 변경

| 경로 | 변경 |
|---|---|
| `/study` | placeholder → 실제 화면 |
| `/archive` | placeholder → 실제 화면 |
| `/map` | placeholder 유지 (3차 spec) |
| `*` | 그대로 |

router.tsx에 `<StudyPage/>`, `<ArchivePage/>` import 교체.

---

## 9. 테스트 전략

| 대상 | 방식 |
|---|---|
| `useTodayReview`/`useViewCard`/`useArchive`/`useReturnToField` | Vitest + MSW (`setupServer` for node) — 응답 시나리오별(success/auto-archive/empty/error) |
| `KeywordInput`/`TagInput` | render + Enter 키 + chip 제거 |
| `OnFieldCardFace` | render + 마지막 노출 라벨 조건 |
| `Dialog`/`Toast` | render + dismiss + a11y(role/aria) |
| `StudyPage` 통합 | MSW로 today 응답 → 첫 카드 표시 + 다음/archive 버튼 동작 |
| `ArchivePage` 통합 | MSW로 list 응답 → 카드 expand + return-to-field |

목표: 테스트 추가 30개 내외. **각 mutation hook은 success + auto-archive + error 시나리오 모두 커버**.

---

## 10. 수용 기준

1. `/study` 진입 시 mock today 응답 카드 4장이 큐로 들어오고 첫 카드가 표시됨
2. "다음 카드" 클릭 시 `POST /view` 호출, 다음 카드로 이동
3. mock으로 `autoArchived:true` 응답 강제 시 toast 표시 + 자동 이동
4. 큐 종료 후 `+10장 더` 버튼이 표시되며 호출 시 카드가 큐에 추가됨
5. `+ 새 카드` 모달이 열리고, summary/keyword 비우면 인라인 에러, 채우면 성공 + 모달 닫힘 + toast
6. `/archive`에서 masonry로 5장이 보이고, 카드 클릭 시 expand
7. expand 안의 `다시 만나러 보내기` 클릭 시 카드가 목록에서 사라지고 toast
8. 태그 필터 클릭 시 `tagId` query로 재조회
9. 모바일(360px)에서 생성 모달이 BottomSheet로 표시됨
10. 모든 모션 `prefers-reduced-motion: reduce`에서 즉시 전환
11. `npm run lint`/`typecheck`/`test`/`build` 모두 통과
12. UX 카피 verbatim 매치: "순환 완료", "배경 지식", "잠시 후 다시 만나요", "이번이 마지막 노출입니다", "오늘 학습 가능한 카드를 모두 완료했습니다"

---

## 11. 명시적 비범위

- 카드 편집 (생성 + archive/restore만)
- 스케줄 설정(scheduleMode, maxView, dailyTarget) UI — 4차 spec
- ON_FIELD 카드 전체 브라우즈 (today 세션과 별개)
- 태그 CRUD UI
- 검색/정렬/페이지네이션 — 백엔드가 페이지네이션 줄 때까지 단순 list
- 키보드 단축키 (스페이스로 다음 카드 등)
- AI 제안 (3차 spec — LearningFacade)
- 인증/세션 (4차 spec)

---

## 12. 위험/주의

- **viewCount 동기화**: `view` mutation이 큐의 카드 객체 viewCount를 업데이트해야 함. 응답 `viewCount` 사용.
- **자동 archive 후 invalidate**: archive에 새로 추가된 카드를 즉시 invalidate하면 사용자가 archive 페이지에서 막 추가된 카드를 보게 됨. OK이지만, today invalidate 시 현재 인덱스가 흔들리지 않도록 카드 ID 기준으로 인덱스 유지.
- **MSW 핸들러 상태**: 메모리 mock store (`Map<string, Card>`)를 핸들러 모듈에서 유지. 새로고침 시 초기화. 후속 spec에서 백엔드 연결 시 핸들러 비활성화.
- **모달 + 라우터**: 모달을 URL과 동기화하지 않음 (state-only). 뒤로 가기로 닫히지 않는 점은 v2 한계로 수용.
- **masonry**: CSS columns 또는 grid w/ auto-rows + JS-free. JS 기반 라이브러리(masonic 등) 도입 안 함.
