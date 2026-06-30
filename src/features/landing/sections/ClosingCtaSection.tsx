import { Link } from 'react-router-dom';
import { Icon } from '@/components/Icon';
import { useFadeUp } from '@/lib/motion/useFadeUp';

export function ClosingCtaSection() {
  const ref = useFadeUp<HTMLDivElement>();
  return (
    <section id="begin" className="relative overflow-hidden px-7 py-[130px]">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 -bottom-[160px] h-[640px] w-[640px] -translate-x-1/2 rounded-full bg-amber-soft"
        style={{ filter: 'blur(150px)' }}
      />
      <div ref={ref} className="relative mx-auto max-w-[880px] text-center">
        <div className="mb-[30px] flex items-center justify-center gap-3">
          <span aria-hidden className="h-px w-12 bg-edge-strong" />
          <span className="text-xs uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
            Begin Today
          </span>
          <span aria-hidden className="h-px w-12 bg-edge-strong" />
        </div>
        <h2 className="m-0 mb-10 font-serif text-[64px] font-medium leading-[1.08] tracking-[-0.025em] text-cream break-keep">
          오늘, <span className="italic text-amber">첫 카드</span>를 펴볼까요.
        </h2>
        <div className="flex flex-col items-center gap-5">
          <Link
            to="/login"
            className="group inline-flex items-center gap-3 rounded-full bg-amber py-[17px] pl-[30px] pr-[18px] text-lg font-medium text-white shadow-[0_10px_24px_-12px_rgba(196,103,63,0.65)] transition-all duration-[var(--dur-base)] ease-[var(--ease-spring)] hover:-translate-y-px hover:bg-amber-deep"
          >
            창가 자리로 앉기
            <span className="grid h-[34px] w-[34px] place-items-center rounded-full bg-white/20 transition-transform duration-[var(--dur-base)] ease-[var(--ease-spring)] group-hover:translate-x-0.5">
              <Icon name="solar:arrow-right-up-linear" width={18} height={18} />
            </span>
          </Link>
          <a
            href="mailto:hello@third-tool.dev"
            className="inline-flex items-center gap-2.5 text-sm text-cream-mute no-underline transition-colors hover:text-cream"
          >
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-amber" />
            hello@third-tool.dev
          </a>
        </div>
      </div>
    </section>
  );
}
