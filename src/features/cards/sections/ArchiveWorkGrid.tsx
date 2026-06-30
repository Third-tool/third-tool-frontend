import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/Icon';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { useArchive } from '../hooks/useArchive';
import { useReturnToField } from '../hooks/useReturnToField';
import type { Card as CardModel } from '@/lib/api/schemas/card';

export function ArchiveWorkGrid() {
  const [tagId, setTagId] = useState<string | null>(null);
  const all = useArchive(null);
  const { data, isLoading, isError, refetch } = useArchive(tagId);
  const ret = useReturnToField();

  if (isLoading || all.isLoading) {
    return (
      <div className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-52" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        name="archive_error"
        title="지금 길이 막혀있어요"
        body="잠시 후 다시 이어가주세요."
        action={
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-full bg-amber px-5 py-2.5 text-sm font-medium text-white shadow-[0_10px_24px_-12px_rgba(196,103,63,0.65)] hover:bg-amber-deep"
          >
            다시 시도
          </button>
        }
      />
    );
  }

  const allCards = all.data ?? [];
  const cards = data ?? [];

  const tagSummary = new Map<string, { name: string; count: number }>();
  allCards.forEach((c) =>
    c.tags.forEach((t) => {
      const prev = tagSummary.get(t.tagId);
      tagSummary.set(t.tagId, { name: t.name, count: (prev?.count ?? 0) + 1 });
    }),
  );
  const ordered = [...tagSummary.entries()].sort((a, b) => b[1].count - a[1].count);

  return (
    <div className="flex flex-col gap-9">
      <div className="flex flex-wrap gap-2.5 border-b border-edge pb-[26px]">
        <FilterPill
          label="전체"
          count={allCards.length}
          active={tagId === null}
          onClick={() => setTagId(null)}
        />
        {ordered.map(([id, { name, count }]) => (
          <FilterPill
            key={id}
            label={name}
            count={count}
            active={tagId === id}
            onClick={() => setTagId(id)}
          />
        ))}
      </div>

      {cards.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-edge-strong px-8 py-20 text-center">
          <p className="m-0 mb-2 font-serif text-[22px] text-cream">
            이 결의 카드는 모두 필드로 돌아갔어요
          </p>
          <p className="m-0 text-sm text-cream-faint">
            다른 태그를 골라보거나, 오늘의 순환에서 다시 만나봐요.
          </p>
        </div>
      ) : (
        <div className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <ArchiveCard
              key={card.cardId}
              card={card}
              onReturn={() => ret.mutate(card.cardId)}
              returning={ret.isPending}
            />
          ))}
        </div>
      )}
    </div>
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
  onReturn,
  returning,
}: {
  card: CardModel;
  onReturn: () => void;
  returning: boolean;
}) {
  const keptLabel = formatKept(card.enteredFieldAt);
  const tag = card.tags[0];
  return (
    <article
      className="group relative flex min-h-[210px] flex-col rounded-[18px] border border-edge bg-surface p-6 transition-all duration-[var(--dur-fast)] ease-[var(--ease-spring)] hover:-translate-y-[3px] hover:border-amber-line"
      style={{ animation: 'fadeInUp .5s var(--ease-spring) both' }}
    >
      <div className="mb-[18px] flex items-center justify-between">
        {tag ? (
          <Link
            to={`/tags/${tag.tagId}`}
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
      <Link
        to={`/archive/${card.cardId}`}
        className="m-0 mb-auto font-serif text-[19px] font-medium leading-[1.4] text-cream no-underline break-keep"
      >
        {card.summary}
      </Link>
      <div className="mt-5 flex items-center justify-between gap-2.5 border-t border-edge pt-4">
        <span className="text-[11.5px] tabular-nums text-cream-faint">
          노출 {card.viewCount}/5 · {keptLabel}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onReturn();
          }}
          disabled={returning}
          className="inline-flex items-center gap-1.5 rounded-full border border-amber-line bg-amber-soft px-3 py-1.5 text-[11.5px] font-semibold text-amber-deep opacity-0 transition-all duration-[var(--dur-fast)] ease-[var(--ease-spring)] hover:bg-amber-line group-hover:opacity-100 disabled:opacity-40"
        >
          <Icon name="solar:refresh-linear" width={13} height={13} />
          다시 펴기
        </button>
      </div>
    </article>
  );
}

function formatKept(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 보관`;
}
