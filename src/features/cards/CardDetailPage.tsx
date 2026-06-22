import { Link, useParams } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { Icon } from '@/components/Icon';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { useArchive } from './hooks/useArchive';
import { useReturnToField } from './hooks/useReturnToField';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d
    .getDate()
    .toString()
    .padStart(2, '0')}`;
}

export function CardDetailPage() {
  const { cardId } = useParams<{ cardId: string }>();
  const { data, isLoading, isError } = useArchive(null);
  const ret = useReturnToField();
  const card = data?.find((c) => c.cardId === cardId);

  const topbar = (
    <>
      <div className="flex items-center gap-2.5 text-[13px] text-cream-faint">
        <Link to="/archive" className="no-underline transition-colors hover:text-amber">
          보관함
        </Link>
        <span className="opacity-50">/</span>
        <span className="font-medium text-cream-mute">카드</span>
      </div>
      <Link
        to="/archive"
        className="inline-flex items-center gap-2 rounded-full border border-edge-strong bg-transparent px-4 py-2.5 text-[13px] font-medium text-cream-mute no-underline transition-all duration-[var(--dur-fast)] ease-[var(--ease-spring)] hover:bg-paper-2 hover:text-cream"
      >
        <Icon name="solar:alt-arrow-left-linear" width={15} height={15} />
        보관함으로
      </Link>
    </>
  );

  return (
    <AppShell topbar={topbar}>
      {isLoading && (
        <div className="flex flex-col gap-6">
          <Skeleton className="h-20 w-2/3" />
          <Skeleton className="h-40" />
        </div>
      )}

      {isError && (
        <EmptyState
          name="card_detail_error"
          title="지금 길이 막혀있어요"
          body="잠시 후 다시 이어가주세요."
        />
      )}

      {!isLoading && !isError && !card && (
        <EmptyState
          name="card_not_found"
          title="이 카드는 찾을 수 없어요"
          body="다른 카드를 고르러 보관함으로 돌아가볼까요?"
          action={
            <Link
              to="/archive"
              className="rounded-full bg-amber px-5 py-2.5 text-sm font-medium text-white no-underline shadow-[0_10px_24px_-12px_rgba(196,103,63,0.65)] hover:bg-amber-deep"
            >
              보관함으로
            </Link>
          }
        />
      )}

      {card && (
        <article
          className="rounded-[20px] border border-edge bg-surface p-9"
          style={{ animation: 'fadeInUp .45s var(--ease-spring) both' }}
        >
          <div className="mb-7 flex items-center gap-2.5">
            {card.tags[0] ? (
              <Link
                to={`/tags/${card.tags[0].tagId}`}
                className="rounded-full bg-amber-soft px-3 py-1 text-xs font-medium text-amber-deep no-underline"
              >
                {card.tags[0].name}
              </Link>
            ) : (
              <span className="text-xs text-cream-faint">태그 없음</span>
            )}
            <span className="inline-flex items-center gap-1.5 text-xs text-sage-ink">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-sage" />
              {card.status === 'ARCHIVE' ? '참조 보관' : '필드'}
            </span>
            <span className="ml-auto text-xs text-cream-faint">
              {formatDate(card.enteredFieldAt)} 보관 시작
            </span>
          </div>

          <h1 className="m-0 mb-9 font-serif text-[42px] font-medium leading-[1.18] tracking-[-0.02em] text-cream break-keep">
            {card.summary}
          </h1>

          <div className="grid gap-9 lg:grid-cols-[1fr_2fr]">
            <div className="flex flex-col gap-7 border-t border-edge pt-7 lg:border-r lg:border-t-0 lg:pr-7 lg:pt-0">
              <Meta label="Cycle" value={`${card.viewCount} / 5`} />
              <Meta label="Status" value={card.status === 'ARCHIVE' ? '참조 보관' : '필드'} />
              <Meta label="Entered" value={formatDate(card.enteredFieldAt)} />
            </div>
            <div>
              <p className="m-0 text-lg leading-[1.7] text-cream-mute break-keep">{card.summary}</p>

              <div className="mt-9 border-t border-edge pt-7">
                <span className="mb-3.5 block text-[11px] uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
                  Keywords
                </span>
                <div className="flex flex-wrap gap-2">
                  {card.keywords.map((kw) => (
                    <span
                      key={kw}
                      className="rounded-full bg-paper-2 px-3 py-1 text-xs text-cream-mute"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-7 border-t border-edge pt-7">
                <span className="mb-3.5 block text-[11px] uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
                  Tags
                </span>
                <div className="flex flex-wrap gap-2">
                  {card.tags.map((t) => (
                    <Link
                      key={t.tagId}
                      to={`/tags/${t.tagId}`}
                      className="rounded-full bg-amber-soft px-3 py-1 text-xs font-medium text-amber-deep no-underline hover:bg-amber-line"
                    >
                      {t.name}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mt-10">
                <button
                  type="button"
                  onClick={() => ret.mutate(card.cardId)}
                  disabled={ret.isPending}
                  className="group inline-flex items-center gap-3 rounded-full bg-amber py-3.5 pl-6 pr-4 text-[15px] font-medium text-white shadow-[0_10px_24px_-12px_rgba(196,103,63,0.65)] transition-all duration-[var(--dur-base)] ease-[var(--ease-spring)] hover:-translate-y-px hover:bg-amber-deep disabled:opacity-50"
                >
                  이 카드로 다시 이어가기 · 새 사이클
                  <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-white/20 transition-transform duration-[var(--dur-base)] ease-[var(--ease-spring)] group-hover:translate-x-0.5">
                    <Icon name="solar:refresh-linear" width={16} height={16} />
                  </span>
                </button>
              </div>
            </div>
          </div>
        </article>
      )}
    </AppShell>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="mb-1.5 block text-[11px] uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
        {label}
      </span>
      <p className="m-0 font-serif text-lg text-cream">{value}</p>
    </div>
  );
}
