// product-card Epic 2 Story 2-3 (M4 · 2026-07-15+).
// 3-reason 색상 매핑:
//   MANUAL             = 회색 (사용자 명시 · 감정 중립)
//   SCHEDULE_EXHAUSTED = 녹색 (정상 소진 · 성취)
//   MODE_DOWNGRADED    = 주황 (사용자 mode 조정 · 주의)
import type { ArchiveReason } from '@/lib/api/schemas/card';

interface Props {
  reason: ArchiveReason;
}

const META: Record<ArchiveReason, { label: string; className: string; a11y: string }> = {
  MANUAL: {
    label: '수동 아카이브',
    className: 'bg-glass text-cream-mute',
    a11y: '수동 아카이브',
  },
  SCHEDULE_EXHAUSTED: {
    label: '학습 완료',
    className: 'bg-emerald/20 text-emerald',
    a11y: '학습 완료 · 정상 소진',
  },
  MODE_DOWNGRADED: {
    label: '스케줄 조정 소진',
    className: 'bg-amber/20 text-amber',
    a11y: '스케줄 다운그레이드로 소진',
  },
};

export function ArchiveReasonBadge({ reason }: Props) {
  const m = META[reason];
  return (
    <span
      role="status"
      aria-label={m.a11y}
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${m.className}`}
    >
      {m.label}
    </span>
  );
}
