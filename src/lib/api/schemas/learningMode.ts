import { z } from 'zod';

// product-card Epic 1 (M4 · 2026-07-15+) — LearningMode 4옵션 재편.
// - 기존 3옵션 (MODE_10D/20D/30D · TEN/TWENTY/THIRTY_DAYS) 폐기.
// - Fixed interval ladder [1, 3, 7, 14, 28, 60] 확립.
// - BE 이슈 #21 대응 (LearningModeMappingPolicy 재작성).
// - v1 상한 60일 · raw_input_days > 60 시 MODE_60D_CLAMPED 정보성 응답.
// (참조: `workflows/fe/fe-workspectrum/sdd/in-progress/product-card.md` Epic 1)

// ============================================================
// LearningMode enum · Source of Truth
// ============================================================
export const LearningModeSchema = z.enum([
  'MODE_7D',
  'MODE_14D',
  'MODE_28D',
  'MODE_60D',
]);
export type LearningMode = z.infer<typeof LearningModeSchema>;

// ============================================================
// Meta · label · range · intervals · maxView 매핑 (BE 정책 스냅샷)
// ============================================================
export interface LearningModeMeta {
  label: string;
  rangeLabel: string;
  minDays: number;
  maxDays: number;
  intervals: number[];
  maxView: number;
}

export const LEARNING_MODE_META: Record<LearningMode, LearningModeMeta> = {
  MODE_7D: {
    label: '집중 학습 모드',
    rangeLabel: '1~7일',
    minDays: 1,
    maxDays: 7,
    intervals: [1, 3, 7],
    maxView: 3,
  },
  MODE_14D: {
    label: '단기 학습 모드',
    rangeLabel: '8~14일',
    minDays: 8,
    maxDays: 14,
    intervals: [1, 3, 7, 14],
    maxView: 4,
  },
  MODE_28D: {
    label: '중기 학습 모드',
    rangeLabel: '15~28일',
    minDays: 15,
    maxDays: 28,
    intervals: [1, 3, 7, 14, 28],
    maxView: 5,
  },
  MODE_60D: {
    label: '장기 학습 모드',
    rangeLabel: '29~60일',
    minDays: 29,
    maxDays: 60,
    intervals: [1, 3, 7, 14, 28, 60],
    maxView: 6,
  },
};

export const LEARNING_MODE_ORDER: LearningMode[] = [
  'MODE_7D',
  'MODE_14D',
  'MODE_28D',
  'MODE_60D',
];

// raw_input_days 상한 (BE 정책 · Story 1-5 clamp 기준)
export const RAW_INPUT_DAYS_CAP = 60;
export const RAW_INPUT_DAYS_MIN = 1;

/**
 * raw_input_days → LearningMode 매핑.
 * BE `LearningModeMappingPolicy.map(inputDays)` 스냅샷.
 * - 1~7 → MODE_7D
 * - 8~14 → MODE_14D
 * - 15~28 → MODE_28D
 * - 29~60 → MODE_60D
 * - 60+ → MODE_60D (clamp 처리 · 호출자가 상한 안내 UX 담당)
 */
export function modeFromDays(inputDays: number): LearningMode {
  if (inputDays <= 7) return 'MODE_7D';
  if (inputDays <= 14) return 'MODE_14D';
  if (inputDays <= 28) return 'MODE_28D';
  return 'MODE_60D';
}

/**
 * raw_input_days > 60 이면 60으로 clamp + `wasClamped=true`.
 * 정보성 응답 UX용 (Story 1-5).
 */
export function clampRawInputDays(inputDays: number): {
  value: number;
  wasClamped: boolean;
} {
  if (inputDays > RAW_INPUT_DAYS_CAP) {
    return { value: RAW_INPUT_DAYS_CAP, wasClamped: true };
  }
  if (inputDays < RAW_INPUT_DAYS_MIN) {
    return { value: RAW_INPUT_DAYS_MIN, wasClamped: false };
  }
  return { value: inputDays, wasClamped: false };
}
