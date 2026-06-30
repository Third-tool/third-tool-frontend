import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  eyebrow: string;
  title: ReactNode;
  subtitle: string;
  children: ReactNode;
  switchText: string;
  switchAction: string;
  switchTo: string;
}

export function SplitAuthLayout({
  eyebrow,
  title,
  subtitle,
  children,
  switchText,
  switchAction,
  switchTo,
}: Props) {
  return (
    <div className="flex min-h-[100dvh] bg-canvas text-cream">
      <aside className="relative hidden w-[46%] flex-shrink-0 flex-col justify-between overflow-hidden border-r border-edge bg-paper-2 p-10 lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              'radial-gradient(var(--color-edge) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-20 -bottom-40 h-[520px] w-[520px] rounded-full bg-amber-soft"
          style={{ filter: 'blur(140px)' }}
        />

        <Link to="/" className="relative flex items-center gap-2.5 no-underline">
          <span className="grid h-[30px] w-[30px] place-items-center rounded-lg bg-amber font-serif text-lg font-semibold text-white">
            t
          </span>
          <span className="font-serif text-[23px] font-semibold text-cream">third</span>
        </Link>

        <div className="relative">
          <p className="m-0 mb-6 max-w-[18ch] font-serif text-[40px] font-medium leading-[1.18] tracking-[-0.02em] text-cream break-keep">
            당신이 <span className="italic text-amber">꿈</span>을 찾을 때까지,
            <br />
            옆자리에 앉아 있을게요.
          </p>
          <div className="flex max-w-[380px] items-center gap-3.5 rounded-[16px] border border-edge bg-surface px-5 py-[18px]">
            <span className="grid h-[42px] w-[42px] flex-shrink-0 place-items-center rounded-full border border-amber-line bg-amber-soft font-serif text-lg font-medium text-amber-deep">
              도
            </span>
            <div>
              <p className="m-0 mb-1.5 font-serif text-[15.5px] leading-[1.4] text-cream break-keep">
                "실패라는 말이 사라진 것만으로 책상에 앉기가 수월해졌어요."
              </p>
              <span className="text-[11.5px] text-cream-faint">도연 · 주니어 백엔드</span>
            </div>
          </div>
        </div>

        <div className="relative flex gap-6 text-xs text-cream-faint">
          <span>순환 1 · 3 · 7</span>
          <span>학습 지도</span>
          <span>참조 보관함</span>
        </div>
      </aside>

      <div className="flex flex-1 items-center justify-center px-7 py-10">
        <div
          className="w-full max-w-[400px]"
          style={{ animation: 'fadeInUp .5s var(--ease-spring) both' }}
        >
          <div className="mb-[34px]">
            <span className="mb-3.5 block text-xs uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
              {eyebrow}
            </span>
            <h1 className="m-0 mb-2.5 font-serif text-[34px] font-medium leading-[1.15] tracking-[-0.02em] text-cream">
              {title}
            </h1>
            <p className="m-0 text-[14.5px] text-cream-mute break-keep">{subtitle}</p>
          </div>

          {children}

          <p className="mt-7 text-center text-[13.5px] text-cream-mute">
            {switchText}{' '}
            <Link
              to={switchTo}
              className="border-0 bg-transparent px-0.5 text-[13.5px] font-semibold text-amber-deep no-underline hover:underline"
            >
              {switchAction}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
