import { Link, useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/Skeleton';
import { ApiError } from '@/lib/api/client';
import { toastStore } from '@/lib/toast/toastQueue';
import { useDailyBatch } from './hooks/useDailyBatch';
import { useReviewSession } from './hooks/useReviewSession';
import { DailyBatchProgress } from './components/DailyBatchProgress';
import { CardQueueList } from './components/CardQueueList';
import { BatchClosedBanner } from './components/BatchClosedBanner';

// product-review (FE) Epic 1 Story 1-2 · M5 신설 (2026-07-22+).
// /review 라우트 · 매일 첫 학습 진입점.
// - lazy 생성 (POST /daily-batch/today)
// - Batch progress + CardQueueList + BatchClosedBanner
// - [학습 시작] CTA → /study (M5 PR#3 재편 시 batch 참조)
function formatBatchDate(batchDate: string): string {
  // batchDate = 'YYYY-MM-DD' · 사용자에게 한국 형식 노출.
  const [y, m, d] = batchDate.split('-');
  return `${y}.${m}.${d}`;
}

export function DailyBatchLandingPage() {
  const batch = useDailyBatch();
  const navigate = useNavigate();
  const startSession = useReviewSession();

  const topbar = (
    <>
      <div className="flex items-center gap-2.5 text-[13px] text-cream-faint">
        <Link to="/home" className="no-underline hover:text-amber">
          홈
        </Link>
        <span className="opacity-50">/</span>
        <span className="font-medium text-cream-mute">오늘의 학습</span>
      </div>
    </>
  );

  const onStart = () => {
    if (!batch.data) return;
    // M5 PR#3: batch 참조 세션 생성 · 이전 진행 중 세션은 자동 finish (useReviewSession).
    // batchId는 batchDate로 대체 (BE Aggregate identity · UNIQUE(userId, batchDate)).
    startSession.mutate(batch.data.batchDate, {
      onSuccess: (res) => {
        navigate(`/study?sessionId=${res.sessionId}`);
      },
      onError: (err) => {
        const msg =
          err instanceof ApiError ? err.message : '세션을 시작하지 못했어요.';
        toastStore.push({ message: msg, tone: 'amber' });
      },
    });
  };

  return (
    <AppShell topbar={topbar}>
      {batch.isLoading && (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      )}

      {batch.isError && (
        <EmptyState
          name="daily_batch_error"
          title="오늘 batch를 불러오지 못했어요"
          body={
            batch.error instanceof ApiError
              ? batch.error.message
              : '잠시 후 다시 시도해주세요.'
          }
        />
      )}

      {batch.data && (
        <div className="flex flex-col gap-6">
          <BatchClosedBanner
            closedAt={batch.data.closedAt}
            missedCount={
              batch.data.entries.filter((e) => e.viewedAt === null).length
            }
          />

          <header className="flex flex-col gap-2">
            <div className="text-[11px] uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
              오늘의 학습
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <h1 className="m-0 font-serif text-3xl text-cream">
                {formatBatchDate(batch.data.batchDate)}
              </h1>
              <span
                aria-label={`연속 학습 ${batch.data.streak}일`}
                className="rounded-full bg-paper-2 px-3 py-1 text-xs font-semibold text-cream-mute"
              >
                🔥 {batch.data.streak}일 연속
              </span>
            </div>
          </header>

          <DailyBatchProgress batch={batch.data} />

          {batch.data.entries.length > 0 && !batch.data.closedAt && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onStart}
                disabled={startSession.isPending}
                aria-label="오늘 학습 시작"
                className="inline-flex items-center gap-2 rounded-full border-0 bg-amber px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgba(196,103,63,0.65)] transition-all hover:-translate-y-px hover:bg-amber-deep disabled:opacity-50"
              >
                {startSession.isPending ? '세션 시작 중…' : '학습 시작'}
              </button>
            </div>
          )}

          <CardQueueList batch={batch.data} />

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-edge pt-6">
            <Link
              to="/dashboard"
              className="text-xs text-cream-mute no-underline hover:text-cream"
            >
              대시보드로 →
            </Link>
          </div>
        </div>
      )}
    </AppShell>
  );
}
