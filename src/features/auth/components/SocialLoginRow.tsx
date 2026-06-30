import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { track } from '@/lib/analytics/track';
import { PROVIDERS, startOAuthFlow } from '../oauth/providerConfig';
import type { SocialProvider } from '@/lib/api/schemas/auth';

interface Props {
  // Kept for source compatibility with LoginForm; the actual success navigation
  // happens on the /oauth/{provider}/callback page after BE token exchange.
  onSuccess?: () => void;
}

const BADGE_STYLE: Record<SocialProvider, { bg: string; fg: string; mark: string }> = {
  kakao: { bg: '#FEE500', fg: '#191600', mark: 'K' },
  naver: { bg: '#03C75A', fg: '#FFFFFF', mark: 'N' },
};

export function SocialLoginRow(_: Props) {
  const [pending, setPending] = useState<SocialProvider | null>(null);
  const [inline, setInline] = useState<string | null>(null);
  const [search] = useSearchParams();
  const next = search.get('next') ?? '/home';

  const start = (provider: SocialProvider) => {
    const cfg = PROVIDERS[provider];
    if (!cfg.clientId) {
      setInline(`${provider.toUpperCase()} 로그인 준비 중이에요`);
      track('social_login_skipped', { provider, reason: 'client_id_missing' });
      return;
    }
    setInline(null);
    setPending(provider);
    track('social_login_started', { provider });
    try {
      // Browser navigates away after this; no follow-up state to clear locally.
      startOAuthFlow(provider, next);
    } catch (err) {
      setPending(null);
      const msg = err instanceof Error ? err.message : 'unknown';
      track('social_login_failed', { provider, code: 'START_FAILED', message: msg });
      setInline('지금은 소셜 로그인 길이 막혀있어요. 잠시 후 다시 이어가주세요');
    }
  };

  return (
    <div className="flex flex-col gap-2.5">
      {(Object.keys(PROVIDERS) as SocialProvider[]).map((provider) => {
        const cfg = PROVIDERS[provider];
        const badge = BADGE_STYLE[provider];
        const disabled = pending !== null || !cfg.clientId;
        return (
          <button
            key={provider}
            type="button"
            onClick={() => start(provider)}
            disabled={disabled}
            className="inline-flex w-full items-center justify-center gap-2.5 rounded-[12px] border border-edge-strong bg-surface px-5 py-[13px] text-sm font-medium text-cream transition-colors hover:bg-paper-2 disabled:opacity-50"
          >
            <span
              aria-hidden
              className="grid h-[18px] w-[18px] place-items-center rounded-md text-[11px] font-semibold"
              style={{ backgroundColor: badge.bg, color: badge.fg }}
            >
              {badge.mark}
            </span>
            {pending === provider ? '연결 중…' : cfg.label}
          </button>
        );
      })}
      {inline && (
        <p role="alert" className="text-[12.5px] text-amber-deep">
          {inline}
        </p>
      )}
    </div>
  );
}
