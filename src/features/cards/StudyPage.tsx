import { useState } from 'react';
import { useTodayReview } from './hooks/useTodayReview';
import { TodayQueueView } from './sections/TodayQueueView';
import { TodayEmptyView } from './sections/TodayEmptyView';
import { CreateCardDialog } from './components/CreateCardDialog';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';

export function StudyPage() {
  const { data, isLoading, isError, refetch } = useTodayReview();
  const [createOpen, setCreateOpen] = useState(false);
  const [allDone, setAllDone] = useState(false);

  return (
    <main className="min-h-[100dvh] pt-20 pb-24">
      <div className="mx-auto flex max-w-3xl items-center justify-end px-4 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          size="md"
          rightIcon={<Icon name="solar:add-circle-linear" />}
          onClick={() => setCreateOpen(true)}
        >
          새 카드
        </Button>
      </div>

      <section className="mt-8">
        {isLoading && (
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <Skeleton className="h-72" />
          </div>
        )}

        {isError && (
          <EmptyState
            title="지금 카드를 가져오는 길이 막혀있어요"
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
        )}

        {data && data.cards.length === 0 && (
          <EmptyState
            title="아직 만날 카드가 없어요"
            body="첫 카드를 펼쳐볼까요?"
            action={
              <Button onClick={() => setCreateOpen(true)} rightIcon={<Icon name="solar:add-circle-linear" />}>
                새 카드 펴기
              </Button>
            }
          />
        )}

        {data && data.cards.length > 0 && !allDone && (
          <TodayQueueView session={data} onAllDone={() => setAllDone(true)} />
        )}

        {data && data.cards.length > 0 && allDone && (
          <TodayEmptyView onExtended={() => setAllDone(false)} />
        )}
      </section>

      <CreateCardDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </main>
  );
}
