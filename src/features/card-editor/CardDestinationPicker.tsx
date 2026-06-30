import { useMemo, useState, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/Icon';
import { useLearningFacade } from '@/features/auth/hooks/useLearningFacade';
import { useDecks } from '@/features/decks/hooks/useDecks';
import { useCreateAxisDeck } from '@/features/decks/hooks/useCreateAxisDeck';

export interface CardDestination {
  axisId: string | null;
  deckId: string | null;
}

// Lets the author choose which axis-linked deck a new card lands in. Replaces the
// old "auto-create an orphan deck" fallback, which placed cards in decks with no
// axis — making them invisible in the axis view and today feed (FE 002.md Issue 4).
export function CardDestinationPicker({
  value,
  onChange,
}: {
  value: CardDestination;
  onChange: (next: CardDestination) => void;
}) {
  const facade = useLearningFacade();
  const decks = useDecks();
  const createDeck = useCreateAxisDeck();
  const [draft, setDraft] = useState('');

  const axes = facade.data?.axes ?? [];

  const decksByAxis = useMemo(() => {
    const map = new Map<string, Array<{ deckId: string; name: string }>>();
    for (const d of decks.data?.content ?? []) {
      if (d.axisId == null) continue; // orphan decks are not offered as targets
      const arr = map.get(d.axisId) ?? [];
      arr.push({ deckId: d.deckId, name: d.name });
      map.set(d.axisId, arr);
    }
    return map;
  }, [decks.data]);

  const activeAxisId = value.axisId ?? axes[0]?.axisId ?? null;
  const axisDecks = activeAxisId ? (decksByAxis.get(activeAxisId) ?? []) : [];

  const selectAxis = (axisId: string) => {
    const firstDeck = decksByAxis.get(axisId)?.[0]?.deckId ?? null;
    onChange({ axisId, deckId: firstDeck });
    setDraft('');
  };

  const selectDeck = (deckId: string) => onChange({ axisId: activeAxisId, deckId });

  const addDeck = () => {
    if (!activeAxisId || !draft.trim() || createDeck.isPending) return;
    createDeck.mutate(
      { axisId: activeAxisId, name: draft.trim() },
      {
        onSuccess: (res) => {
          onChange({ axisId: activeAxisId, deckId: res.deckId });
          setDraft('');
        },
      },
    );
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addDeck();
    }
  };

  if (facade.isLoading) {
    return (
      <p className="text-[12.5px] text-cream-faint">학습 축을 불러오는 중…</p>
    );
  }

  // No axis yet → can't place a card anywhere meaningful. Guide to the map.
  if (axes.length === 0) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-cream-mute">
        <span>아직 학습 축이 없어요.</span>
        <Link
          to="/map"
          className="inline-flex items-center gap-1 font-medium text-amber-deep no-underline hover:underline"
        >
          지도에서 축 만들기
          <Icon name="solar:arrow-right-linear" width={13} height={13} />
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {/* axis row */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[11px] uppercase tracking-[0.06em] text-cream-faint">축</span>
        {axes.map((a) => {
          const sel = a.axisId === activeAxisId;
          return (
            <button
              key={a.axisId}
              type="button"
              onClick={() => selectAxis(a.axisId)}
              className={`rounded-full border px-3 py-1 text-[12.5px] transition-all ${
                sel
                  ? 'border-amber bg-amber-soft font-medium text-amber-deep'
                  : 'border-edge bg-surface text-cream-mute hover:border-amber-line'
              }`}
            >
              {a.name}
            </button>
          );
        })}
      </div>

      {/* deck row for the active axis */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[11px] uppercase tracking-[0.06em] text-cream-faint">덱</span>
        {axisDecks.map((d) => {
          const sel = d.deckId === value.deckId;
          return (
            <button
              key={d.deckId}
              type="button"
              onClick={() => selectDeck(d.deckId)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12.5px] transition-all ${
                sel
                  ? 'border-amber bg-amber-soft font-medium text-amber-deep'
                  : 'border-edge bg-surface text-cream-mute hover:border-amber-line'
              }`}
            >
              {sel && <Icon name="solar:check-circle-bold" width={13} height={13} />}
              {d.name}
            </button>
          );
        })}
        <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-edge-strong bg-transparent px-2.5 py-1">
          <Icon name="solar:add-circle-linear" width={13} height={13} className="text-cream-faint" />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKey}
            placeholder={createDeck.isPending ? '만드는 중…' : '새 덱 · Enter'}
            disabled={createDeck.isPending}
            className="w-[110px] border-0 bg-transparent text-[12.5px] text-cream caret-amber outline-none placeholder:text-cream-faint disabled:opacity-50"
          />
        </span>
      </div>
    </div>
  );
}
