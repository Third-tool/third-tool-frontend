import { Icon } from '@/components/Icon';
import { useArchiveCard } from '../hooks/useArchiveCard';
import type { ReviewSession } from '@/lib/api/schemas/review';

const DAY_TONE: Record<'DAY_1' | 'DAY_3' | 'DAY_7', { bg: string; color: string; label: string }> = {
  DAY_1: { bg: 'bg-amber-soft', color: 'text-amber-deep', label: 'DAY 1' },
  DAY_3: { bg: 'bg-amber-soft', color: 'text-amber-deep', label: 'DAY 3' },
  DAY_7: { bg: 'bg-sage-soft', color: 'text-sage-ink', label: 'DAY 7' },
};

interface Props {
  session: ReviewSession;
  index: number;
  onAdvance: () => void;
  isLast: boolean;
}

export function TodayQueueView({ session, index, onAdvance, isLast }: Props) {
  const archive = useArchiveCard();

  const card = session.cards[index];

  if (!card) return null;

  const tone = DAY_TONE[card.state];

  return (
    <div className="w-full max-w-[600px]">
      <div
        className="rounded-[24px] border border-edge bg-surface p-10 shadow-[0_34px_70px_-36px_rgba(33,31,26,0.42)]"
        style={{ animation: 'fadeInUp .45s var(--ease-spring) both' }}
      >
        <div className="mb-[26px] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className={`rounded-full px-3 py-[5px] text-[11px] font-semibold tracking-[0.04em] ${tone.bg} ${tone.color}`}
            >
              {tone.label}
            </span>
            {card.deckName && (
              <span className="text-[11.5px] text-cream-faint">{card.deckName}</span>
            )}
          </div>
          <span className="text-xs tabular-nums text-cream-faint">
            {index + 1} / {session.cards.length}
          </span>
        </div>

        <p className="m-0 mb-7 font-serif text-[32px] font-medium leading-[1.4] tracking-[-0.01em] text-cream break-keep">
          {card.summary}
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3.5">
        <button
          type="button"
          onClick={() => archive.mutate(card.cardId, { onSuccess: onAdvance })}
          disabled={archive.isPending}
          className="inline-flex items-center gap-2.5 rounded-full border border-edge bg-transparent px-[22px] py-3 text-sm font-medium text-cream-mute transition-all duration-[var(--dur-fast)] ease-[var(--ease-spring)] hover:border-edge-strong hover:bg-paper-2 disabled:opacity-50"
        >
          <Icon name="solar:archive-linear" width={16} height={16} />
          잠시 쉬러 보내기
        </button>
        <button
          type="button"
          onClick={onAdvance}
          className="group inline-flex items-center gap-3 rounded-full bg-amber py-3.5 pl-[26px] pr-4 text-[15px] font-medium text-white shadow-[0_10px_24px_-12px_rgba(196,103,63,0.65)] transition-all duration-[var(--dur-base)] ease-[var(--ease-spring)] hover:-translate-y-px hover:bg-amber-deep"
        >
          {isLast ? '마치기' : '다음 카드'}
          <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-white/20 transition-transform duration-[var(--dur-base)] ease-[var(--ease-spring)] group-hover:translate-x-0.5">
            <Icon name="solar:arrow-right-linear" width={16} height={16} />
          </span>
        </button>
      </div>
      <p className="m-0 mt-[22px] text-center text-[12.5px] text-cream-faint break-keep">
        머릿속에 한 번 떠올린 뒤, 다음으로 넘어가요. 정답을 맞히는 게 아니라 다시 만나는 거예요.
      </p>
    </div>
  );
}
