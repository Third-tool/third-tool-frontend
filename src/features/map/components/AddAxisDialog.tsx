import { useState } from 'react';
import { Dialog } from '@/components/Dialog';
import { UnderlineInput } from '@/components/UnderlineInput';
import { InvertButton } from '@/components/InvertButton';
import { Icon } from '@/components/Icon';
import { ApiError } from '@/lib/api/client';
import { useAddAxis } from '../hooks/useAddAxis';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AddAxisDialog({ open, onClose }: Props) {
  const [direct, setDirect] = useState('');
  const [inline, setInline] = useState<string | null>(null);
  const add = useAddAxis();

  const reset = () => {
    setDirect('');
    setInline(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const onError = (err: unknown) => {
    if (err instanceof ApiError) {
      if (err.code === 'LEARNING_AXIS_DUPLICATE_NAME')
        setInline('같은 이름의 축이 이미 있어요. 다른 이름으로 이어가볼까요?');
      else if (err.code === 'LEARNING_AXIS_NAME_BLANK') setInline('축 이름을 적어주세요');
      else setInline('지금 추가가 어려워요. 잠시 후 다시 이어가주세요');
    } else {
      setInline('지금 추가가 어려워요. 잠시 후 다시 이어가주세요');
    }
  };

  const submit = () => {
    setInline(null);
    add.mutate(direct.trim(), { onSuccess: close, onError });
  };

  return (
    <Dialog open={open} onClose={close} title="새 축 추가">
      <div className="flex flex-col gap-6">
        <UnderlineInput
          value={direct}
          onChange={(e) => setDirect(e.target.value)}
          placeholder="예: 데이터 모델링"
          aria-label="axis name"
          autoFocus
        />

        <div className="flex items-center justify-between gap-3 border-t border-edge pt-4">
          <p
            role="alert"
            className="font-mono text-[11px] uppercase tracking-[var(--tracking-mono)] text-red-300"
          >
            {inline ?? ' '}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={close}
              className="font-mono text-[11px] uppercase tracking-[var(--tracking-mono)] text-cream-mute transition-colors hover:text-cream"
            >
              취소
            </button>
            <InvertButton
              size="md"
              onClick={submit}
              disabled={add.isPending || direct.trim().length === 0}
              rightIcon={<Icon name="solar:arrow-right-linear" width={16} height={16} />}
            >
              {add.isPending ? 'Saving…' : '추가'}
            </InvertButton>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
