# FE-ADR Index

FE 관점 의사결정 기록 (Architecture Decision Records). BE ADR (`docs/adr/`) 과 병렬로 관리 · FE 어휘·구조·정책 결정만 포함.

| ID | 제목 | 상태 | 발효 |
|---|---|---|---|
| [FE-ADR001](./ADR001-terminology-roadmap-selections.md) | roadmap / selection 어휘 정책 | Accepted | FE M3 / 0.0.3v (2026-07-03) |

## 작성 규칙

- 파일명: `ADR{N}-{kebab-case-slug}.md` (3자리 zero-padding 불필요 · 향후 100개 넘으면 재검토)
- 상태: `Proposed` · `Accepted` · `Superseded` · `Rejected` 중 하나
- Superseded 시 원문은 유지하고 상단에 `**SUPERSEDED by [FE-ADRXXX](...)**` 배너 삽입
- BE ADR 과 정합 · 대응 관계가 있으면 문서 상단 "관련" 필드에 명시

## BE ADR 참조

BE 측 ADR 인덱스는 백엔드 저장소 `docs/adr/index.md` 를 참조. 최근 발효분:

- BE ADR023 — roadmap / selection 어휘 정본 (2026-07-02) — 본 FE-ADR001 원문 정본
