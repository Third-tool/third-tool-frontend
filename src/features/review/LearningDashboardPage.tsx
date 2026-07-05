import { Link } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/Skeleton';
import { ApiError } from '@/lib/api/client';
import { isDashboardEmpty } from '@/lib/api/schemas/learningDashboard';
import { useLearningDashboard } from './hooks/useLearningDashboard';
import { TodayCompletionCard } from './components/TodayCompletionCard';
import { Recent7DaysCard } from './components/Recent7DaysCard';
import { CurrentStreakCard } from './components/CurrentStreakCard';

// product-review Epic 3 Story 3-2 · M5 신설 (2026-07-22+).
// /dashboard 라우트 · v1 minimal (Today · Recent7 · Streak 3 카드).
// L3 <RecommendationCard>는 M6 활성화 · v1은 recommendations=null 응답 잠금 유지.
function formatToday(): string {
  const d = new Date();
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export function LearningDashboardPage() {
  const dashboard = useLearningDashboard();

  const topbar = (
    <div className="flex items-center gap-2.5 text-[13px] text-cream-faint">
      <Link to="/home" className="no-underline hover:text-amber">
        홈
      </Link>
      <span className="opacity-50">/</span>
      <span className="font-medium text-cream-mute">학습 대시보드</span>
    </div>
  );

  return (
    <AppShell topbar={topbar}>
      {dashboard.isLoading && (
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      )}

      {dashboard.isError && (
        <EmptyState
          name="dashboard_error"
          title="대시보드를 불러오지 못했어요"
          body={
            dashboard.error instanceof ApiError
              ? dashboard.error.message
              : '잠시 후 다시 시도해주세요.'
          }
        />
      )}

      {dashboard.data && isDashboardEmpty(dashboard.data) && (
        <EmptyState
          name="dashboard_empty"
          title="아직 학습 기록이 없어요"
          body="학습을 시작하면 진행 상황이 여기 나타납니다."
          action={
            <Link
              to="/review"
              className="rounded-full bg-amber px-5 py-2.5 text-sm font-medium text-white no-underline shadow-[0_10px_24px_-12px_rgba(196,103,63,0.65)] hover:bg-amber-deep"
            >
              학습 시작
            </Link>
          }
        />
      )}

      {dashboard.data && !isDashboardEmpty(dashboard.data) && (
        <div className="flex flex-col gap-6">
          <header className="flex items-baseline justify-between gap-3">
            <h1 className="m-0 font-serif text-3xl text-cream">학습 대시보드</h1>
            <span className="text-xs text-cream-faint">{formatToday()}</span>
          </header>

          <div className="grid gap-4 md:grid-cols-3">
            <TodayCompletionCard
              today={dashboard.data.today}
              streak={dashboard.data.streak}
            />
            <Recent7DaysCard recent7Days={dashboard.data.recent7Days} />
            <CurrentStreakCard streak={dashboard.data.streak} />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-edge pt-6">
            <Link
              to="/review"
              className="text-xs text-cream-mute no-underline hover:text-cream"
            >
              학습으로 →
            </Link>
            <Link
              to="/me"
              className="text-xs text-cream-mute no-underline hover:text-cream"
            >
              스케줄 조정 →
            </Link>
          </div>
        </div>
      )}
    </AppShell>
  );
}
