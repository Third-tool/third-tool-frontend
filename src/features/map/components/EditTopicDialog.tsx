import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog } from '@/components/Dialog';
import { UnderlineInput } from '@/components/UnderlineInput';
import { InvertButton } from '@/components/InvertButton';
import { Icon } from '@/components/Icon';
import { ApiError } from '@/lib/api/client';
import { listRevisionReasons } from '@/lib/api/endpoints/facade';
import { useUpdateTopic } from '../hooks/useUpdateTopic';

interface Props {
  open: boolean;
  topicId: string;
  currentName: string;
  onClose: () => void;
}

export function EditTopicDialog({ open, topicId, currentName, onClose }: Props) {
  const [name, setName] = useState(currentName);
  const [reasonId, setReasonId] = useState<number | null>(null);
  const [inline, setInline] = useState<string | null>(null);
  const update = useUpdateTopic();

  const reasons = useQuery({
    queryKey: ['revision-reasons'],
    queryFn: listRevisionReasons,
    enabled: open,
    staleTime: Infinity,
  });

  const reset = () => {
    setName(currentName);
    setReasonId(null);
    setInline(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = () => {
    setInline(null);
    if (name.trim() === currentName) {
      close();
      return;
    }
    update.mutate(
      {
        topicId,
        payload: {
          name: name.trim(),
          revisionReasonId: reasonId,
        },
      },
      {
        onSuccess: close,
        onError: (err) => {
          if (err instanceof ApiError) {
            if (err.code === 'REVISION_REASON_NOT_FOUND') setInline('선택지를 다시 골라주세요');
            else setInline(err.message);
          } else {
            setInline('지금 다시 정리가 어려워요. 잠시 후 다시 이어가주세요');
          }
        },
      },
    );
  };

  return (
    <Dialog open={open} onClose={close} title="주제 다시 정리">
      <div className="flex flex-col gap-6">
        <UnderlineInput
          label="Topic"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />

        <div>
          <span className="mb-3 block font-mono text-[10px] uppercase tracking-[var(--tracking-mono)] text-cream-faint">
            왜 다듬나요? (안 골라도 괜찮아요)
          </span>
          <div className="flex flex-col gap-2">
            {reasons.isLoading && (
              <p className="font-mono text-[11px] text-cream-faint">선택지를 가져오는 중…</p>
            )}
            {reasons.data?.options.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setReasonId(reasonId === r.id ? null : r.id)}
                className={`flex items-center gap-3 rounded-sm border px-4 py-3 text-left transition-all ${
                  reasonId === r.id
                    ? 'border-cream bg-glass text-cream'
                    : 'border-edge text-cream-mute hover:border-cream/40 hover:text-cream'
                }`}
              >
                <span
                  className={`grid h-3 w-3 place-items-center rounded-full border ${
                    reasonId === r.id ? 'border-cream bg-cream' : 'border-edge'
                  }`}
                />
                <span>{r.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-edge pt-4">
          <p
            role="alert"
            className="font-mono text-[11px] uppercase tracking-[var(--tracking-mono)] text-red-300"
          >
            {inline ?? ' '}
          </p>
          <div className="flex items-center gap-3">
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
              disabled={update.isPending || name.trim().length === 0}
              rightIcon={<Icon name="solar:arrow-right-linear" width={16} height={16} />}
            >
              {update.isPending ? 'Saving…' : '다시 정리 저장'}
            </InvertButton>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
