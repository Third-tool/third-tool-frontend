import { useEffect, useState } from 'react';
import { Dialog } from '@/components/Dialog';
import { Button } from '@/components/Button';
import { ApiError } from '@/lib/api/client';
import { useDeleteLayer } from '../hooks/useLayerMutations';
import type { Layer } from '@/lib/api/schemas/layer';

interface Props {
  open: boolean;
  onClose: () => void;
  layer: Layer | null;
  // 삭제 성공 시에만 호출. 취소·에러엔 부르지 않는다. (LayerDetailPage → /layers navigate 용)
  onDeleted?: () => void;
}

const CONFIRM_WORD = '삭제';

export function LayerConfirmDeleteDialog({ open, onClose, layer, onDeleted }: Props) {
  const [confirmText, setConfirmText] = useState('');
  const [inline, setInline] = useState<string | null>(null);
  const del = useDeleteLayer();

  useEffect(() => {
    if (open) {
      setConfirmText('');
      setInline(null);
    }
  }, [open, layer?.layerId]);

  const canDelete = confirmText.trim() === CONFIRM_WORD && !del.isPending && layer !== null;

  const handleError = (err: unknown) => {
    if (err instanceof ApiError) {
      if (err.code === 'LAYER_HAS_ACTIVE_AXES') {
        setInline(
          '이 Layer 에 아직 축이 남아 있어요. 축을 다른 Layer 로 옮긴 뒤 다시 시도해주세요.',
        );
      } else if (err.code === 'LAYER_NOT_FOUND') {
        setInline('이미 삭제된 Layer 예요.');
      } else {
        setInline('삭제에 실패했어요. 잠시 후 다시 시도해주세요.');
      }
    } else {
      setInline('삭제에 실패했어요. 잠시 후 다시 시도해주세요.');
    }
  };

  const submit = () => {
    if (!canDelete || !layer) return;
    setInline(null);
    del.mutate(layer.layerId, {
      onSuccess: () => {
        onClose();
        onDeleted?.();
      },
      onError: handleError,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} title="Layer 삭제">
      <div className="flex flex-col gap-5">
        <p className="text-sm text-cream-mute">
          <strong className="text-cream">{layer?.name ?? '이 Layer'}</strong> 를 삭제하려고 해요.
          삭제된 Layer 는 복원할 수 없어요.
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
