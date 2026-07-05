import { Link } from 'react-router-dom';
import type { DailyLearningBatch, DailyCardEntry } from '@/lib/api/schemas/dailyLearningBatch';

// product-review (FE) Epic 1 Story 1-4 · M5 신설 (2026-07-22+).
// cross-layer 짬뽕 · card_interval_day ASC 정렬 (MSW에서 이미 정렬 · UI는 순서 신뢰).
// 개별 카드 preview · 클릭 시 /study?sessionId=&cardId=X (individual focus).
// M4 <CardScheduleBadge>는 여기서 요약형 정보로 대체 (createdMode 노출).
interface Props {
  batch: DailyLearningBatch;
  onCardClick?: (entry: DailyCardEntry) => void;
}

const INTERVAL_LABEL: Record<number, string> = {
  1: 'D+1',
  3: 'D+3',
  7: 'D+7',
  14: 'D+14',
  28: 'D+28',
  60: 'D+60',
};

export function CardQueueList({ batch, onCardClick }: Props) {
  if (batch.entries.length === 0) {
    return (
      <section
        aria-label="오늘의 카드 큐 · 없음"
        className="rounded-[16px] border border-dashed border-edge bg-surface px-6 py-10 text-center"
      >
        <p className="m-0 text-sm font-semibold text-cream break-keep">
          오늘 복습할 카드가 없어요
        </p>
        <p className="m-0 mt-2 text-xs text-cream-mute break-keep">
          필드에 카드가 없거나 · 오늘 스케줄에 도래한 카드가 없어요.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          <Link
            to="/cards/new"
            className="rounded-full bg-amber px-5 py-2.5 text-xs font-medium text-white no-underline hover:bg-amber-deep"
          >
            새 카드 만들기
          </Link>
          <Link
            to="/dashboard"
            className="rounded-full border border-edge-strong bg-transparent px-5 py-2.5 text-xs font-medium text-cream-mute no-underline hover:bg-paper-2"
          >
            대시보드
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="오늘의 카드 큐" className="flex flex-col gap-2">
      <p className="m-0 text-[11px] uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
        총 {batch.entries.length}장 · cross-layer 짬뽕
      </p>
      <ul className="m-0 flex flex-col gap-2 p-0">
        {batch.entries.map((e) => {
          const intervalLabel = INTERVAL_LABEL[e.cardIntervalDay] ?? `D+${e.cardIntervalDay}`;
          const viewed = Boolean(e.viewedAt);
          return (
            <li key={e.cardId} className="list-none">
              <Link
                to={`/study?cardId=${e.cardId}`}
                onClick={() => onCardClick?.(e)}
                aria-label={`${e.summary} · ${intervalLabel} ${viewed ? '완료' : '미완료'}`}
                className={
                  viewed
                    ? 'flex items-center gap-3 rounded-[12px] border border-edge bg-surface p-3 no-underline opacity-60 transition-colors hover:border-amber-line'
                    : 'flex items-center gap-3 rounded-[12px] border border-edge bg-surface p-3 no-underline transition-colors hover:border-amber-line'
                }
              >
                <span
                  aria-label={`간격 ${intervalLabel}`}
                  className="inline-flex shrink-0 items-center justify-center rounded-full bg-amber-soft px-2.5 py-1 font-mono text-[11px] font-semibold text-amber-deep"
                >
                  {intervalLabel}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="m-0 truncate text-sm text-cream break-keep">
                    {e.summary}
                  </p>
                  {(e.layerName || e.axisName) && (
                    <p className="m-0 mt-0.5 truncate text-[11px] text-cream-faint">
                      {e.layerName ?? ''}
                      {e.layerName && e.axisName ? ' · ' : ''}
                      {e.axisName ?? ''}
                    </p>
                  )}
                </div>
                {viewed && (
                  <span
                    aria-label="완료"
                    className="shrink-0 text-[11px] font-medium text-emerald"
                  >
                    clear
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
