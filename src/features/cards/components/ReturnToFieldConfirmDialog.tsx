// product-card Epic 3 Story 3-2 (M4 · 2026-07-15+).
// [필드로 되돌리기] 액션 확인 다이얼로그.
// - fresh 재시작 안내: createdMode가 사용자 현재 mode로 갱신됨 (Card.returnToField() BE 로직 미러링).
// - 확인 시 호출자가 `POST /cards/{id}/return-to-field` 호출.
import { Dialog } from '@/components/Dialog';
import {
  LEARNING_MODE_META,
  type LearningMode,
} from '@/lib/api/schemas/learningMode';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  previousCreatedMode: LearningMode | null;
  currentUserMode: LearningMode;
  isPending?: boolean;
}

export function ReturnToFieldConfirmDialog({
  open,
  onClose,
  onConfirm,
  previousCreatedMode,
  currentUserMode,
  isPending = false,
}: Props) {
  const currentLabel = LEARNING_MODE_META[currentUserMode].label;
  const currentMaxView = LEARNING_MODE_META[currentUserMode].maxView;
  const currentIntervals = LEARNING_MODE_META[currentUserMode].intervals;
  const isModeShift =
    previousCreatedMode !== null && previousCreatedMode !== currentUserMode;

  return (
    <Dialog
      open={open}
      onClose={isPending ? () => undefined : onClose}
      title="다시 필드로 이어가시겠어요?"
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
            aria-label="필드 복귀 확인"
            className="rounded-full border-0 bg-amber px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-amber-deep disabled:opacity-50"
          >
            {isPending ? '되돌리는 중…' : '확인 · 새 사이클'}
          </button>
        </>
      }
    >
      <p
        role="alert"
        aria-label="fresh 재시작 안내"
        className="m-0 text-[14px] leading-[1.6] text-cream-mute break-keep"
      >
        이 카드의 <span className="font-semibold text-cream">노출 이력이 리셋</span>되고, 스케줄이{' '}
        <span className="font-semibold text-amber-deep">{currentLabel}</span>({currentUserMode})로{' '}
        <span className="font-semibold text-cream">새로 시작</span>돼요.
      </p>
      <p className="m-0 mt-3 text-[13px] leading-[1.6] text-cream-faint break-keep">
        새 사이클: 노출 {currentMaxView}회 · 간격 {currentIntervals.join('·')}일.
      </p>
      {isModeShift && previousCreatedMode && (
        <p
          aria-label="createdMode 갱신 안내"
          className="m-0 mt-3 rounded-[10px] bg-amber-soft/40 px-3 py-2 text-[12.5px] leading-[1.6] text-amber-deep break-keep"
        >
          이전 생성 모드({LEARNING_MODE_META[previousCreatedMode].label})는 유지되지 않고, 현재
          사용자 모드로 <span className="font-semibold">교체</span>됩니다.
        </p>
      )}
    </Dialog>
  );
}
