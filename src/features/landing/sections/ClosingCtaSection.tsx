import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';

export function ClosingCtaSection() {
  return (
    <section className="px-4 py-[var(--section-py)] sm:px-6 lg:px-8">
      <div className="relative mx-auto max-w-[var(--container-max)] overflow-hidden rounded-[var(--radius-card-outer)] bg-surface px-8 py-20 ring-1 ring-edge md:px-16">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-amber/10 via-transparent to-transparent" />
        <div className="relative flex flex-col items-start gap-6 break-keep">
          <p className="font-display text-sm uppercase tracking-[var(--tracking-eyebrow)] text-amber">
            today
          </p>
          <h2 className="font-display text-4xl font-bold leading-snug text-cream md:text-6xl">
            오늘, 첫 카드를 쓰러 가볼까요?
          </h2>
          <p className="max-w-[60ch] text-lg text-cream-mute">
            아직 꿈이 흐려도 괜찮아요. 한 장씩 써내려가다 보면 윤곽이 잡혀요.
          </p>
          <Button size="lg" rightIcon={<Icon name="solar:arrow-right-linear" />}>
            창가 자리로 앉기
          </Button>
        </div>
      </div>
    </section>
  );
}
