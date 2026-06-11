import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { FloatingKeywords } from '../components/FloatingKeywords';

const keywords = ['DDD', '관계형 모델링', 'Effective Java', 'JPA 영속성', '시스템 디자인', 'Kafka', 'gRPC'];

export function HeroSection() {
  return (
    <section className="mx-auto grid w-full max-w-[var(--container-max)] grid-cols-1 gap-12 px-4 pb-12 pt-24 sm:px-6 lg:grid-cols-[1.4fr_1fr] lg:gap-16 lg:px-8 lg:pb-24 lg:pt-32">
      <div className="flex flex-col justify-center gap-8 break-keep">
        <p className="font-display text-sm uppercase tracking-[var(--tracking-eyebrow)] text-amber">
          A place to study, slowly.
        </p>
        <h1 className="font-display text-5xl font-bold leading-snug text-cream md:text-6xl lg:text-7xl">
          Until you find your dream,
          <br />
          <span className="text-cream-mute">우리는 옆자리에 앉아 있을게요.</span>
        </h1>
        <p className="max-w-[58ch] text-lg leading-relaxed text-cream-mute">
          카페 한 켠에서 외우는 작은 카드부터, 당신만의 학습 지도까지.
          오늘 하루를 함께 채워봐요.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <Button
            size="lg"
            rightIcon={<Icon name="solar:arrow-right-linear" />}
          >
            오늘의 카드 펴기
          </Button>
          <Button size="md" variant="ghost">
            먼저 둘러볼게요
          </Button>
        </div>
      </div>
      <FloatingKeywords words={keywords} />
    </section>
  );
}
