import { Icon } from '@/components/Icon';
import { useFadeUp } from '@/lib/motion/useFadeUp';

interface Ritual {
  index: string;
  meta: string;
  icon: string;
  title: string;
  body: string;
}

const RITUALS: Ritual[] = [
  {
    index: '01',
    meta: 'Card',
    icon: 'solar:notebook-square-linear',
    title: '카드 쓰기',
    body: '오늘 만난 한 문장을 카드로. 키워드 한 개와 태그면 충분해요.',
  },
  {
    index: '02',
    meta: 'Review',
    icon: 'solar:calendar-mark-linear',
    title: '매일 만나기',
    body: '1·3·7일. soft schedule을 따라 잊을 만하면 다시 마주칩니다.',
  },
  {
    index: '03',
    meta: 'Facade',
    icon: 'solar:book-2-linear',
    title: '지도 단련',
    body: 'Layer 1 → 축 → 주제. 더 정확한 표현을 찾을 때마다 지도가 단단해집니다.',
  },
  {
    index: '04',
    meta: 'Materials',
    icon: 'solar:bookmark-linear',
    title: '자료 연결',
    body: '책·강의·AI 대화·웹 리소스. 주제마다 어떤 자료가 받쳐주는지 한눈에.',
  },
];

export function ThreeStepsSection() {
  const headerRef = useFadeUp<HTMLDivElement>();

  return (
    <section id="rituals" className="relative px-7 pt-[30px] pb-[120px]">
      <div className="mx-auto w-full max-w-[1180px]">
        <div
          ref={headerRef}
          className="mb-12 flex flex-wrap items-end justify-between gap-8"
        >
          <div>
            <div className="mb-[18px] flex items-center gap-3">
              <span className="font-serif text-[19px] italic text-amber">03</span>
              <span className="text-xs uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
                The Method
              </span>
            </div>
            <h2 className="m-0 font-serif text-[44px] font-medium leading-[1.1] tracking-[-0.02em] text-cream">
              매일의 <span className="italic text-amber">의식</span>
            </h2>
          </div>
          <p className="max-w-[38ch] text-base leading-[1.7] text-cream-mute break-keep">
            매일 만나는 네 가지. 카드를 쓰고, 순환을 듣고, 지도를 다듬고, 자료를 잇습니다.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
          {RITUALS.map((ritual) => (
            <RitualCard key={ritual.index} ritual={ritual} />
          ))}
        </div>
      </div>
    </section>
  );
}

function RitualCard({ ritual }: { ritual: Ritual }) {
  const ref = useFadeUp<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className="group rounded-[20px] border border-edge bg-surface p-7 transition-all duration-[var(--dur-base)] ease-[var(--ease-spring)] hover:-translate-y-[3px] hover:border-amber-line"
    >
      <div className="mb-7 flex items-center justify-between">
        <span className="font-serif text-base italic text-cream-faint">{ritual.index}</span>
        <span className="text-[10.5px] uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
          {ritual.meta}
        </span>
      </div>
      <div className="mb-[22px] grid h-[46px] w-[46px] place-items-center rounded-full bg-paper-2 text-cream transition-all duration-[var(--dur-base)] ease-[var(--ease-spring)] group-hover:bg-amber group-hover:text-white">
        <Icon name={ritual.icon} width={22} height={22} />
      </div>
      <h3 className="mb-2.5 m-0 font-serif text-[22px] font-medium text-cream">{ritual.title}</h3>
      <p className="m-0 text-sm leading-[1.6] text-cream-mute break-keep">{ritual.body}</p>
    </div>
  );
}
