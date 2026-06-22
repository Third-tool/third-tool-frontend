import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { Icon } from './Icon';

const NAV_ITEMS = [
  { name: 'STUDY', to: '/study' },
  { name: 'MAP', to: '/map' },
  { name: 'ARCHIVE', to: '/archive' },
];

export function GlassPillNav() {
  const [scrolled, setScrolled] = useState(false);
  const user = useCurrentUser();
  const authed = user.isSuccess;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-[var(--dur-base)] ease-[var(--ease-spring)] ${
        scrolled
          ? 'border-b border-edge bg-canvas/70 py-3 backdrop-blur-md'
          : 'border-b border-transparent py-6'
      }`}
    >
      <div className="mx-auto flex w-full max-w-[var(--container-max)] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="font-display text-lg font-bold tracking-tight text-cream transition-transform duration-[var(--dur-fast)] ease-[var(--ease-spring)] hover:scale-[1.02]"
        >
          third<span className="text-amber">.</span>
        </Link>

        <div className="hidden gap-8 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.name}
              to={item.to}
              className="group relative font-mono text-[11px] uppercase tracking-[var(--tracking-mono)] text-cream-mute transition-colors hover:text-cream"
            >
              {item.name}
              <span
                aria-hidden
                className="absolute -bottom-1 left-0 h-px w-0 bg-cream transition-all duration-[var(--dur-base)] ease-[var(--ease-spring)] group-hover:w-full"
              />
            </Link>
          ))}
        </div>

        {authed ? (
          <UserMenu username={user.data?.nickname ?? user.data?.username ?? 'User'} />
        ) : (
          <Link
            to="/login"
            className="rounded-full bg-amber px-4 py-1.5 text-xs font-medium text-canvas transition-transform duration-[var(--dur-fast)] ease-[var(--ease-spring)] hover:scale-[1.04]"
          >
            시작하기
          </Link>
        )}
      </div>
    </nav>
  );
}

function UserMenu({ username }: { username: string }) {
  const [open, setOpen] = useState(false);
  const logout = useLogout();
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="inline-flex items-center gap-2 rounded-full border border-edge px-4 py-1.5 font-mono text-[11px] uppercase tracking-[var(--tracking-mono)] text-cream-mute transition-colors hover:text-cream"
      >
        <span>{username}</span>
        <Icon name="solar:alt-arrow-down-linear" width={14} height={14} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 min-w-[160px] rounded-sm border border-edge bg-surface p-2 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="block w-full rounded-sm px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[var(--tracking-mono)] text-cream-mute transition-colors hover:bg-glass hover:text-cream"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
