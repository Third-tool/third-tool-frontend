import { NavLink, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Icon } from './Icon';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { DeckSelector } from '@/features/decks/components/DeckSelector';

interface NavItem {
  to: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/home', label: '오늘', icon: 'solar:sun-linear' },
  { to: '/map', label: '지도', icon: 'solar:book-2-linear' },
  { to: '/archive', label: '보관함', icon: 'solar:archive-linear' },
  { to: '/tags', label: '태그', icon: 'solar:tag-linear' },
];

interface Props {
  contextSlot?: ReactNode;
  archiveCount?: number;
}

export function Sidebar({ contextSlot, archiveCount }: Props) {
  const user = useCurrentUser();
  const location = useLocation();
  const nickname = user.data?.nickname ?? user.data?.username ?? '게스트';
  const initial = nickname.slice(0, 1);
  const onMe = location.pathname.startsWith('/me');

  return (
    <aside className="sticky top-0 flex h-[100dvh] w-[236px] shrink-0 flex-col gap-2 self-start border-r border-edge bg-paper-2 px-4 py-5">
      <div className="flex items-center gap-2.5 px-2.5 pb-4 pt-1.5">
        <span
          className="grid h-[26px] w-[26px] place-items-center rounded-md bg-amber font-serif text-base font-semibold text-white"
          aria-hidden
        >
          t
        </span>
        <span className="font-serif text-xl font-semibold tracking-[-0.01em] text-cream">
          third
        </span>
      </div>

      <nav className="flex flex-col gap-[3px]">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/home'}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-[9px] px-[11px] py-2.5 text-sm transition-colors duration-[var(--dur-fast)] ease-[var(--ease-spring)]',
                isActive
                  ? 'bg-amber-soft font-semibold text-amber-deep'
                  : 'font-medium text-cream-mute hover:bg-paper hover:text-cream',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`grid place-items-center ${isActive ? 'text-amber' : 'text-cream-faint'}`}
                  aria-hidden
                >
                  <Icon name={item.icon} width={19} height={19} />
                </span>
                <span>{item.label}</span>
                {item.label === '보관함' && archiveCount !== undefined && (
                  <span className="ml-auto text-[11px] text-cream-faint">
                    {archiveCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {user.data && (
        <div className="mt-4">
          <DeckSelector />
        </div>
      )}

      {contextSlot && <div className="mt-4">{contextSlot}</div>}

      <NavLink
        to="/me"
        className={`mt-auto flex items-center gap-3 rounded-[11px] p-2.5 no-underline transition-colors ${
          onMe ? 'border border-amber-line bg-amber-soft' : 'hover:bg-paper'
        }`}
      >
        <span
          className="grid h-8 w-8 place-items-center rounded-full border border-amber-line bg-surface font-serif text-[15px] font-medium text-amber-deep"
          aria-hidden
        >
          {initial}
        </span>
        <div className="leading-tight">
          <div className="text-[13px] font-medium text-cream">{nickname}</div>
          <div className={`text-[11px] ${onMe ? 'text-amber-deep' : 'text-cream-faint'}`}>
            {onMe ? '내 프로필' : '곁자리'}
          </div>
        </div>
      </NavLink>
    </aside>
  );
}
