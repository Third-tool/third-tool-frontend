import { useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { useViewCard } from '../hooks/useViewCard';
import { useArchiveCard } from '../hooks/useArchiveCard';
import { OnFieldCardFace } from '../components/OnFieldCardFace';
import { ProgressIndicator } from '../components/ProgressIndicator';
import type { ReviewSession } from '@/lib/api/schemas/review';

const MAX_VIEW = 5;

interface Props {
  session: ReviewSession;
  onAllDone: () => void;
}

export function TodayQueueView({ session, onAllDone }: Props) {
  const [index, setIndex] = useState(0);
  const view = useViewCard();
  const archive = useArchiveCard();

  const card = session.cards[index];

  useEffect(() => {
    if (card) view.mutate(card.cardId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card?.cardId]);

  const goNext = () => {
    if (index + 1 >= session.cards.length) {
      onAllDone();
    } else {
      setIndex((i) => i + 1);
    }
  };

  if (!card) {
    onAllDone();
    return null;
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
      <ProgressIndicator
        current={index + 1}
        total={session.cards.length}
        stateLabel={card.state}
      />
      <OnFieldCardFace
        summary={card.summary}
        keywords={[]}
        viewCount={view.data?.viewCount ?? 0}
        maxView={MAX_VIEW}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="ghost"
          onClick={() => archive.mutate(card.cardId, { onSuccess: goNext })}
          disabled={archive.isPending}
        >
          잠시 쉬러 보내기
        </Button>
        <Button onClick={goNext} rightIcon={<Icon name="solar:arrow-right-linear" />}>
          다음 카드
        </Button>
      </div>
    </div>
  );
}
