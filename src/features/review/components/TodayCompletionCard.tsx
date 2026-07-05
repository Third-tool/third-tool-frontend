import type { TodayStats, StreakStats } from '@/lib/api/schemas/learningDashboard';

// product-review Epic 3 Story 3-3 · M5 신설 (2026-07-22+).
// 오늘 completed/total + ratio · 조건부 배지 "N일 연속" (streak.current >= 3).
interface Props {
  today: TodayStats;
  streak: StreakStats;
}

const STREAK_BADGE_THRESHOLD = 3;

export function TodayCompletionCard({ today, streak }: Props) {
  const percent = Math.round(today.ratio * 100);
  const showStreakBadge = streak.current >= STREAK_BADGE_THRESHOLD;
  return (
    <section
      aria-label="오늘 완료율"
      className="flex flex-col gap-3 rounded-[16px] border border-edge bg-surface p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
          오늘
        </span>
        {showStreakBadge && (
          <span
            aria-label={`${streak.current}일 연속 학습`}
            className="rounded-full bg-amber-soft px-2.5 py-0.5 text-[11px] font-semibold text-amber-deep"
          >
            🔥 {streak.current}일 연속
          </span>
        )}
      </div>
      <div>
        <p className="m-0 font-serif text-3xl text-cream">
          <span aria-label={`오늘 완료 ${today.completed}`}>{today.completed}</span>
          <span aria-hidden className="mx-1 text-cream-faint">/</span>
          <span aria-label={`오늘 전체 ${today.total}`}>{today.total}</span>
        </p>
        <p className="m-0 mt-1 text-sm text-cream-mute">
          완료율 <span className="font-semibold text-amber-deep">{percent}%</span>
        </p>
      </div>
    </section>
  );
}
