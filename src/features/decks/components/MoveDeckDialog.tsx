import { useEffect, useState } from 'react';
import { Dialog } from '@/components/Dialog';
import { ApiError } from '@/lib/api/client';
import { useDecks } from '../hooks/useDecks';
import { useMoveDeck } from '../hooks/useMoveDeck';

interface Props {
  open: boolean;
  onClose: () => void;
  deckId: string | null;
  deckName: string;
  currentParentId: string | null;
}

export function MoveDeckDialog({ open, onClose, deckId, deckName, currentParentId }: Props) {
  const decks = useDecks();
  const move = useMoveDeck();
  const [target, setTarget] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTarget(currentParentId ?? '');
      setError(null);
    }
  }, [open, currentParentId]);

  if (!deckId) return null;

  const candidates = (decks.data?.content ?? []).filter((d) => d.deckId !== deckId);

  const submit = () => {
    setError(null);
    const next = target === '' ? null : target;
    if (next === currentParentId) {
      onClose();
      return;
    }
    move.mutate(
      { deckId, parentDeckId: next },
      {
        onSuccess: () => onClose(),
        onError: (err) => {
          if (err instanceof ApiError && err.code === 'DECK006') {
            setError('이미 연결된 덱으로 이동할 수 없어요');
            return;
          }
          setError(err instanceof ApiError ? err.message : '이동에 실패했어요.');
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`'${deckName}' 이동`}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={move.isPending}
            className="rounded-full border border-edge-strong bg-transparent px-4 py-2 text-[13px] font-medium text-cream-mute transition-colors hover:bg-paper-2 hover:text-cream disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={move.isPending}
            className="rounded-full border-0 bg-amber px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-amber-deep disabled:opacity-50"
          >
            {move.isPending ? '이동 중…' : '이동'}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-2">
        <label className="text-[11px] uppercase tracking-[0.08em] text-cream-faint">상위 덱</label>
        <select
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="rounded-[10px] border border-edge-strong bg-surface px-3.5 py-2.5 text-[14px] text-cream outline-none focus:border-amber-line"
        >
          <option value="">최상위 (루트)</option>
          {candidates.map((d) => (
            <option key={d.deckId} value={d.deckId}>
              {d.name}
            </option>
          ))}
        </select>
        <p className="m-0 mt-1 text-[12px] text-cream-faint">
          상위 덱으로 옮기면 하위 덱도 함께 따라가요.
        </p>
        {error && (
          <p role="alert" className="m-0 mt-1 text-sm text-amber-deep">
            {error}
          </p>
        )}
      </div>
    </Dialog>
  );
}
