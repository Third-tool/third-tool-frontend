import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/Skeleton';
import { ApiError } from '@/lib/api/client';
import { CardScheduleBadge } from '@/features/cards/components/CardScheduleBadge';
import { ArchiveReasonBadge } from '@/features/cards/components/ArchiveReasonBadge';
import { UpcomingExposureIndicator } from '@/features/cards/components/UpcomingExposureIndicator';
import { useAxisCards } from '../hooks/useAxisCards';

// product-learning-tower Epic 3 Story 3-2 (M5 · 2026-07-22+).
// AxisDetailPage Cards 탭 실 리스트 (M4 CardsAxisShell 대체).
// BE PR#4 (LT-E4-CARD-AXIS) 응답 소비 · card.axis_id NOT NULL 승격.
interface Props {
  axisId: string;
}

export function CardsAxisList({ axisId }: Props) {
  const cards = useAxisCards(axisId);

  if (cards.isLoading) {
    return (
      <section aria-label="이 축의 카드" className="flex flex-col gap-3">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </section>
    );
  }

  if (cards.isError) {
    const msg =
      cards.error instanceof ApiError
        ? cards.error.message
        : '카드 목록을 불러오지 못했어요.';
    return (
      <section aria-label="이 축의 카드">
        <p role="alert" className="m-0 text-sm text-amber-deep">
          {msg}
        </p>
      </section>
    );
  }

  const list = cards.data ?? [];

  if (list.length === 0) {
    return (
      <section
        aria-label="이 축의 카드 · 없음"
        className="rounded-[14px] border border-dashed border-edge px-5 py-6 text-center"
      >
        <p className="m-0 text-sm text-cream-mute break-keep">
          이 축에 연결된 카드가 아직 없어요.
        </p>
        <p className="m-0 mt-2 text-xs text-cream-faint break-keep">
          카드를 만들면 여기에 표시됩니다.
        </p>
      </section>
    );
  }

  return (
    <section aria-label="이 축의 카드" className="flex flex-col gap-3">
      <p className="m-0 text-[11px] uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
        총 {list.length}장
      </p>
      <ul className="m-0 flex flex-col gap-2 p-0">
        {list.map((c) => (
          <li key={c.cardId} className="list-none">
            <Link
              to={`/archive/${c.cardId}`}
              aria-label={`${c.summary} 카드 상세 열기`}
              className="block rounded-[12px] border border-edge bg-surface p-4 no-underline transition-colors hover:border-amber-line"
            >
              <p className="m-0 text-sm text-cream break-keep">{c.summary}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {c.effectiveMax && (
                  <CardScheduleBadge
                    createdMode={c.createdMode ?? null}
                    effectiveMax={c.effectiveMax}
                  />
                )}
                {c.status === 'ON_FIELD' && c.effectiveMax && (
                  <UpcomingExposureIndicator
                    viewCount={c.viewCount}
                    createdMode={c.createdMode ?? null}
                    effectiveMax={c.effectiveMax}
                  />
                )}
                {c.status === 'ARCHIVE' && c.archiveReason && (
                  <ArchiveReasonBadge reason={c.archiveReason} />
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
