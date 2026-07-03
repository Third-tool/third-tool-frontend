// M4 재편(2026-07-15+): LearningMode 4옵션 (MODE_7D/14D/28D/60D · product-card Epic 1).
// 기존 3옵션 (MODE_10D/20D/30D) SUPERSEDED · Source of truth = learningMode.ts.
//
// 본 파일은 UX 편의를 위해 SoT를 재export + 기존 이름(SCHEDULE_MODE_*)을 alias로 유지.
// BE 정책 변경 시 learningMode.ts를 갱신하고 여기는 재export만 유지.

export {
  LEARNING_MODE_META as SCHEDULE_MODE_META,
  LEARNING_MODE_ORDER as SCHEDULE_MODE_ORDER,
  modeFromDays,
  clampRawInputDays,
  RAW_INPUT_DAYS_CAP,
  RAW_INPUT_DAYS_MIN,
  type LearningMode as ScheduleMode,
  type LearningModeMeta as ScheduleModeMeta,
} from '@/lib/api/schemas/learningMode';
