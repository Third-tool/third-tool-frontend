import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { EmptyState } from '@/components/EmptyState';
import { useExtendSession } from '../hooks/useExtendSession';

interface Props {
  onExtended: () => void;
}

export function TodayEmptyView({ onExtended }: Props) {
  const extend = useExtendSession();

  const requestMore = () => {
    extend.mutate(10, {
      onSuccess: (res) => {
        if (!res.completedAll) onExtended();
      },
    });
  };

  return (
    <EmptyState
      title="오늘 학습 가능한 카드를 모두 완료했습니다 👋"
      body="잠시 쉬어도 좋아요. 더 만나고 싶으면 한 번 더 펴볼게요."
      action={
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            onClick={requestMore}
            disabled={extend.isPending}
            rightIcon={<Icon name="solar:add-circle-linear" />}
          >
            10장 더 펴기
          </Button>
          <Button variant="ghost" onClick={() => window.history.back()}>
            오늘은 여기까지
          </Button>
        </div>
      }
    />
  );
}
