import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className="fixed inset-x-0 top-0 z-50 transition-all duration-[var(--dur-base)] ease-[var(--ease-spring)]"
      style={{
        padding: scrolled ? '12px 0' : '20px 0',
        background: scrolled ? 'rgba(250,248,243,0.82)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled
          ? '1px solid var(--color-edge)'
          : '1px solid transparent',
      }}
    >
      <div className="mx-auto flex w-full max-w-[1180px] items-center justify-between px-7">
        <a href="#top" className="flex items-center gap-2.5 no-underline">
          <span className="grid h-[27px] w-[27px] place-items-center rounded-md bg-amber font-serif text-base font-semibold text-white">
            t
          </span>
          <span className="font-serif text-[21px] font-semibold tracking-[-0.01em] text-cream">
            third
          </span>
        </a>
        <div className="hidden items-center gap-[30px] sm:flex">
          <a
            href="#concept"
            className="text-sm text-cream-mute transition-colors hover:text-cream"
          >
            개념
          </a>
          <a
            href="#rituals"
            className="text-sm text-cream-mute transition-colors hover:text-cream"
          >
            순환
          </a>
          <a
            href="#voices"
            className="text-sm text-cream-mute transition-colors hover:text-cream"
          >
            이야기
          </a>
          <a
            href="#faq"
            className="text-sm text-cream-mute transition-colors hover:text-cream"
          >
            FAQ
          </a>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-full bg-amber px-5 py-2.5 text-[13.5px] font-medium text-white shadow-[0_10px_24px_-12px_rgba(196,103,63,0.65)] transition-all duration-[var(--dur-base)] ease-[var(--ease-spring)] hover:-translate-y-px hover:bg-amber-deep"
          >
            시작하기
          </Link>
        </div>
      </div>
    </nav>
  );
}
