export interface SoftScheduleTimelineProps {
  intervals: number[];
  // 축 오른쪽 끝을 확장하고 싶을 때 (예: 목표 기간이 마지막 간격보다 큰 경우).
  maxDuration?: number;
}

// softScheduleIntervals(예: [1, 3, 7])를 Day 0 기준 가로 dot 타임라인으로 렌더.
// 라이브러리 미사용(순수 CSS 위치 계산) — product-user-schedule.md
// "Option A (선택) — 가로 타임라인 CSS dot" 결정.
export function SoftScheduleTimeline({
  intervals,
  maxDuration,
}: SoftScheduleTimelineProps) {
  const lastInterval = intervals[intervals.length - 1];
  if (lastInterval === undefined) return null;
  const rangeMax = Math.max(maxDuration ?? 0, lastInterval);

  return (
    <div aria-label="복습 간격 타임라인" className="w-full">
      <div className="mb-1.5 flex items-center justify-between text-[11px] text-cream-faint tabular-nums">
        <span>Day 0</span>
        <span>Day {rangeMax}</span>
      </div>
      <div className="relative h-6">
        <div
          aria-hidden
          className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-edge-strong"
        />
        <span
          aria-hidden
          className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-edge-strong bg-paper-2"
          style={{ left: '0%' }}
        />
        {intervals.map((day, i) => {
          const pos = rangeMax > 0 ? Math.min(100, (day / rangeMax) * 100) : 0;
          return (
            <span
              key={`${day}-${i}`}
              title={`복습 ${day}일차`}
              aria-label={`복습 ${day}일차`}
              className="absolute top-1/2 grid h-3 w-3 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-amber bg-amber-soft"
              style={{ left: `${pos}%` }}
            >
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-amber" />
            </span>
          );
        })}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-cream-mute tabular-nums">
        {intervals.map((day, i) => (
          <span key={`${day}-label-${i}`}>{day}일</span>
        ))}
      </div>
    </div>
  );
}
