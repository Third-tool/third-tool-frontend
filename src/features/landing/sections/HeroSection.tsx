import { Link } from 'react-router-dom';
import { Icon } from '@/components/Icon';

const REFERENCES = [
  'Effective Java',
  'DDD',
  'System Design Interview',
  'Designing Data-Intensive Applications',
  'Kafka 핵심 가이드',
  'SRE Book',
];

export function HeroSection() {
  return (
    <header id="top" className="relative overflow-hidden px-7 pt-[152px] pb-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(var(--color-edge) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
          WebkitMaskImage:
            'radial-gradient(ellipse 80% 60% at 50% 30%, #000 50%, transparent 100%)',
          maskImage:
            'radial-gradient(ellipse 80% 60% at 50% 30%, #000 50%, transparent 100%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-120px] h-[680px] w-[680px] -translate-x-1/2 rounded-full bg-amber-soft"
        style={{ filter: 'blur(140px)' }}
      />

      <div className="relative mx-auto grid w-full max-w-[1180px] grid-cols-1 items-center gap-16 lg:grid-cols-[1.25fr_1fr]">
        <div style={{ animation: 'fadeInUp .7s var(--ease-spring) both' }}>
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-edge bg-surface px-3.5 py-2 text-[12.5px] text-cream-mute">
            <span className="relative flex h-[7px] w-[7px]">
              <span
                aria-hidden
                className="absolute inset-0 rounded-full bg-amber opacity-60"
                style={{ animation: 'float 2s ease-in-out infinite' }}
              />
              <span className="relative h-[7px] w-[7px] rounded-full bg-amber" />
            </span>
            지금, 옆자리에서 카드를 펴고 있어요
          </span>

          <h1 className="mb-[26px] font-serif text-[64px] font-medium leading-[1.08] tracking-[-0.025em] text-cream break-keep">
            당신이 <span className="font-serif italic text-amber">꿈</span>을 찾을 때까지,
            <br />
            우리는 옆자리에 앉아 있을게요.
          </h1>

          <p className="mb-[38px] max-w-[48ch] text-[18px] leading-[1.7] text-cream-mute break-keep">
            카페 한 켠에서 외우는 작은 카드부터, 당신만의 학습 지도까지. 외운다는 부담 대신, 오늘 만날 한 장을 함께 펴봐요.
          </p>

          <div className="flex flex-wrap items-center gap-3.5">
            <Link
              to="/login"
              className="group inline-flex items-center gap-3 rounded-full bg-amber py-[15px] pl-[26px] pr-4 text-base font-medium text-white shadow-[0_10px_24px_-12px_rgba(196,103,63,0.65)] transition-all duration-[var(--dur-base)] ease-[var(--ease-spring)] hover:-translate-y-px hover:bg-amber-deep"
            >
              오늘의 카드 펴기
              <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-white/20 transition-transform duration-[var(--dur-base)] ease-[var(--ease-spring)] group-hover:translate-x-0.5">
                <Icon name="solar:arrow-right-linear" width={16} height={16} />
              </span>
            </Link>
            <a
              href="#concept"
              className="inline-flex items-center rounded-full border border-edge-strong px-7 py-[15px] text-base font-medium text-cream no-underline transition-all duration-[var(--dur-base)] ease-[var(--ease-spring)] hover:bg-paper-2"
            >
              먼저 둘러볼게요
            </a>
          </div>
        </div>

        <div
          className="relative"
          style={{ animation: 'fadeInUp .7s var(--ease-spring) .12s both' }}
        >
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-edge shadow-[0_40px_80px_-40px_rgba(33,31,26,0.45)]">
            <img
              src="https://picsum.photos/seed/third-cafe-window/900/1120"
              alt="카페 창가 자리"
              loading="lazy"
              className="h-full w-full object-cover"
              style={{ filter: 'saturate(0.94) brightness(1.02)' }}
            />
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to top, rgba(33,31,26,0.28), transparent 50%)',
              }}
            />
          </div>

          <div
            className="absolute -bottom-[26px] -left-[30px] w-[236px] rounded-[18px] border border-edge bg-surface px-5 py-[18px] shadow-[0_24px_50px_-24px_rgba(33,31,26,0.4)]"
            style={{ animation: 'float 6s ease-in-out infinite' }}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
                오늘의 카드
              </span>
              <span className="rounded-full bg-amber-soft px-2.5 py-0.5 text-[10.5px] font-semibold text-amber-deep">
                DAY 3
              </span>
            </div>
            <div className="mb-2 font-serif text-[19px] font-medium leading-tight text-cream">
              멱등성
            </div>
            <div className="text-[12.5px] leading-[1.5] text-cream-mute">
              같은 요청을 여러 번 보내도 결과가 한 번과 같도록.
            </div>
            <div className="mt-3.5 flex gap-1.5">
              <span className="rounded-md bg-paper-2 px-2.5 py-0.5 text-[10.5px] text-cream-mute">
                분산 시스템
              </span>
              <span className="rounded-md bg-paper-2 px-2.5 py-0.5 text-[10.5px] text-cream-mute">
                Kafka
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative mx-auto mt-[104px] w-full max-w-[1180px]">
        <div className="mb-[18px] flex items-center gap-2.5">
          <span className="text-xs uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
            곁에 두는 자료들
          </span>
          <span aria-hidden className="h-px flex-1 bg-edge" />
        </div>
        <div className="flex flex-wrap items-center gap-x-[30px] gap-y-3.5 font-serif text-[19px] text-cream-faint">
          {REFERENCES.map((label, i) => (
            <span key={label} className="flex items-center gap-x-[30px]">
              {label}
              {i < REFERENCES.length - 1 && (
                <span className="text-edge-strong">·</span>
              )}
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}
