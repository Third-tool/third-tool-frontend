import type { StreakStats } from '@/lib/api/schemas/learningDashboard';

// product-review Epic 3 Story 3-3 · M5 신설 (2026-07-22+).
// 현재 연속일 + 최장 연속일 · 아이콘 (🔥) 강조.
interface Props {
  streak: StreakStats;
}

export function CurrentStreakCard({ streak }: Props) {
  const isNewRecord = streak.current > 0 && streak.current === streak.longest;
  return (
    <section
      aria-label="연속 학습"
      className="flex flex-col gap-3 rounded-[16px] border border-edge bg-surface p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
          Streak
        </span>
        {isNewRecord && streak.current > 0 && (
          <span
            aria-label="최장 기록 갱신"
            className="rounded-full bg-emerald/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald"
          >
            최장 갱신
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span aria-hidden className="text-2xl">
          🔥
        </span>
        <p className="m-0 font-serif text-3xl text-cream">
          <span aria-label={`현재 연속 ${streak.current}일`}>{streak.current}</span>
          <span className="ml-1 text-base text-cream-mute">일</span>
        </p>
      </div>
      <p className="m-0 text-sm text-cream-mute">
        최장 <span
          aria-label={`최장 ${streak.longest}일`}
          className="font-semibold text-cream"
        >
          {streak.longest}일
        </span>
      </p>
    </section>
  );
}
