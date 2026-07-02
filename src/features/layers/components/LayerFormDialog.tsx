import { useEffect, useState } from 'react';
import { Dialog } from '@/components/Dialog';
import { Button } from '@/components/Button';
import { ApiError } from '@/lib/api/client';
import { useCreateLayer, useUpdateLayer } from '../hooks/useLayerMutations';
import type { Layer } from '@/lib/api/schemas/layer';

interface Props {
  open: boolean;
  onClose: () => void;
  layer?: Layer;
}

const MAX_NAME = 50;

export function LayerFormDialog({ open, onClose, layer }: Props) {
  const isEdit = Boolean(layer);
  const [name, setName] = useState('');
  const [inline, setInline] = useState<string | null>(null);
  const create = useCreateLayer();
  const update = useUpdateLayer(layer?.layerId ?? '');
  const mutation = isEdit ? update : create;

  useEffect(() => {
    if (open) {
      setName(layer?.name ?? '');
      setInline(null);
    }
  }, [open, layer]);

  const close = () => {
    onClose();
  };

  const trimmed = name.trim();
  const tooLong = trimmed.length > MAX_NAME;
  const canSubmit = trimmed.length > 0 && !tooLong && !mutation.isPending;

  const handleError = (err: unknown) => {
    if (err instanceof ApiError) {
      if (err.code === 'LAYER_NAME_DUPLICATE') {
        setInline('같은 이름의 Layer 가 이미 있어요. 다른 이름을 써주세요.');
      } else if (err.code === 'C001') {
        setInline(`Layer 이름은 1~${MAX_NAME}자 사이여야 해요.`);
      } else {
        setInline('저장에 실패했어요. 잠시 후 다시 시도해주세요.');
      }
    } else {
      setInline('저장에 실패했어요. 잠시 후 다시 시도해주세요.');
    }
  };

  const submit = () => {
    if (!canSubmit) return;
    setInline(null);
    if (isEdit) {
      update.mutate({ name: trimmed }, { onSuccess: close, onError: handleError });
    } else {
      create.mutate({ name: trimmed }, { onSuccess: close, onError: handleError });
    }
  };

  return (
    <Dialog open={open} onClose={close} title={isEdit ? 'Layer 이름 변경' : '새 Layer 추가'}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex flex-col gap-4"
      >
        <label className="flex flex-col gap-2">
          <span className="text-sm text-cream-mute">Layer 이름</span>
          <input
            aria-label="Layer 이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={MAX_NAME + 10}
            autoFocus
            placeholder="예: 시스템 설계"
            className="rounded-2xl bg-glass px-3 py-2 text-sm text-cream outline-none ring-1 ring-edge focus:ring-cream"
          />
          <span className="text-xs text-cream-faint">
            {trimmed.length}/{MAX_NAME}
          </span>
        </label>

        {tooLong && (
          <p role="alert" className="text-sm text-amber">
            Layer 이름은 {MAX_NAME}자를 넘을 수 없어요.
          </p>
        )}
        {inline && (
          <p role="alert" className="text-sm text-amber">
            {inline}
          </p>
        )}

        <div className="mt-2 flex items-center justify-end gap-3">
          <Button variant="ghost" type="button" onClick={close} disabled={mutation.isPending}>
            취소
          </Button>
          <Button variant="primary" type="submit" disabled={!canSubmit}>
            {mutation.isPending ? '저장 중…' : isEdit ? '변경' : '추가'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
