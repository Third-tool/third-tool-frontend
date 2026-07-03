// product-card Epic 3 Story 3-1 (M4 · 2026-07-15+).
// Mode down 감지 시 자동 open 확인 다이얼로그.
// - BE dry-run API 부재 → 문구 안내만 ("카드가 SCHEDULE_EXHAUSTED로 종료될 수 있습니다").
// - 확인/취소 액션 · 확인 시 호출자가 `PATCH /user-schedule` 후속 호출.
import { Dialog } from '@/components/Dialog';
import {
  LEARNING_MODE_META,
  LEARNING_MODE_ORDER,
  type LearningMode,
} from '@/lib/api/schemas/learningMode';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fromMode: LearningMode;
  toMode: LearningMode;
  isPending?: boolean;
}

/** 두 mode 중 후자가 더 짧은 스케줄이면 true. `<ScheduleSection>` 진입 판정용. */
export function isModeDowngrade(from: LearningMode, to: LearningMode): boolean {
  return LEARNING_MODE_ORDER.indexOf(to) < LEARNING_MODE_ORDER.indexOf(from);
}

export function ModeChangeConfirmDialog({
  open,
  onClose,
  onConfirm,
  fromMode,
  toMode,
  isPending = false,
}: Props) {
  const fromLabel = LEARNING_MODE_META[fromMode].label;
  const toLabel = LEARNING_MODE_META[toMode].label;
  const toMaxView = LEARNING_MODE_META[toMode].maxView;

  return (
    <Dialog
      open={open}
      onClose={isPending ? () => undefined : onClose}
      title="학습 모드를 낮추시겠어요?"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-full border border-edge-strong bg-transparent px-4 py-2 text-[13px] font-medium text-cream-mute transition-colors hover:bg-paper-2 hover:text-cream disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            aria-label="모드 다운그레이드 확인"
            className="rounded-full border-0 bg-amber-deep px-4 py-2 text-[13px] font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? '적용 중…' : '확인 · 낮추기'}
          </button>
        </>
      }
    >
      <p
        role="alert"
        aria-label="다운그레이드 안내"
        className="m-0 text-[14px] leading-[1.6] text-cream-mute break-keep"
      >
        <span className="font-semibold text-cream">{fromLabel}</span>에서{' '}
        <span className="font-semibold text-amber-deep">{toLabel}</span>로 낮추면, 이미{' '}
        <span className="font-semibold text-cream">{toMaxView}회</span> 이상 노출된 카드는{' '}
        <span className="font-semibold text-emerald">SCHEDULE_EXHAUSTED</span>로 종료될 수 있어요.
      </p>
      <p className="m-0 mt-3 text-[13px] leading-[1.6] text-cream-faint break-keep">
        보관함에서 언제든 다시 필드로 돌릴 수 있습니다.
      </p>
    </Dialog>
  );
}
