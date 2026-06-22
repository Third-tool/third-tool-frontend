import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { Icon } from '@/components/Icon';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { toastStore } from '@/lib/toast/toastQueue';
import { useArchive } from './hooks/useArchive';
import { useReturnToField } from './hooks/useReturnToField';
import { useSelectedDeck } from '@/features/decks/DeckContext';
import { useDecks } from '@/features/decks/hooks/useDecks';
import type { Card as CardModel } from '@/lib/api/schemas/card';

type Sort = 'recent' | 'oldest' | 'title';

const SORT_OPTIONS: Array<{ key: Sort; label: string }> = [
  { key: 'recent', label: '최신순' },
  { key: 'oldest', label: '오래된순' },
  { key: 'title', label: '제목순' },
];

const UNDO_MS = 5000;

export function ArchivePage() {
  const { selectedDeckId } = useSelectedDeck();
  const decks = useDecks();
  const activeDeckId = selectedDeckId ?? decks.data?.content[0]?.deckId ?? null;
  const all = useArchive({ deckId: activeDeckId });
  const archiveCount = all.data?.length ?? 0;
  const ret = useReturnToField();

  const [query, setQuery] = useState('');
  const [tagId, setTagId] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>('recent');
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const yearRange = (() => {
    const now = new Date();
    const y = now.getFullYear();
    return `'${(y - 1).toString().slice(2)} — '${y.toString().slice(2)}`;
  })();

  const cards = useMemo(() => {
    let list = all.data ?? [];
    if (tagId) list = list.filter((c) => c.tags.some((t) => t.tagId === tagId));
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.summary.toLowerCase().includes(q) ||
          c.tags.some((t) => t.name.toLowerCase().includes(q)) ||
          c.keywords.some((k) => k.toLowerCase().includes(q)),
      );
    }
    list = list.filter((c) => !pending.has(c.cardId));
    const sorted = [...list];
    if (sort === 'recent') {
      sorted.sort((a, b) => b.enteredFieldAt.localeCompare(a.enteredFieldAt));
    } else if (sort === 'oldest') {
      sorted.sort((a, b) => a.enteredFieldAt.localeCompare(b.enteredFieldAt));
    } else if (sort === 'title') {
      sorted.sort((a, b) => a.summary.localeCompare(b.summary, 'ko'));
    }
    return sorted;
  }, [all.data, tagId, query, sort, pending]);

  const tagSummary = useMemo(() => {
    const m = new Map<string, { name: string; count: number }>();
    (all.data ?? []).forEach((c) =>
      c.tags.forEach((t) => {
        const prev = m.get(t.tagId);
        m.set(t.tagId, { name: t.name, count: (prev?.count ?? 0) + 1 });
      }),
    );
    return [...m.entries()].sort((a, b) => b[1].count - a[1].count);
  }, [all.data]);

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelected(new Set());
  };

  const scheduleReturn = (cardId: string) => {
    const timer = setTimeout(() => {
      ret.mutate(cardId);
      setPending((m) => {
        const next = new Map(m);
        next.delete(cardId);
        return next;
      });
    }, UNDO_MS);
    setPending((m) => {
      const next = new Map(m);
      next.set(cardId, timer);
      return next;
    });
  };

  const cancelPending = (cardId: string) => {
    const timer = pending.get(cardId);
    if (timer) clearTimeout(timer);
    setPending((m) => {
      const next = new Map(m);
      next.delete(cardId);
      return next;
    });
  };

  useEffect(() => {
    return () => {
      pending.forEach((t) => clearTimeout(t));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const returnOne = (card: CardModel) => {
    scheduleReturn(card.cardId);
    toastStore.push({
      message: `'${card.summary.slice(0, 18)}…' 카드를 필드로 폈어요`,
      tone: 'amber',
      action: {
        label: '실행취소',
        onClick: () => cancelPending(card.cardId),
      },
    });
  };

  const returnSelected = () => {
    const ids = [...selected];
    if (ids.length === 0) return;
    ids.forEach((id) => scheduleReturn(id));
    exitSelectMode();
    toastStore.push({
      message: `${ids.length}장을 필드로 폈어요`,
      tone: 'amber',
      action: {
        label: '실행취소',
        onClick: () => ids.forEach(cancelPending),
      },
    });
  };

  const toggleSelected = (cardId: string) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
  };

  const visibleIds = cards.map((c) => c.cardId);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));

  const topbar = (
    <>
      <div className="flex items-center gap-2.5 text-[13px] text-cream-faint">
        <span>Library</span>
        <span className="opacity-50">/</span>
        <span className="font-medium text-cream-mute">보관함</span>
        <span className="ml-2 rounded-full border border-edge bg-paper-2 px-2.5 py-0.5 text-[11px] tabular-nums text-cream-mute">
          {archiveCount}장 참조 중
        </span>
      </div>
      <Link
        to="/cards/new"
        className="inline-flex items-center gap-2 rounded-full border border-edge-strong bg-transparent px-4 py-2.5 text-[13px] font-medium text-cream-mute no-underline transition-all duration-[var(--dur-fast)] ease-[var(--ease-spring)] hover:bg-paper-2 hover:text-cream"
      >
        <Icon name="solar:add-square-linear" width={15} height={15} />새 카드
      </Link>
    </>
  );

  return (
    <AppShell topbar={topbar} archiveCount={archiveCount}>
      <div
        className="mb-10 flex flex-wrap items-end justify-between gap-8"
        style={{ animation: 'fadeInUp .5s var(--ease-spring) both' }}
      >
        <div>
          <div className="mb-[18px] flex items-center gap-3">
            <span className="text-xs uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
              Reference Archive
            </span>
            <span aria-hidden className="h-px w-[110px] bg-edge" />
          </div>
          <h1 className="m-0 font-serif text-[60px] font-medium leading-none tracking-[-0.025em] text-cream">
            보관함{' '}
            <span className="text-[0.62em] italic text-cream-faint">{yearRange}</span>
          </h1>
        </div>
        <p className="m-0 max-w-[34ch] text-[15px] leading-[1.7] text-cream-mute break-keep">
          참조로 남긴 카드. 다시 이어가고 싶을 때 카드를 눌러 필드로 꺼내올 수 있어요.
        </p>
      </div>

      {/* Toolbar */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative flex flex-1 min-w-[240px] items-center gap-2.5 rounded-[12px] border border-edge bg-surface px-4 py-2.5 focus-within:border-amber-line focus-within:shadow-[0_0_0_3px_var(--color-amber-soft)]">
          <Icon name="solar:magnifer-linear" width={15} height={15} className="text-cream-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="내용·태그·키워드로 검색"
            className="w-full border-0 bg-transparent text-sm text-cream caret-amber outline-none placeholder:text-cream-faint"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="grid h-5 w-5 place-items-center text-cream-faint hover:text-amber"
              aria-label="검색 비우기"
            >
              <Icon name="solar:close-circle-linear" width={14} height={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 rounded-full border border-edge bg-paper-2 p-1">
          {SORT_OPTIONS.map((s) => {
            const active = sort === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setSort(s.key)}
                className={`rounded-full border-0 px-3.5 py-1.5 text-[12.5px] font-medium transition-all duration-[var(--dur-fast)] ease-[var(--ease-spring)] ${
                  active
                    ? 'bg-surface text-cream shadow-[0_1px_3px_rgba(0,0,0,0.1)]'
                    : 'bg-transparent text-cream-faint hover:text-cream'
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[12.5px] font-medium transition-all duration-[var(--dur-fast)] ease-[var(--ease-spring)] ${
            selectMode
              ? 'border-amber bg-amber-soft text-amber-deep'
              : 'border-edge-strong bg-transparent text-cream-mute hover:bg-paper-2 hover:text-cream'
          }`}
        >
          <Icon name={selectMode ? 'solar:check-square-linear' : 'solar:square-linear'} width={14} height={14} />
          선택
        </button>
      </div>

      {/* Tag filter */}
      <div className="mb-9 flex flex-wrap gap-2.5 border-b border-edge pb-[26px]">
        <FilterPill
          label="전체"
          count={all.data?.length ?? 0}
          active={tagId === null}
          onClick={() => setTagId(null)}
        />
        {tagSummary.map(([id, { name, count }]) => (
          <FilterPill
            key={id}
            label={name}
            count={count}
            active={tagId === id}
            onClick={() => setTagId(id)}
          />
        ))}
      </div>

      {/* Result meta */}
      <div className="mb-4 flex items-center justify-between text-xs text-cream-faint">
        <span>{cards.length}장</span>
        {selectMode && (
          <button
            type="button"
            onClick={() => {
              if (allVisibleSelected) setSelected(new Set());
              else setSelected(new Set(visibleIds));
            }}
            className="font-medium text-amber-deep hover:underline"
          >
            {allVisibleSelected ? '선택 해제' : '전체 선택'}
          </button>
        )}
      </div>

      {/* Grid / states */}
      {all.isLoading ? (
        <div className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52" />
          ))}
        </div>
      ) : all.isError ? (
        <EmptyState
          name="archive_error"
          title="지금 길이 막혀있어요"
          body="잠시 후 다시 이어가주세요."
          action={
            <button
              type="button"
              onClick={() => all.refetch()}
              className="rounded-full bg-amber px-5 py-2.5 text-sm font-medium text-white shadow-[0_10px_24px_-12px_rgba(196,103,63,0.65)] hover:bg-amber-deep"
            >
              다시 시도
            </button>
          }
        />
      ) : cards.length === 0 ? (
        (tagId || query) ? (
          <div className="rounded-[20px] border border-dashed border-edge-strong px-8 py-20 text-center">
            <p className="m-0 mb-2 font-serif text-[22px] text-cream">검색 결과가 없어요</p>
            <p className="m-0 mb-5 text-sm text-cream-faint">
              필터를 비우면 전체 카드를 다시 볼 수 있어요.
            </p>
            <button
              type="button"
              onClick={() => {
                setTagId(null);
                setQuery('');
              }}
              className="rounded-full border border-edge-strong bg-transparent px-5 py-2.5 text-sm font-medium text-cream-mute hover:bg-paper-2 hover:text-cream"
            >
              필터 비우기
            </button>
          </div>
        ) : (
          <EmptyState
            name="archive_empty"
            title="아직 참조로 남긴 카드가 없어요"
            body="오늘의 카드를 충분히 이어가면 여기에 쌓여요."
          />
        )
      ) : (
        <div className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <ArchiveCard
              key={card.cardId}
              card={card}
              selectMode={selectMode}
              selected={selected.has(card.cardId)}
              onToggle={() => toggleSelected(card.cardId)}
              onReturn={() => returnOne(card)}
            />
          ))}
        </div>
      )}

      {/* Bulk action bar */}
      {selectMode && selected.size > 0 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
          <div className="pointer-events-auto inline-flex items-center gap-4 rounded-full border border-amber-line bg-surface px-5 py-3 shadow-[0_18px_40px_-22px_rgba(33,31,26,0.35)]">
            <span className="text-sm font-medium text-cream">{selected.size}장 선택됨</span>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-xs text-cream-faint transition-colors hover:text-cream"
            >
              선택 해제
            </button>
            <button
              type="button"
              onClick={returnSelected}
              className="inline-flex items-center gap-1.5 rounded-full bg-amber px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-amber-deep"
            >
              <Icon name="solar:refresh-linear" width={13} height={13} />
              다시 펴기
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function FilterPill({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-[7px] rounded-full border px-4 py-2 text-[13px] font-medium transition-all duration-[var(--dur-fast)] ease-[var(--ease-spring)] ${
        active
          ? 'border-cream bg-cream text-canvas'
          : 'border-edge-strong bg-transparent text-cream-mute hover:bg-paper-2 hover:text-cream'
      }`}
    >
      {label}
      <span className={`tabular-nums ${active ? 'opacity-70' : 'opacity-55'}`}>{count}</span>
    </button>
  );
}

function ArchiveCard({
  card,
  selectMode,
  selected,
  onToggle,
  onReturn,
}: {
  card: CardModel;
  selectMode: boolean;
  selected: boolean;
  onToggle: () => void;
  onReturn: () => void;
}) {
  const tag = card.tags[0];
  const keptLabel = formatKept(card.enteredFieldAt);
  const cardEl = useRef<HTMLElement | null>(null);

  return (
    <article
      ref={cardEl}
      onClick={selectMode ? onToggle : undefined}
      className={`group relative flex min-h-[210px] flex-col rounded-[18px] border bg-surface p-6 transition-all duration-[var(--dur-fast)] ease-[var(--ease-spring)] ${
        selectMode
          ? selected
            ? 'border-amber ring-2 ring-amber-line cursor-pointer'
            : 'border-edge cursor-pointer hover:border-amber-line'
          : 'border-edge hover:-translate-y-[3px] hover:border-amber-line'
      }`}
      style={{ animation: 'fadeInUp .5s var(--ease-spring) both' }}
    >
      {selectMode && (
        <span
          className={`absolute right-4 top-4 grid h-5 w-5 place-items-center rounded border ${
            selected ? 'border-amber bg-amber text-white' : 'border-edge-strong bg-surface'
          }`}
        >
          {selected && <Icon name="solar:check-bold" width={12} height={12} />}
        </span>
      )}
      <div className="mb-[18px] flex items-center justify-between">
        {tag ? (
          <Link
            to={`/tags/${tag.tagId}`}
            onClick={(e) => selectMode && e.preventDefault()}
            className="rounded-full bg-amber-soft px-2.5 py-1 text-[11px] font-medium text-amber-deep no-underline hover:bg-amber-line"
          >
            {tag.name}
          </Link>
        ) : (
          <span className="text-[11px] text-cream-faint">태그 없음</span>
        )}
        <span className="inline-flex items-center gap-1.5 text-[11px] text-sage-ink">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-sage" />
          마스터
        </span>
      </div>
      {selectMode ? (
        <p className="m-0 mb-auto font-serif text-[19px] font-medium leading-[1.4] text-cream break-keep">
          {card.summary}
        </p>
      ) : (
        <Link
          to={`/archive/${card.cardId}`}
          className="m-0 mb-auto font-serif text-[19px] font-medium leading-[1.4] text-cream no-underline break-keep"
        >
          {card.summary}
        </Link>
      )}
      <div className="mt-5 flex items-center justify-between gap-2.5 border-t border-edge pt-4">
        <span className="text-[11.5px] tabular-nums text-cream-faint">
          노출 {card.viewCount}/5 · {keptLabel}
        </span>
        {!selectMode && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onReturn();
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-line bg-amber-soft px-3 py-1.5 text-[11.5px] font-semibold text-amber-deep opacity-0 transition-all duration-[var(--dur-fast)] ease-[var(--ease-spring)] hover:bg-amber-line group-hover:opacity-100"
          >
            <Icon name="solar:refresh-linear" width={13} height={13} />
            다시 펴기
          </button>
        )}
      </div>
    </article>
  );
}

function formatKept(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 보관`;
}
