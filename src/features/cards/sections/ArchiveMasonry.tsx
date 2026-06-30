import { useState } from 'react';
import { useArchive } from '../hooks/useArchive';
import { TagFilterRow } from '../components/TagFilterRow';
import { ArchiveCard } from './ArchiveCard';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';

export function ArchiveMasonry() {
  const [tagId, setTagId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const { data, isLoading, isError, refetch } = useArchive(tagId);

  const allCards = useArchive(null);
  const filterCards = allCards.data ?? [];

  if (isLoading || allCards.isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        title="지금 길이 막혀있어요"
        body="잠시 후 다시 시도해주세요."
        action={
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-full bg-amber px-5 py-2 text-canvas"
          >
            다시 시도
          </button>
        }
      />
    );
  }

  const cards = data ?? [];

  return (
    <div className="flex flex-col gap-8">
      <TagFilterRow cards={filterCards} selected={tagId} onSelect={setTagId} />
      {cards.length === 0 ? (
        <EmptyState
          title="아직 배경 지식이 모이지 않았어요"
          body="오늘의 카드를 충분히 만나면 여기에 쌓여요."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <div key={c.cardId} className={expanded === c.cardId ? 'sm:col-span-2 lg:col-span-2' : ''}>
              <ArchiveCard
                card={c}
                expanded={expanded === c.cardId}
                onToggle={() => setExpanded((cur) => (cur === c.cardId ? null : c.cardId))}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
