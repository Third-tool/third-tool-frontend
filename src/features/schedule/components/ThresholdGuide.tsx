import type { ScheduleMode } from '@/lib/api/schemas/schedule';
import { SCHEDULE_MODE_META, SCHEDULE_MODE_ORDER } from '../modeMeta';

export interface ThresholdGuideProps {
  currentMode?: ScheduleMode;
}

export function ThresholdGuide({ currentMode }: ThresholdGuideProps) {
  return (
    <section
      aria-label="학습 모드 매핑 기준"
      className="rounded-[14px] border border-edge bg-paper-2 p-4"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-[11px] uppercase tracking-[0.08em] text-cream-faint">
          매핑 기준
        </span>
        <span className="text-[11px] text-cream-faint">
          입력 일수에 따라 자동으로 모드가 결정돼요
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {SCHEDULE_MODE_ORDER.map((mode) => {
          const meta = SCHEDULE_MODE_META[mode];
          const active = mode === currentMode;
          return (
            <div
              key={mode}
              aria-current={active ? 'true' : undefined}
              className={`rounded-[10px] border px-3 py-2.5 transition-colors ${
                active
                  ? 'border-amber bg-amber-soft'
                  : 'border-edge bg-surface'
              }`}
            >
              <div
                className={`text-[12.5px] font-semibold tabular-nums ${
                  active ? 'text-amber-deep' : 'text-cream'
                }`}
              >
                {meta.rangeLabel}
              </div>
              <div
                className={`text-[11.5px] ${
                  active ? 'text-amber-deep' : 'text-cream-mute'
                }`}
              >
                {meta.label}
              </div>
              <div className="mt-1 text-[11px] text-cream-faint">
                노출 {meta.maxView}회 · 간격 {meta.intervals.join('·')}일
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
