import { useEffect, useState } from 'react';
import { Icon } from '@/components/Icon';
import { ApiError } from '@/lib/api/client';
import { toastStore } from '@/lib/toast/toastQueue';
import { useMySchedule } from '../hooks/useMySchedule';
import { useSetSchedule } from '../hooks/useSetSchedule';
import { useUpdateDailyTarget } from '../hooks/useUpdateDailyTarget';
import type { ScheduleMode } from '@/lib/api/schemas/schedule';
import { SCHEDULE_MODE_META, modeFromDays } from '../modeMeta';

// M4 재편(2026-07-15+): 4옵션 (MODE_7D/14D/28D/60D · product-card Epic 1).
// SoT는 learningMode.ts · 재export된 SCHEDULE_MODE_META를 UX 편의 alias로 사용.
const MODE_DEFAULTS: Record<
  ScheduleMode,
  { label: string; range: string; intervals: number[]; maxView: number }
> = {
  MODE_7D: {
    label: SCHEDULE_MODE_META.MODE_7D.label,
    range: SCHEDULE_MODE_META.MODE_7D.rangeLabel,
    intervals: SCHEDULE_MODE_META.MODE_7D.intervals,
    maxView: SCHEDULE_MODE_META.MODE_7D.maxView,
  },
  MODE_14D: {
    label: SCHEDULE_MODE_META.MODE_14D.label,
    range: SCHEDULE_MODE_META.MODE_14D.rangeLabel,
    intervals: SCHEDULE_MODE_META.MODE_14D.intervals,
    maxView: SCHEDULE_MODE_META.MODE_14D.maxView,
  },
  MODE_28D: {
    label: SCHEDULE_MODE_META.MODE_28D.label,
    range: SCHEDULE_MODE_META.MODE_28D.rangeLabel,
    intervals: SCHEDULE_MODE_META.MODE_28D.intervals,
    maxView: SCHEDULE_MODE_META.MODE_28D.maxView,
  },
  MODE_60D: {
    label: SCHEDULE_MODE_META.MODE_60D.label,
    range: SCHEDULE_MODE_META.MODE_60D.rangeLabel,
    intervals: SCHEDULE_MODE_META.MODE_60D.intervals,
    maxView: SCHEDULE_MODE_META.MODE_60D.maxView,
  },
};

function previewMode(days: number): ScheduleMode {
  return modeFromDays(days);
}

const DAYS_MIN = 1;
const DAYS_MAX = 60;
const TARGET_MIN = 1;
const TARGET_MAX = 50;

export function ScheduleSection() {
  const schedule = useMySchedule();
  const setSched = useSetSchedule();
  const updateTarget = useUpdateDailyTarget();

  const [daysDraft, setDaysDraft] = useState<number>(14);
  const [targetDraft, setTargetDraft] = useState<number>(10);
  const [daysError, setDaysError] = useState<string | null>(null);
  const [targetError, setTargetError] = useState<string | null>(null);

  useEffect(() => {
    if (schedule.data) {
      setDaysDraft(schedule.data.schedule.rawInputDays);
      setTargetDraft(schedule.data.schedule.dailyTarget);
    }
  }, [schedule.data]);

  const current = schedule.data?.schedule;
  const isNotFound =
    schedule.isError && schedule.error instanceof ApiError && schedule.error.code === 'SCHEDULE_NOT_FOUND';

  const previewModeKey = previewMode(daysDraft);
  const previewModeMeta = MODE_DEFAULTS[previewModeKey];
  const daysChanged = current ? daysDraft !== current.rawInputDays : true;
  const targetChanged = current ? targetDraft !== current.dailyTarget : true;

  const clampDays = (v: number) =>
    Math.max(DAYS_MIN, Math.min(DAYS_MAX, Math.round(v) || DAYS_MIN));
  const clampTarget = (v: number) =>
    Math.max(TARGET_MIN, Math.min(TARGET_MAX, Math.round(v) || TARGET_MIN));

  const onSaveDays = () => {
    setDaysError(null);
    if (!daysChanged) return;
    setSched.mutate(daysDraft, {
      onSuccess: (res) => {
        toastStore.push({
          message: `학습 모드가 ${res.schedule.modeDisplayName}(으)로 설정됐어요.`,
          tone: 'amber',
        });
      },
      onError: (err) => {
        setDaysError(err instanceof ApiError ? err.message : '저장에 실패했어요.');
      },
    });
  };

  const onSaveTarget = () => {
    setTargetError(null);
    if (!targetChanged) return;
    updateTarget.mutate(targetDraft, {
      onSuccess: (res) => {
        toastStore.push({
          message: `오늘 목표를 ${res.schedule.dailyTarget}장으로 바꿨어요.`,
          tone: 'cream',
        });
      },
      onError: (err) => {
        setTargetError(err instanceof ApiError ? err.message : '저장에 실패했어요.');
      },
    });
  };

  return (
    <div
      className="mt-10 rounded-[20px] border border-edge bg-surface p-[26px]"
      style={{ animation: 'fadeInUp .5s var(--ease-spring) .2s both' }}
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-amber-soft text-amber-deep">
            <Icon name="solar:calendar-linear" width={17} height={17} />
          </span>
          <span className="font-serif text-[19px] font-medium text-cream">학습 설정</span>
        </div>
        {current && (
          <span className="rounded-full bg-paper-2 px-2.5 py-1 text-[11px] font-semibold text-cream-mute">
            현재 {current.mappedMode}
          </span>
        )}
      </div>

      {schedule.isLoading && (
        <p className="m-0 text-[13px] text-cream-faint">학습 설정을 불러오는 중…</p>
      )}

      {schedule.isError && !isNotFound && (
        <p className="m-0 text-[13px] text-amber-deep">
          학습 설정을 불러오지 못했어요.
        </p>
      )}

      {(current || isNotFound) && (
        <>
          {current && (
            <div className="mb-7 rounded-[14px] border border-edge bg-paper-2 px-5 py-4">
              <div className="mb-1.5 flex items-baseline gap-2">
                <span className="font-serif text-[20px] font-medium text-cream">
                  {current.modeDisplayName}
                </span>
                <span className="text-[12px] text-cream-faint">{current.mappedMode}</span>
              </div>
              <div className="text-[12.5px] text-cream-mute break-keep">
                노출 {current.maxView}회 · 복습 간격{' '}
                {current.softScheduleIntervals.join('·')}일 · 오늘 목표 {current.dailyTarget}장
              </div>
            </div>
          )}

          {isNotFound && (
            <p className="m-0 mb-5 text-[13px] text-cream-mute break-keep">
              아직 학습 설정이 없어요. 목표 기간을 정해 첫 설정을 저장해주세요.
            </p>
          )}

          <div className="mb-7">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <span className="text-[11px] uppercase tracking-[0.08em] text-cream-faint">
                목표 기간
              </span>
              <span className="text-[12px] text-cream-faint">{DAYS_MIN}~{DAYS_MAX}일</span>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={DAYS_MIN}
                max={DAYS_MAX}
                value={daysDraft}
                onChange={(e) => {
                  setDaysError(null);
                  setDaysDraft(clampDays(Number(e.target.value)));
                }}
                className="flex-1 accent-amber"
                aria-label="목표 기간 (일)"
              />
              <div className="flex items-baseline gap-1.5">
                <input
                  type="number"
                  min={DAYS_MIN}
                  max={DAYS_MAX}
                  value={daysDraft}
                  onChange={(e) => {
                    setDaysError(null);
                    setDaysDraft(clampDays(Number(e.target.value)));
                  }}
                  className="w-[68px] rounded-[8px] border border-edge-strong bg-surface px-2 py-1.5 text-center font-serif text-[18px] tabular-nums text-cream caret-amber outline-none focus:border-amber-line"
                />
                <span className="text-[13px] text-cream-faint">일</span>
              </div>
            </div>
            <p className="m-0 mt-2.5 text-[12.5px] text-cream-mute break-keep">
              {previewModeMeta.range} → <span className="font-semibold text-amber-deep">{previewModeMeta.label}</span> ({previewModeKey}) · 노출 {previewModeMeta.maxView}회 · 간격 {previewModeMeta.intervals.join('·')}일
            </p>
            <div className="mt-3 flex items-center justify-end gap-3">
              {daysError && (
                <span role="alert" className="text-[12px] text-amber-deep">
                  {daysError}
                </span>
              )}
              <button
                type="button"
                onClick={onSaveDays}
                disabled={!daysChanged || setSched.isPending}
                className="inline-flex items-center gap-2 rounded-full border-0 bg-amber px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-amber-deep disabled:cursor-not-allowed disabled:opacity-50"
              >
                {setSched.isPending ? '저장 중…' : '저장'}
              </button>
            </div>
          </div>

          <div className="border-t border-edge pt-6">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <span className="text-[11px] uppercase tracking-[0.08em] text-cream-faint">
                오늘 목표
              </span>
              <span className="text-[12px] text-cream-faint">{TARGET_MIN}~{TARGET_MAX}장</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-baseline gap-1.5">
                <input
                  type="number"
                  min={TARGET_MIN}
                  max={TARGET_MAX}
                  value={targetDraft}
                  onChange={(e) => {
                    setTargetError(null);
                    setTargetDraft(clampTarget(Number(e.target.value)));
                  }}
                  className="w-[68px] rounded-[8px] border border-edge-strong bg-surface px-2 py-1.5 text-center font-serif text-[18px] tabular-nums text-cream caret-amber outline-none focus:border-amber-line"
                />
                <span className="text-[13px] text-cream-faint">장</span>
              </div>
              <p className="m-0 ml-2 flex-1 text-[12.5px] text-cream-mute break-keep">
                매일 복습 세션에서 보여줄 카드 수예요.
              </p>
            </div>
            <div className="mt-3 flex items-center justify-end gap-3">
              {targetError && (
                <span role="alert" className="text-[12px] text-amber-deep">
                  {targetError}
                </span>
              )}
              <button
                type="button"
                onClick={onSaveTarget}
                disabled={!targetChanged || updateTarget.isPending || isNotFound}
                className="inline-flex items-center gap-2 rounded-full border border-edge-strong bg-transparent px-4 py-2 text-[13px] font-medium text-cream-mute transition-colors hover:bg-paper-2 hover:text-cream disabled:cursor-not-allowed disabled:opacity-50"
                title={isNotFound ? '먼저 목표 기간을 저장해주세요' : undefined}
              >
                {updateTarget.isPending ? '저장 중…' : '저장'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
