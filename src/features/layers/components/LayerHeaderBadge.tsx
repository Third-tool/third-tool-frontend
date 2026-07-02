// product-learning-tower Epic 2 Story 2-4 재정의판 (2026-07-02).
// 원안 <LayerProgressBadge> (progress % 표시)는 v2 이관 — BE progress 필드 미도입.
// 대신 axis 개수 · maxAxes(10) 근접 경고 · softDelete 표기 3요소만 유지.

interface Props {
  axisCount?: number;
  maxAxes?: number;
  deletedAt?: string | null;
}

const DEFAULT_MAX = 10;

export function LayerHeaderBadge({
  axisCount,
  maxAxes = DEFAULT_MAX,
  deletedAt,
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
