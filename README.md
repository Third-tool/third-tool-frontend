# third-tool-frontend

카페 무드의 암기형 학습 웹앱. 꿈을 찾기 전까지 곁에서 도와주는 도구.

## 스택
Vite + React 18 + TypeScript + Tailwind v4 + TanStack Query + Zod + MSW

## 개발
```bash
npm install
npm run dev      # http://localhost:5173
npm run test     # Vitest
npm run lint
npm run build
```

## 디렉토리
- `src/app` — 진입점/라우터
- `src/components` — 도메인 무관 UI primitives
- `src/features` — 도메인별 화면 (`landing/` 등)
- `src/lib/api` — axios 인스턴스 + Zod 스키마
- `src/lib/motion` — easings + 훅
- `src/mocks` — MSW 핸들러
- `src/styles` — 디자인 토큰 + 글로벌
- `docs/superpowers/specs|plans` — spec/plan 문서

## 백엔드 boundary
`workflows/backend-boundary/` 참고.
