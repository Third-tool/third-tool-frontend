import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/Icon';
import { useDecks } from '../hooks/useDecks';
import { useCreateDeck } from '../hooks/useCreateDeck';
import { useSelectedDeck } from '../DeckContext';

export function DeckSelector() {
  const decks = useDecks();
  const create = useCreateDeck();
  const { selectedDeckId, setSelectedDeckId } = useSelectedDeck();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  const list = useMemo(() => decks.data?.content ?? [], [decks.data]);
  const selected = list.find((d) => d.deckId === selectedDeckId) ?? list[0];

  useEffect(() => {
    if (!selectedDeckId && list.length > 0) {
      setSelectedDeckId(list[0]!.deckId);
    }
  }, [selectedDeckId, list, setSelectedDeckId]);

  const submitNew = () => {
    if (!name.trim()) return;
    create.mutate(
      { name: name.trim() },
      {
        onSuccess: (res) => {
          setSelectedDeckId(res.deckId);
          setName('');
          setAdding(false);
        },
      },
    );
  };

  return (
    <div className="rounded-[11px] border border-edge bg-paper p-2.5">
      <div className="mb-1.5 flex items-center justify-between gap-2 px-1 text-[10.5px] uppercase tracking-[0.06em] text-cream-faint">
        <span className="flex items-center gap-2">
          <Icon name="solar:folder-linear" width={12} height={12} />
          덱
        </span>
        <Link
          to="/decks"
          className="text-[10px] font-medium normal-case tracking-normal text-cream-mute no-underline transition-colors hover:text-amber-deep"
        >
          관리 →
        </Link>
      </div>
      {decks.isLoading ? (
        <div className="px-1 py-1.5 text-[11.5px] text-cream-faint">불러오는 중…</div>
      ) : list.length === 0 ? (
        <div className="px-1 py-1.5 text-[11.5px] text-cream-faint">아직 덱이 없어요.</div>
      ) : (
        <select
          value={selected?.deckId ?? ''}
          onChange={(e) => setSelectedDeckId(e.target.value || null)}
          className="w-full rounded-[8px] border border-edge bg-surface px-2 py-1.5 text-[12.5px] text-cream outline-none focus:border-amber-line"
        >
          {list.map((d) => (
            <option key={d.deckId} value={d.deckId}>
              {d.name} ({d.cardCount})
            </option>
          ))}
        </select>
      )}

      {adding ? (
        <div className="mt-2 flex gap-1.5">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitNew();
              if (e.key === 'Escape') {
                setAdding(false);
                setName('');
              }
            }}
            placeholder="덱 이름"
            className="min-w-0 flex-1 rounded-[7px] border border-edge bg-surface px-2 py-1.5 text-[12px] text-cream outline-none focus:border-amber-line"
          />
          <button
            type="button"
            onClick={submitNew}
            disabled={!name.trim() || create.isPending}
            className="rounded-[7px] bg-amber px-2 py-1 text-[11px] font-medium text-white disabled:opacity-50"
          >
            추가
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-1.5 flex w-full items-center gap-1.5 rounded-[7px] px-1.5 py-1.5 text-[11.5px] text-cream-faint hover:bg-paper-2 hover:text-cream"
        >
          <Icon name="solar:add-circle-linear" width={13} height={13} />
          새 덱 만들기
        </button>
      )}
    </div>
  );
}
