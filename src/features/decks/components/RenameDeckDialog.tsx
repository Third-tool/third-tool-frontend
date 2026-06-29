import { useEffect, useState } from 'react';
import { Dialog } from '@/components/Dialog';
import { ApiError } from '@/lib/api/client';
import { useRenameDeck } from '../hooks/useRenameDeck';

interface Props {
  open: boolean;
  onClose: () => void;
  deckId: string | null;
  initialName: string;
}

export function RenameDeckDialog({ open, onClose, deckId, initialName }: Props) {
  const rename = useRenameDeck();
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setError(null);
    }
  }, [open, initialName]);

  if (!deckId) return null;

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (trimmed === initialName) {
      onClose();
      return;
    }
    setError(null);
    rename.mutate(
      { deckId, name: trimmed },
      {
        onSuccess: () => onClose(),
        onError: (err) => {
          setError(err instanceof ApiError ? err.message : '이름 변경에 실패했어요.');
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="덱 이름 변경"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={rename.isPending}
            className="rounded-full border border-edge-strong bg-transparent px-4 py-2 text-[13px] font-medium text-cream-mute transition-colors hover:bg-paper-2 hover:text-cream disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!name.trim() || rename.isPending}
            className="rounded-full border-0 bg-amber px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-amber-deep disabled:opacity-50"
          >
            {rename.isPending ? '저장 중…' : '저장'}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-2">
        <label className="text-[11px] uppercase tracking-[0.08em] text-cream-faint">새 이름</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
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
