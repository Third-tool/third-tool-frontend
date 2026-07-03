// product-card Epic 2 Story 2-2 (M4 · 2026-07-15+).
// createdMode + effectiveMax 두 값을 병기 표기.
// - 정상: createdMode = effectiveMax.mode → 단일 표기.
// - 다운그레이드: createdMode > effectiveMax.mode → 두 값 병기 + 시각 대비 (주황 강조).
import {
  LEARNING_MODE_META,
  LEARNING_MODE_ORDER,
  type LearningMode,
} from '@/lib/api/schemas/learningMode';
import type { EffectiveMax } from '@/lib/api/schemas/card';

interface Props {
  createdMode: LearningMode | null;
  effectiveMax: EffectiveMax;
}

function rank(mode: LearningMode): number {
  return LEARNING_MODE_ORDER.indexOf(mode);
}

export function CardScheduleBadge({ createdMode, effectiveMax }: Props) {
  const effLabel = LEARNING_MODE_META[effectiveMax.mode].label;
  const effRange = LEARNING_MODE_META[effectiveMax.mode].rangeLabel;

  if (!createdMode) {
    return (
      <span
        role="status"
        aria-label={`유효 스케줄 ${effectiveMax.mode}`}
        className="inline-flex items-center rounded-full bg-glass px-3 py-1 text-xs text-cream-mute"
      >
        {effLabel} · {effRange}
      </span>
    );
  }

  const isDowngraded = rank(createdMode) > rank(effectiveMax.mode);

  if (!isDowngraded) {
    return (
      <span
        role="status"
        aria-label={`스케줄 ${createdMode}`}
        className="inline-flex items-center rounded-full bg-glass px-3 py-1 text-xs text-cream-mute"
      >
        {effLabel} · {effRange}
      </span>
    );
  }

  const createdLabel = LEARNING_MODE_META[createdMode].label;
  return (
    <span
      role="status"
      aria-label={`스케줄 다운그레이드 ${createdMode} → ${effectiveMax.mode}`}
      className="inline-flex items-center gap-2 rounded-full bg-amber/10 px-3 py-1 text-xs"
    >
      <span aria-hidden="true" className="text-cream-faint line-through">
        {createdLabel}
      </span>
      <span aria-hidden="true" className="text-cream-faint">
        →
      </span>
      <span aria-hidden="true" className="text-amber">
        {effLabel} · {effRange}
      </span>
    </span>
  );
}
