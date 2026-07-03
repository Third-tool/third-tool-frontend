import {
  modeFromDays,
  clampRawInputDays,
  SCHEDULE_MODE_META,
  RAW_INPUT_DAYS_CAP,
} from '../modeMeta';

export interface RawInputDaysMappingHintProps {
  /**
   * 사용자가 draft 로 입력 중인 원시 일수. 저장 전 예측 UX.
   * 60일 초과 입력 시 clamp 안내 노출.
   */
  inputDays: number;
}

// M4 Story 1-3 (product-card Epic 1) · rawInputDays → LearningMode 매핑 실시간 안내.
// 저장 전 사용자가 어떤 모드로 매핑될지 예측 가능하도록 미리보기 문구·간격·noteView 표기.
// - 1~7 → MODE_7D · 8~14 → MODE_14D · 15~28 → MODE_28D · 29~60 → MODE_60D
// - 60+ → MODE_60D_CLAMPED (60일 상한 안내 · Story 1-5)
export function RawInputDaysMappingHint({ inputDays }: RawInputDaysMappingHintProps) {
  const { value: effectiveDays, wasClamped } = clampRawInputDays(inputDays);
  const mode = modeFromDays(effectiveDays);
  const meta = SCHEDULE_MODE_META[mode];

  return (
    <div
      aria-label="입력 일수 매핑 안내"
      className="rounded-[12px] border border-edge bg-paper-2 px-3 py-2.5 text-[12px] tabular-nums"
    >
      <div className="flex items-baseline gap-2">
        <span className="text-cream-faint">입력 일수</span>
        <span className="font-semibold text-cream">
          {inputDays}일{wasClamped && (
            <span className="ml-1 text-[11px] text-amber-deep">
              → {effectiveDays}일 (최대 {RAW_INPUT_DAYS_CAP}일)
            </span>
          )}
        </span>
      </div>

      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-cream-faint">예상 모드</span>
        <span className="font-semibold text-amber-deep" aria-label={`매핑 모드 ${mode}`}>
          {meta.label} ({meta.rangeLabel})
        </span>
      </div>

      <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[11px] text-cream-mute">
        <span>노출 {meta.maxView}회 · 간격 {meta.intervals.join('·')}일</span>
      </div>

      {wasClamped && (
        <p className="mt-2 text-[11px] text-amber-deep" role="note">
          v1은 최대 {RAW_INPUT_DAYS_CAP}일까지 지원돼요. 이후 필요하시면 M6+에 확장 검토 예정.
        </p>
      )}
    </div>
  );
}
