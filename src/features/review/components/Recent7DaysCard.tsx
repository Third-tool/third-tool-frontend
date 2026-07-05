import type { Recent7DaysStats } from '@/lib/api/schemas/learningDashboard';

// product-review Epic 3 Story 3-3 · M5 신설 (2026-07-22+).
// 최근 7일 bar chart · hover 시 tooltip (dev tool 관찰 baseline · v2 튜닝 대상).
// perfect clear 일수 + 평균 완료율.
interface Props {
  recent7Days: Recent7DaysStats;
}

const DAY_OFFSET_LABEL = ['6일 전', '5일 전', '4일 전', '3일 전', '그제', '어제', '오늘'];

export function Recent7DaysCard({ recent7Days }: Props) {
  const avgPercent = Math.round(recent7Days.avgCompletionRatio * 100);
  return (
    <section
      aria-label="최근 7일"
      className="flex flex-col gap-4 rounded-[16px] border border-edge bg-surface p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
          최근 7일
        </span>
        <span
          aria-label={`완벽 clear ${recent7Days.perfectClearDays}일`}
          className="text-[11px] text-cream-faint"
        >
          완벽 clear {recent7Days.perfectClearDays}일
        </span>
      </div>
      <p className="m-0 font-serif text-2xl text-cream">
        평균 <span className="font-semibold text-amber-deep">{avgPercent}%</span>
      </p>
      <div
        role="img"
        aria-label={`최근 7일 완료율 차트 · 평균 ${avgPercent}%`}
        className="flex items-end justify-between gap-1.5"
      >
        {recent7Days.dailyRatios.map((ratio, i) => {
          const percent = Math.round(ratio * 100);
          const label = DAY_OFFSET_LABEL[i] ?? `${6 - i}일 전`;
          return (
            <div
              key={i}
              className="flex flex-1 flex-col items-center gap-1"
              title={`${label}: ${percent}%`}
            >
              <div className="flex h-16 w-full items-end">
                <div
                  className={
                    ratio >= 1
                      ? 'w-full rounded-t bg-emerald transition-all'
                      : 'w-full rounded-t bg-amber transition-all'
                  }
                  style={{ height: `${Math.max(4, percent)}%` }}
                  aria-label={`${label} ${percent}%`}
                />
              </div>
              <span className="text-[10px] text-cream-faint">
                {i === 6 ? '오늘' : ''}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
