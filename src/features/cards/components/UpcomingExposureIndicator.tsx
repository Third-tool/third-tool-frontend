// product-card Epic 2 Story 2-4 (M4 · 2026-07-15+).
// 다음 노출 D일 계산 · createdMode.intervals × 진행 인덱스 우선 (스냅샷 정합).
// 계산 로직은 `card.ts` `nextExposureDays()` (테스트 커버리지 공유).
import { nextExposureDays } from '@/lib/api/schemas/card';
import type { EffectiveMax } from '@/lib/api/schemas/card';
import type { LearningMode } from '@/lib/api/schemas/learningMode';

interface Props {
  viewCount: number;
  createdMode: LearningMode | null;
  effectiveMax: EffectiveMax;
}

export function UpcomingExposureIndicator({
  viewCount,
  createdMode,
  effectiveMax,
}: Props) {
  const days = nextExposureDays({ viewCount, createdMode, effectiveMax });

  if (days === null) {
    return (
      <span
        role="status"
        aria-label="다음 노출 없음 · 학습 소진"
        className="inline-flex items-center rounded-full bg-emerald/10 px-3 py-1 text-xs text-emerald"
      >
        노출 소진
      </span>
    );
  }

  return (
    <span
      role="status"
      aria-label={`다음 노출 ${days}일 후`}
      className="inline-flex items-center rounded-full bg-glass px-3 py-1 text-xs text-cream-mute"
    >
      다음 노출 {days}일 후
    </span>
  );
}
