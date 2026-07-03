import { useEffect, useState } from 'react';
import { Dialog } from '@/components/Dialog';
import { Button } from '@/components/Button';
import { ApiError } from '@/lib/api/client';
import { useDeleteAxisSelection } from '../hooks/useAxisSelectionMutations';
import type { AxisSelection } from '@/lib/api/schemas/axisSelection';

// product-learning-tower Story 3-6 개정. Selection 컨테이너 hard delete 2단계 confirm.
// 이슈 #11 정책: hard delete (softDelete 없음) → 자식 노드도 물리 삭제.

const CONFIRM_WORD = '삭제';

interface Props {
  open: boolean;
  onClose: () => void;
  onDeleted?: () => void;
  axisId: string;
  selection: AxisSelection | null;
}

export function AxisSelectionDeleteConfirm({
  open,
  onClose,
  onDeleted,
  axisId,
  selection,
}: Props) {
  const [confirmText, setConfirmText] = useState('');
  const [inline, setInline] = useState<string | null>(null);
  const del = useDeleteAxisSelection(axisId);

  useEffect(() => {
    if (open) {
      setConfirmText('');
      setInline(null);
    }
  }, [open, selection?.id]);

  const canDelete =
    confirmText.trim() === CONFIRM_WORD && !del.isPending && selection !== null;

  const handleError = (err: unknown) => {
    if (err instanceof ApiError && err.code === 'AXIS_SELECTION_NOT_FOUND') {
      setInline('이미 삭제된 Selection 이에요.');
    } else {
      setInline('삭제에 실패했어요. 잠시 후 다시 시도해주세요.');
    }
  };

  const submit = () => {
    if (!canDelete || !selection) return;
    setInline(null);
    del.mutate(selection.id, {
      onSuccess: () => {
        onClose();
        onDeleted?.();
      },
      onError: handleError,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} title="Selection 삭제">
      <div className="flex flex-col gap-5">
        <p className="text-sm text-cream-mute">
          <strong className="text-cream">{selection?.name ?? '이 Selection'}</strong> 을 삭제하려고 해요.
          컨테이너와 하위 챕터 노드 전체가 함께 삭제되며, 복원할 수 없어요.
        </p>

        <label className="flex flex-col gap-2">
          <span className="text-sm text-cream-mute">
            정말 삭제하려면 <strong className="text-cream">{CONFIRM_WORD}</strong> 을 입력하세요.
          </span>
          <input
            aria-label="삭제 확인 입력"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={CONFIRM_WORD}
            autoFocus
            className="rounded-2xl bg-glass px-3 py-2 text-sm text-cream outline-none ring-1 ring-edge focus:ring-cream"
          />
        </label>

        {inline && (
          <p role="alert" className="text-sm text-amber">
            {inline}
          </p>
        )}

        <div className="mt-2 flex items-center justify-end gap-3">
          <Button variant="ghost" type="button" onClick={onClose} disabled={del.isPending}>
            취소
          </Button>
          <Button variant="primary" type="button" onClick={submit} disabled={!canDelete}>
            {del.isPending ? '삭제 중…' : '삭제'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
