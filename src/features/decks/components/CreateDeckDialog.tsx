import { useEffect, useState } from 'react';
import { Dialog } from '@/components/Dialog';
import { ApiError } from '@/lib/api/client';
import { useCreateDeck } from '../hooks/useCreateDeck';

interface Props {
  open: boolean;
  onClose: () => void;
  parentDeckId: string | null;
  parentName?: string | null;
}

export function CreateDeckDialog({ open, onClose, parentDeckId, parentName }: Props) {
  const create = useCreateDeck();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName('');
      setError(null);
    }
  }, [open]);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setError(null);
    create.mutate(
      { name: trimmed, parentDeckId },
      {
        onSuccess: () => onClose(),
        onError: (err) => {
          setError(err instanceof ApiError ? err.message : '덱 생성에 실패했어요.');
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={parentName ? `'${parentName}' 안에 하위 덱 추가` : '새 덱 만들기'}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={create.isPending}
            className="rounded-full border border-edge-strong bg-transparent px-4 py-2 text-[13px] font-medium text-cream-mute transition-colors hover:bg-paper-2 hover:text-cream disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!name.trim() || create.isPending}
            className="rounded-full border-0 bg-amber px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-amber-deep disabled:opacity-50"
          >
            {create.isPending ? '만드는 중…' : '만들기'}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-2">
        <label className="text-[11px] uppercase tracking-[0.08em] text-cream-faint">덱 이름</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
          placeholder="예: 결제 도메인 정리"
          className="rounded-[10px] border border-edge-strong bg-surface px-3.5 py-2.5 text-[14px] text-cream caret-amber outline-none focus:border-amber-line focus:shadow-[0_0_0_3px_var(--color-amber-soft)]"
        />
        {error && (
          <p role="alert" className="m-0 mt-1 text-sm text-amber-deep">
            {error}
          </p>
        )}
      </div>
    </Dialog>
  );
}
