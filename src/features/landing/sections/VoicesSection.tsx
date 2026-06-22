import { useFadeUp } from '@/lib/motion/useFadeUp';

interface Voice {
  slug: string;
  name: string;
  role: string;
  quote: string;
}

const VOICES: Voice[] = [
  {
    slug: 'voice-doyeon2',
    name: '도연',
    role: '주니어 백엔드 · 6개월차',
    quote: '"실패라는 말이 사라진 것만으로도 책상에 앉기가 수월해졌어요."',
  },
  {
    slug: 'voice-hayunseo2',
    name: '하윤서',
    role: '대학원생 · 자료 정리',
    quote: '"강의·책·블로그가 한 지도 위에 모여요. 다음에 뭘 볼지 정하기 편해요."',
  },
  {
    slug: 'voice-parkdohyeon2',
    name: '박도현',
    role: 'PM에서 개발 전향',
    quote: '"하루 30장 같은 부담 대신, 오늘 만날 카드를 정해주는 게 좋아요."',
  },
  {
    slug: 'voice-minjae2',
    name: '민재',
    role: '시니어 학습 코치',
    quote: '"학생에게 권하기 좋은 톤이에요. 따뜻하고 끈질긴 손길."',
  },
];

export function VoicesSection() {
  const headerRef = useFadeUp<HTMLDivElement>();

  return (
    <section
      id="voices"
      className="relative border-y border-edge bg-paper-2 px-7 pt-[30px] pb-[120px]"
    >
      <div className="mx-auto w-full max-w-[1180px] pt-[90px]">
        <div
          ref={headerRef}
          className="mb-[52px] flex flex-wrap items-end justify-between gap-6"
        >
          <div>
            <div className="mb-[18px] flex items-center gap-3">
              <span className="font-serif text-[19px] italic text-amber">04</span>
              <span className="text-xs uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
                Selected Voices
              </span>
            </div>
            <h2 className="m-0 font-serif text-[44px] font-medium leading-[1.1] tracking-[-0.02em] text-cream">
              조용히 들었던 <span className="italic text-amber">이야기</span>
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {VOICES.map((voice) => (
            <VoiceCard key={voice.slug} voice={voice} />
          ))}
        </div>
      </div>
    </section>
  );
}

function VoiceCard({ voice }: { voice: Voice }) {
  const ref = useFadeUp<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className="group flex gap-[22px] rounded-[20px] border border-edge bg-surface p-[26px]"
    >
      <div className="h-[120px] w-24 flex-shrink-0 overflow-hidden rounded-[14px]">
        <img
          src={`https://picsum.photos/seed/${voice.slug}/300/380`}
          alt={voice.name}
          loading="lazy"
          className="h-full w-full object-cover opacity-90 transition-all duration-700 ease-[var(--ease-spring)] group-hover:scale-[1.04] group-hover:opacity-100"
        />
      </div>
      <div className="flex flex-col">
        <p className="m-0 font-serif text-[21px] leading-[1.45] text-cream break-keep">
          {voice.quote}
        </p>
        <div className="mt-auto pt-[18px]">
          <div className="text-sm font-semibold text-cream">{voice.name}</div>
          <div className="text-xs text-cream-faint">{voice.role}</div>
        </div>
      </div>
    </div>
  );
}
