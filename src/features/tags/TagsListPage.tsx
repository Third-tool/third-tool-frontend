import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { Icon } from '@/components/Icon';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { track } from '@/lib/analytics/track';
import { useTags } from './hooks/useTags';

export function TagsListPage() {
  const tags = useTags();
  const openedRef = useRef(false);
  useEffect(() => {
    if (openedRef.current) return;
    openedRef.current = true;
    track('tag_explorer_opened');
  }, []);

  const topbar = (
    <>
      <div className="flex items-center gap-2.5 text-[13px] text-cream-faint">
        <span>Library</span>
        <span className="opacity-50">/</span>
        <span className="font-medium text-cream-mute">태그</span>
      </div>
      <Link
        to="/map"
        className="inline-flex items-center gap-2 rounded-full border border-edge-strong bg-transparent px-4 py-2.5 text-[13px] font-medium text-cream-mute no-underline transition-colors hover:bg-paper-2 hover:text-cream"
      >
        <Icon name="solar:book-2-linear" width={15} height={15} />
        지도로
      </Link>
    </>
  );

  return (
    <AppShell topbar={topbar}>
      <header className="mb-10" style={{ animation: 'fadeInUp .5s var(--ease-spring) both' }}>
        <div className="mb-[18px] flex items-center gap-3">
          <span className="text-xs uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
            Tag Atlas
          </span>
          <span aria-hidden className="h-px w-[110px] bg-edge" />
        </div>
        <h1 className="m-0 font-serif text-[56px] font-medium leading-none tracking-[-0.025em] text-cream break-keep">
          모든 <span className="italic text-amber">실마리.</span>
        </h1>
      </header>

      {tags.isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      )}

      {tags.isSuccess && tags.data.tags.length === 0 && (
        <EmptyState
          name="tags_empty"
          title="아직 Tag가 없어요"
          body="카드를 만들 때 Tag를 붙여보세요."
        />
      )}

      {tags.isSuccess && tags.data.tags.length > 0 && (
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tags.data.tags.map((t, i) => (
            <li
              key={t.tagId}
              style={{ animation: `fadeInUp 0.5s var(--ease-spring) ${i * 60}ms both` }}
            >
              <Link
                to={`/tags/${t.tagId}`}
                className="group flex items-baseline justify-between rounded-[18px] border border-edge bg-surface px-6 py-5 no-underline transition-all duration-[var(--dur-fast)] ease-[var(--ease-spring)] hover:-translate-y-[3px] hover:border-amber-line"
              >
                <span className="flex items-center gap-3">
                  <span className="font-serif text-base italic text-amber">
                    {(i + 1).toString().padStart(2, '0')}
                  </span>
                  <span className="font-serif text-[22px] text-cream">{t.name}</span>
                </span>
                <span className="text-xs text-cream-faint">{t.cardCount}장</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
