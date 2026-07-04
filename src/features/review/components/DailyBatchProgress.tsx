import {
  batchViewedCount,
  batchTotalCount,
  type DailyLearningBatch,
} from '@/lib/api/schemas/dailyLearningBatch';

// product-review (FE) Epic 1 Story 1-3 · M5 신설 (2026-07-22+).
// completed/total + progress bar · 예상 완료 시간 (30초/card 하드코딩 · v2 튜닝 대상 · DF-4).
interface Props {
  batch: DailyLearningBatch;
}

const ESTIMATED_SECONDS_PER_CARD = 30;

export function DailyBatchProgress({ batch }: Props) {
  const viewed = batchViewedCount(batch);
  const total = batchTotalCount(batch);
  const percent = total === 0 ? 0 : Math.round((viewed / total) * 100);
  const remainingSec = (total - viewed) * ESTIMATED_SECONDS_PER_CARD;
  const remainingMin = Math.max(1, Math.round(remainingSec / 60));

  return (
    <section
      aria-label="오늘 batch 진행률"
      className="flex flex-col gap-3 rounded-[16px] border border-edge bg-surface p-5"
    >
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <span className="text-[11px] uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
            오늘 진행률
          </span>
          <p className="m-0 mt-1 font-serif text-2xl text-cream">
            <span aria-label={`완료 ${viewed}`}>{viewed}</span>
            <span aria-hidden className="mx-1 text-cream-faint">/</span>
            <span aria-label={`전체 ${total}`}>{total}</span>
            <span className="ml-2 text-base text-cream-mute">({percent}%)</span>
          </p>
        </div>
        {total > viewed && (
          <p
            className="m-0 text-xs text-cream-mute"
            aria-label={`남은 예상 시간 ${remainingMin}분`}
          >
            남은 예상 <span className="font-semibold text-amber-deep">{remainingMin}분</span>
          </p>
        )}
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={viewed}
        className="h-2 w-full overflow-hidden rounded-full bg-paper-2"
      >
        <div
          className="h-full rounded-full bg-amber transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </section>
  );
}
