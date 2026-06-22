import { useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { Icon } from '@/components/Icon';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { track } from '@/lib/analytics/track';
import { useTagCards, useTags } from './hooks/useTags';

export function TagDetailPage() {
  const { tagId } = useParams<{ tagId: string }>();
  const cards = useTagCards(tagId);
  const tags = useTags();
  const tagName = tags.data?.tags.find((t) => t.tagId === tagId)?.name ?? tagId;

  const reportedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!tagId || !cards.isSuccess) return;
    if (reportedRef.current === tagId) return;
    reportedRef.current = tagId;
    track('related_archive_opened', {
      tagId,
      onFieldCount: cards.data.onField.length,
      archiveCount: cards.data.archive.length,
    });
  }, [tagId, cards.isSuccess, cards.data]);

  const topbar = (
    <>
      <div className="flex items-center gap-2.5 text-[13px] text-cream-faint">
        <Link to="/tags" className="no-underline transition-colors hover:text-amber">
          태그
        </Link>
        <span className="opacity-50">/</span>
        <span className="font-medium text-cream-mute">{tagName}</span>
      </div>
      <Link
        to="/tags"
        className="inline-flex items-center gap-2 rounded-full border border-edge-strong bg-transparent px-4 py-2.5 text-[13px] font-medium text-cream-mute no-underline transition-colors hover:bg-paper-2 hover:text-cream"
      >
        <Icon name="solar:alt-arrow-left-linear" width={15} height={15} />
        태그 목록
      </Link>
    </>
  );

  return (
    <AppShell topbar={topbar}>
      <header
        className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
        style={{ animation: 'fadeInUp .5s var(--ease-spring) both' }}
      >
        <div>
          <div className="mb-2 block text-xs uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
            Tag
          </div>
          <h1 className="m-0 font-serif text-[56px] font-medium leading-none tracking-[-0.025em] text-cream">
            {tagName}
          </h1>
        </div>
      </header>

      {cards.isLoading && <Skeleton className="h-52" />}

      {cards.isSuccess && cards.data.onField.length === 0 && cards.data.archive.length === 0 && (
        <EmptyState
          name="tag_empty"
          title="이 결의 카드가 없어요"
          body="다른 태그를 찾아볼까요?"
          action={
            <Link
              to="/tags"
              className="rounded-full bg-amber px-5 py-2.5 text-sm font-medium text-white no-underline shadow-[0_10px_24px_-12px_rgba(196,103,63,0.65)] hover:bg-amber-deep"
            >
              태그로
            </Link>
          }
        />
      )}

      {cards.isSuccess && (cards.data.onField.length > 0 || cards.data.archive.length > 0) && (
        <div className="flex flex-col gap-14">
          {cards.data.onField.length > 0 && (
            <Section title="ON FIELD" cards={cards.data.onField} link={(id) => `/archive/${id}`} />
          )}
          {cards.data.archive.length > 0 && (
            <Section
              title="Reference Archive"
              cards={cards.data.archive}
              link={(id) => `/archive/${id}`}
            />
          )}
        </div>
      )}
    </AppShell>
  );
}

interface SectionProps {
  title: string;
  cards: Array<{ cardId: string; summary: string }>;
  link: (cardId: string) => string;
}

function Section({ title, cards, link }: SectionProps) {
  return (
    <section>
      <div className="mb-6 flex items-center gap-4">
        <span className="text-xs uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
          ── {title}
        </span>
        <span aria-hidden className="h-px max-w-32 flex-1 bg-edge" />
        <span className="text-xs text-cream-faint">{cards.length}장</span>
      </div>
      <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((c, i) => (
          <li key={c.cardId} style={{ animation: `fadeInUp 0.5s var(--ease-spring) ${i * 60}ms both` }}>
            <Link
              to={link(c.cardId)}
              className="group flex flex-col gap-3 rounded-[18px] border border-edge bg-surface p-5 no-underline transition-all duration-[var(--dur-fast)] ease-[var(--ease-spring)] hover:-translate-y-[3px] hover:border-amber-line"
            >
              <span className="font-serif text-base italic text-amber">
                {(i + 1).toString().padStart(2, '0')}
              </span>
              <p className="line-clamp-3 m-0 font-serif text-[17px] leading-[1.4] text-cream break-keep">
                {c.summary}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
