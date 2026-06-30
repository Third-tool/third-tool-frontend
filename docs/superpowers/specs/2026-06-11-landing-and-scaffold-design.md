# 1차 Spec — 랜딩 페이지 + 프로젝트 골조 + 디자인 시스템

작성일: 2026-06-11
대상 프로젝트: third-tool-frontend (학습용 카페 무드 암기 학습 웹앱)
관련 백엔드: `workflows/backend-boundary/` (Card / LearningFacade / Daily Review / Materials / AI Suggestion)
관련 디자인 스킬: `.claude/skills/supanova-design/`

---

## 1. 목적과 컨셉

"꿈을 찾기 전까지 곁에 있어주는 카페" 같은 분위기의 암기형 학습 웹앱.
이번 spec은 **백엔드 기능을 화면화하기 전의 토대**다.

- **무드**: 다크 웜(에스프레소·차콜) + 크림/앰버 액센트, 에디토리얼 톤(Floria 레퍼런스).
- **목표**: 1차 spec만으로 다음이 갖춰진다.
  - Vite + React + TypeScript 프로젝트
  - 디자인 토큰(컬러/타이포/스페이스/모션)이 CSS 변수로 노출
  - 공통 컴포넌트 5종 (Button, Card[Double-Bezel], Section, EyebrowTag, GlassPillNav) + Iconify wrapper(`Icon`)
  - 랜딩 페이지 1개 (히어로 → 컨셉 → 학습 방식 3-스텝 → 후기/문구 → 최종 CTA)
  - axios 인스턴스 + Zod 스키마 폴더 골조
  - MSW(Mock Service Worker) 셋업 + 더미 핸들러 1개(예: `GET /api/learning-facade` 가짜 응답)로 부트 검증
  - React Router(`/`만 활성, 다른 라우트는 placeholder)

후속 spec들이 feature 폴더 단위(`features/cards/`, `features/facade/`, `features/review/`)로 얹힐 수 있도록 구조 잡는다.

---

## 2. 스택 결정

| 항목 | 결정 | 이유 |
|---|---|---|
| 빌드/런타임 | Vite 5 + React 18 + TS 5 | 사용자 요청 |
| 스타일 | Tailwind v4 + CSS 변수 토큰 | supanova 스킬이 Tailwind 클래스 가이드 기반. 토큰만 CSS var로 노출. |
| 라우팅 | React Router v6 | 표준 |
| 데이터 페칭 | TanStack Query + axios + Zod | 백엔드 boundary가 상세 → 런타임 검증 필수 |
| Mock | MSW (browser worker) | 백엔드 없이 dev 실행 |
| 폰트 | Pretendard(KO) + Cabinet Grotesk(EN 디스플레이) | 스킬 mandate |
| 아이콘 | Iconify Solar set | 스킬 mandate, Lucide/FA 금지 |
| 테스팅 | Vitest + Testing Library (셋업만, 테스트 작성은 후속) | Vite 표준 |
| 패키지 매니저 | npm (기존 유지) | 변경 이유 없음 |

**기존 CRA 잔재 정리**: `package.json`(CRA), `package-lock.json`(CRA), `src/`, `public/` 는 새 Vite scaffold로 치환 (실질적으로 손대지 않은 CRA 기본 템플릿이라 보존 가치 0).

---

## 3. 폴더 구조

```
src/
  app/
    App.tsx                # Router + QueryClientProvider + 글로벌 wrappers
    main.tsx               # React 진입점 (MSW 부팅, 폰트 preload)
    router.tsx             # 라우트 정의
  features/
    landing/
      LandingPage.tsx
      sections/
        HeroSection.tsx
        ConceptSection.tsx
        ThreeStepsSection.tsx
        VoicesSection.tsx
        ClosingCtaSection.tsx
      components/
        FloatingKeywords.tsx   # 부유 키워드 카드
        MiniCardPreview.tsx    # 라이브 미니 UI 프리뷰
  components/              # 도메인 무관 UI primitives
    Button.tsx
    Card.tsx               # Double-Bezel
    Section.tsx
    EyebrowTag.tsx
    GlassPillNav.tsx
    Icon.tsx               # Iconify wrapper
  lib/
    api/
      client.ts            # axios instance + 인터셉터
      schemas/             # Zod 스키마 (백엔드 boundary 미러)
        card.ts
        facade.ts
        review.ts
        material.ts
        suggestion.ts
        index.ts
      endpoints/           # 함수형 API (후속 spec에서 채움)
        .gitkeep
    query/
      queryClient.ts
    motion/
      easings.ts           # cubic-bezier 토큰
      useFadeUp.ts         # IntersectionObserver 훅
  mocks/
    browser.ts             # MSW worker
    handlers/
      facade.handlers.ts   # 더미 1-2개
      index.ts
  styles/
    tokens.css             # CSS 변수 (color/typo/space/motion/radius)
    globals.css            # base 리셋 + 폰트 import
  types/
    api.ts                 # boundary 타입 재수출
public/
  mockServiceWorker.js     # MSW 자동 생성
  fonts/                   # (옵션) self-host 폰트
index.html
vite.config.ts
tailwind.config.ts
tsconfig.json
postcss.config.cjs
```

---

## 4. 디자인 토큰

`src/styles/tokens.css`에 CSS 변수로 노출. Tailwind config는 이 변수를 참조한다.

```css
:root {
  /* color — dark warm cafe */
  --color-bg: #1a1410;            /* 에스프레소 베이스 (pure black 금지) */
  --color-bg-elevated: #221a14;
  --color-surface: rgba(255, 248, 235, 0.04); /* 크림 틴트 글래스 */
  --color-border: rgba(255, 248, 235, 0.08);
  --color-text: #f5ead6;          /* 따뜻한 크림 */
  --color-text-muted: rgba(245, 234, 214, 0.62);
  --color-text-faint: rgba(245, 234, 214, 0.38);
  --color-accent: #d97706;        /* warm amber (saturation < 80%) */
  --color-accent-soft: rgba(217, 119, 6, 0.12);

  /* typography */
  --font-ko: 'Pretendard Variable', Pretendard, sans-serif;
  --font-en-display: 'Cabinet Grotesk', 'Pretendard Variable', sans-serif;
  --leading-snug: 1.45;
  --leading-relaxed: 1.7;
  --tracking-eyebrow: 0.15em;

  /* spacing — heavy breathing */
  --section-py: clamp(6rem, 10vw, 10rem);
  --container-max: 80rem;

  /* radius */
  --radius-card-outer: 2rem;
  --radius-card-inner: calc(2rem - 0.375rem);
  --radius-pill: 9999px;

  /* motion */
  --ease-spring: cubic-bezier(0.16, 1, 0.3, 1);
  --dur-fast: 240ms;
  --dur-base: 480ms;
  --dur-slow: 720ms;

  /* shadow — tinted to bg hue */
  --shadow-card-inset: inset 0 1px 1px rgba(255, 248, 235, 0.12);
  --shadow-lift: 0 24px 48px -24px rgba(20, 12, 6, 0.6);
}
```

Tailwind theme에서 `colors.bg`, `colors.accent`, `fontFamily.ko`, `transitionTimingFunction.spring` 등으로 매핑.

---

## 5. 공통 컴포넌트 스펙

### 5.1 `Button`
- Variants: `primary`(앰버 배경 + 다크 텍스트), `ghost`(투명 + 크림 텍스트), `link`
- Size: `md`(기본) | `lg`(히어로용)
- Pill 형태(`rounded-full`), `lg`는 `px-8 py-4 text-lg`
- 우측에 옵션 아이콘 슬롯 (`w-8 h-8 rounded-full bg-black/5`)
- Hover: `scale-[1.02]` + 아이콘 `translate-x-1`, `transition` = `var(--ease-spring) var(--dur-base)`
- Active: `scale-[0.98]`

### 5.2 `Card` (Double-Bezel)
```tsx
<div className="bg-white/5 ring-1 ring-white/10 p-1.5 rounded-[var(--radius-card-outer)]">
  <div className="bg-[var(--color-bg-elevated)] shadow-[var(--shadow-card-inset)] rounded-[var(--radius-card-inner)] p-6">
    {children}
  </div>
</div>
```
- Props: `tone`(`default` | `accent`), `interactive`(hover lift)

### 5.3 `Section`
- 컨테이너 + 섹션 패딩 wrapper
- Props: `eyebrow?`, `title?`, `align?`(`left` | `center`), `as?`
- 기본 패딩 `py-[var(--section-py)]`, container `max-w-[var(--container-max)]`

### 5.4 `EyebrowTag`
- 작은 라운드 태그, `uppercase tracking-[var(--tracking-eyebrow)]`
- 색: `bg-[var(--color-accent-soft)] text-[var(--color-accent)]`

### 5.5 `GlassPillNav`
- 페이지 상단 부유 글래스 필 (`mt-4 mx-auto w-max rounded-full backdrop-blur-xl bg-white/8 border border-white/10`)
- 로고(`Third` + 작은 점) + 우측 CTA 1개

### 5.6 `Icon`
- Iconify Solar set만 사용하는 thin wrapper (`@iconify/react` + `solar:*` 프리셋)

---

## 6. 랜딩 페이지 구성

### 6.1 페이지 흐름 (위 → 아래)

1. **GlassPillNav** — 상단 부유, 로고 + "시작하기" CTA
2. **HeroSection**
   - 좌측 70%: 영문 디스플레이 + 한국어 헤드라인 + 짧은 부제 + Primary CTA
     - 예: `"Until you find your dream,"` (Cabinet Grotesk)
     - `"우리는 옆자리에 앉아 있을게요."` (Pretendard)
     - 부제: `"카페 한 켠에서 외우는 작은 카드부터, 당신의 학습 지도까지."`
   - 우측 30%: `FloatingKeywords` — 5-7개 키워드("DDD", "관계형 모델링", "Effective Java"…)가 카드 모양으로 부유 (`@keyframes float 6s`)
3. **ConceptSection** (Editorial Split 50/50)
   - 좌: 영문 이브로우 `WHY` + 헤드라인 `"학습은 실패가 아니라 순환입니다."`
   - 우: 본문 2-3 단락 — "ON_FIELD / ARCHIVE / 배경 지식" 용어를 자연스럽게 소개
4. **ThreeStepsSection** (Bento Grid, 비대칭)
   - 3개 카드: `① 꿈을 적는다` / `② 지도가 생긴다` / `③ 매일 만난다`
   - 가운데 카드만 row-span 2, 안에 `MiniCardPreview` (살아있는 데모 카드 1장 — soft schedule 라벨 `DAY_3` 등 보임)
5. **VoicesSection** (Masonry 느낌, 비대칭 4개)
   - 학습 문구 / 사용자 후기 4개를 다른 높이로 배치
   - **자연스러운 한국어 톤**, 클리셰 금지 ("혁신적인", "차세대" 사용 금지)
6. **ClosingCtaSection**
   - 풀폭 다크 + 큰 헤드라인 + Primary CTA
   - `"오늘, 첫 카드를 쓰러 가볼까요?"`
7. **Footer** — 미니멀, 카피라이트만

### 6.2 모션 규칙
- 섹션 진입 시 `IntersectionObserver` 기반 fade-up (`opacity 0 + translateY(2rem) + blur(4px)` → 정상)
- 형제 stagger: `animation-delay: calc(var(--index) * 80ms)`
- `FloatingKeywords` 카드: `float 6s ease-in-out infinite`, 카드마다 다른 지연
- 모든 transition은 `var(--ease-spring)` `var(--dur-base)`

### 6.3 카피 톤 (백엔드 ux-writing 컨벤션 준수)
- "실패", "오류", "불가능" 금지 → "쉬러", "순환", "배경 지식", "잠시 후 다시 만나요"
- 한국어 이음 자연스럽게, 명령조 금지(`~하세요` 대신 `~해볼까요?`/`~합니다`)
- `break-keep-all` + `leading-snug` 적용

---

## 7. API / Mock 골조

이번 spec에선 화면이 랜딩 1개라 실제 API 호출은 없다. 그러나 다음을 미리 잡아둔다.

### 7.1 axios 인스턴스 (`src/lib/api/client.ts`)
- `baseURL`: `import.meta.env.VITE_API_BASE_URL ?? '/api'`
- 요청 인터셉터: 향후 토큰 헤더 자리만 마련
- 응답 인터셉터: 백엔드 `{ code, message }` 에러 정규화(`code` 우선 분기)

### 7.2 Zod 스키마 (`src/lib/api/schemas/`)
백엔드 boundary 문서를 그대로 미러. 이번엔 **스키마 파일만** 작성, 실제 사용은 후속 spec에서:
- `card.ts` — `CardStatus`, `Card`, `ViewCardResponse`, `ScheduleConfig` 등
- `facade.ts` — `Concept`, `Axis`, `Topic`, `CoverageStatus`, `ProficiencyLevel`, `Material` 등
- `review.ts` — `ReviewSession`, `ReviewStateLabel`('DAY_1'|'DAY_3'|'DAY_7') 등
- `suggestion.ts` — `Suggestion`, `SuggestionsResponse`(`suggestionsAvailable`, `provider_context`)
- `material.ts` — 4개 type별 변종(`BOOK`/`COURSE`/`AI_CONVERSATION`/`WEB_RESOURCE`)

### 7.3 MSW (`src/mocks/`)
- `browser.ts`로 worker 부트, `main.tsx`에서 dev일 때만 시작
- 더미 핸들러 1개 (예: `GET /api/learning-facade` 더미 응답; 랜딩에는 미사용, 부트 검증용)

---

## 8. 라우팅

| 경로 | 컴포넌트 | 상태 |
|---|---|---|
| `/` | `LandingPage` | 활성 |
| `/study` | `placeholder` | 다음 spec에서 |
| `/map` | `placeholder` | 다음 spec에서 |
| `/archive` | `placeholder` | 다음 spec에서 |
| `*` | `NotFoundPage` | 활성 (간단한 카피만) |

---

## 9. 비기능 요구

- **타입 안정성**: `tsconfig.strict: true`, `noUncheckedIndexedAccess: true`
- **린트**: ESLint(react-x, react-dom, @typescript-eslint) + Prettier
- **접근성**: 색 대비 WCAG AA 충족, 모션 `prefers-reduced-motion` 대응(모든 부유/fade 애니메이션 비활성)
- **성능**: 폰트 `font-display: swap`, MSW는 dev only, 이미지 lazy
- **반응형**: `min-h-[100dvh]` (h-screen 금지), 모바일에서 grid → 1열

---

## 10. 명시적 비범위 (Out of Scope)

- Card / Facade / Review / AI Suggestion **실제 화면** — 각각 별도 sub-spec
- 인증/세션 (백엔드 boundary에 명세 없음, 이후 spec)
- i18n / 다국어 — Korean 고정
- 다크/라이트 토글 — v2
- 분석/트래킹
- e2e 테스트 (Vitest 셋업만)

---

## 11. 수용 기준 (Acceptance Criteria)

1. `npm run dev` → 랜딩 페이지가 `http://localhost:5173/` 에서 렌더링되고 hot-reload 동작
2. `npm run build` 통과, `npm run preview` 로 빌드 결과 확인 가능
3. `tsc --noEmit` 에러 0
4. ESLint 에러 0
5. 디자인 토큰이 `src/styles/tokens.css`에 정의되어 있고 Tailwind config가 이를 참조
6. 공통 컴포넌트 5종(Button/Card/Section/EyebrowTag/GlassPillNav)이 `src/components/` 에 존재하고 랜딩에서 1회 이상 사용
7. `FloatingKeywords` `MiniCardPreview` 두 데모 컴포넌트가 동작
8. `IntersectionObserver` 기반 fade-up + `prefers-reduced-motion` 대응
9. Zod 스키마 5개 파일이 boundary 문서 필드를 커버
10. MSW worker가 dev에서 부팅되고 콘솔에 시작 로그 출력
11. 모바일 360px ~ 데스크탑 1440px 사이 깨짐 없음

---

## 12. 후속 spec 후보 (참고만)

- **2차**: Card BC — 카드 생성/조회/노출/archive UI + 오늘의 Review 세션
- **3차**: LearningFacade — 컨셉 → 축 → 주제 지도 UI + AI suggestion
- **4차**: Materials — 자료 등록/숙련도 + Deck 자동 생성 연계
- **5차**: 인증 + 사용자 schedule-config 설정

---

## 13. 위험/주의

- **CRA 파일 제거**: 사용자 손길이 닿지 않은 템플릿이라 손실 위험은 낮지만, 명시적 확인 후 제거
- **Tailwind v4**: 안정화 됐지만 v3 대비 설정 방식 차이가 있어 plugin 호환성 1회 검증 필요
- **MSW + Vite**: worker 등록 타이밍이 main.tsx의 root.render 보다 먼저 와야 함 — async 부트 패턴 사용
- **폰트 라이선스**: Pretendard OFL, Cabinet Grotesk는 무료 옵션 확인 필요(이슈 시 Outfit으로 대체)
