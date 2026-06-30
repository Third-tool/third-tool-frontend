import { Icon } from '@/components/Icon';
import { InvertButton } from '@/components/InvertButton';
import type { ReviewSession } from '@/lib/api/schemas/review';

interface Props {
  session: ReviewSession;
  onStart: () => void;
}

const STATE_LABEL: Record<'DAY_1' | 'DAY_3' | 'DAY_7', string> = {
  DAY_1: '1일차',
  DAY_3: '3일차',
  DAY_7: '7일차',
};

export function ReviewSessionIntro({ session, onStart }: Props) {
  const total =
    session.stateBreakdown.DAY_1 + session.stateBreakdown.DAY_3 + session.stateBreakdown.DAY_7;
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-12 px-4 sm:px-6 lg:px-8 break-keep">
      <header className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <span className="font-serif text-lg italic text-cream/80">·</span>
          <span className="font-mono text-[11px] uppercase tracking-[var(--tracking-mono)] text-cream-mute">
            Today's Session
          </span>
          <span aria-hidden className="h-px max-w-32 flex-1 bg-gradient-to-r from-cream/30 to-transparent" />
        </div>

        <h1 className="font-display text-5xl font-bold leading-[0.95] tracking-tight text-cream md:text-7xl">
          오늘 만날{' '}
          <span className="font-serif font-normal italic text-cream-mute">{session.cards.length}장.</span>
        </h1>

        <p className="max-w-[56ch] text-lg leading-relaxed text-cream-mute">
          전체 {total}장 중 균형 잡힌 {session.cards.length}장이 준비됐어요. 천천히 한 장씩 만나봐요.
        </p>
      </header>

      <div className="grid grid-cols-3 gap-4">
        {(['DAY_1', 'DAY_3', 'DAY_7'] as const).map((state) => {
          const count = session.stateBreakdown[state];
          return (
            <div
              key={state}
              className="flex flex-col gap-3 rounded-sm border border-edge bg-surface/40 p-6 backdrop-blur-sm"
            >
              <span className="font-mono text-[10px] uppercase tracking-[var(--tracking-mono)] text-cream-faint">
                {STATE_LABEL[state]}
              </span>
              <span className="font-display text-3xl font-light text-cream md:text-4xl">
                {count}
                <span className="text-base text-cream-faint"> 장</span>
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between border-t border-edge pt-8">
        <p className="font-mono text-[11px] uppercase tracking-[var(--tracking-mono)] text-cream-faint">
          {session.cards.length === 0 ? '오늘은 쉬어도 좋아요' : 'Ready when you are'}
        </p>
        {session.cards.length > 0 && (
          <InvertButton onClick={onStart} rightIcon={<Icon name="solar:arrow-right-linear" />}>
            학습 시작하기
          </InvertButton>
        )}
      </div>
    </div>
  );
}
