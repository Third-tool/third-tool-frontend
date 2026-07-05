import type { LayerProgressStatus } from '@/lib/api/schemas/layer';

// product-learning-tower Epic 2 Story 2-4 재정의판 (2026-07-02).
// M5 확장 (2026-07-22+): LT E6 S6-5 · progressStatus 3-state 색상 매핑.
// axis 개수 · maxAxes(10) 근접 경고 · softDelete + progressStatus 4요소.

interface Props {
  axisCount?: number;
  maxAxes?: number;
  deletedAt?: string | null;
  progressStatus?: LayerProgressStatus;
}

const DEFAULT_MAX = 10;

// M5 · LT E6 S6-5 · Layer.progressStatus 3-state 색상 매핑.
// NOT_STARTED=회색 · IN_PROGRESS=주황 · COMPLETED=녹색
const PROGRESS_META: Record<
  LayerProgressStatus,
  { label: string; className: string; a11y: string }
> = {
  NOT_STARTED: {
    label: '아직 시작 안 함',
    className: 'bg-glass text-cream-mute',
    a11y: '진행 상태 아직 시작 안 함',
  },
  IN_PROGRESS: {
    label: '학습 중',
    className: 'bg-amber/20 text-amber-deep',
    a11y: '진행 상태 학습 중',
  },
  COMPLETED: {
    label: '완료',
    className: 'bg-emerald/20 text-emerald',
    a11y: '진행 상태 완료',
  },
};

export function LayerHeaderBadge({
  axisCount,
  maxAxes = DEFAULT_MAX,
  deletedAt,
  progressStatus,
}: Props) {
  const isDeleted = Boolean(deletedAt);
  const known = typeof axisCount === 'number';
  const isAtMax = known && (axisCount as number) >= maxAxes;
  const isNearMax = known && !isAtMax && (axisCount as number) >= maxAxes - 2;

  const axisTone = isAtMax
    ? 'bg-amber/20 text-amber'
    : isNearMax
      ? 'text-amber'
      : 'text-cream-faint';

  const progressMeta = progressStatus ? PROGRESS_META[progressStatus] : null;

  return (
    <div className="flex items-center gap-2" role="status" aria-label="Layer 요약">
      <span
        aria-label={`축 ${known ? axisCount : '알 수 없음'} 개 · 최대 ${maxAxes}`}
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${axisTone}`}
      >
        축 {known ? axisCount : '--'} / {maxAxes}
        {isAtMax && ' · 최대 도달'}
        {isNearMax && ' · 곧 최대'}
      </span>
      {progressMeta && (
        <span
          aria-label={progressMeta.a11y}
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${progressMeta.className}`}
        >
          {progressMeta.label}
        </span>
      )}
      {isDeleted && (
        <span
          aria-label="삭제됨"
          className="inline-flex items-center rounded-full bg-amber/20 px-2 py-0.5 text-xs text-amber"
        >
          삭제됨
        </span>
      )}
    </div>
  );
}
