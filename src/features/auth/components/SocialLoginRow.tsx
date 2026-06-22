import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { track } from '@/lib/analytics/track';
import { useAuth } from '../hooks/useAuth';
import { CURRENT_USER_KEY } from '../hooks/useCurrentUser';
import { LEARNING_FACADE_KEY } from '../hooks/useLearningFacade';

type Provider = 'google';

interface Props {
  onSuccess?: () => void;
}

export function SocialLoginRow({ onSuccess }: Props) {
  const [pending, setPending] = useState<Provider | null>(null);
  const auth = useAuth();
  const qc = useQueryClient();

  const start = async (provider: Provider) => {
    setPending(provider);
    track('social_login_started', { provider });
    try {
      const res = await fetch(`/api/oauth2/authorization/${provider}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('oauth failed');
      const data = (await res.json().catch(() => ({}))) as { refreshToken?: string };
      if (data.refreshToken) {
        auth.setRefreshToken(data.refreshToken);
      }
      await qc.invalidateQueries({ queryKey: CURRENT_USER_KEY });
      await qc.invalidateQueries({ queryKey: LEARNING_FACADE_KEY });
      track('login_succeeded', { method: 'social', provider });
      onSuccess?.();
    } catch (err) {
      track('login_failed', { method: 'social', provider, code: 'OAUTH_FAILED' });
      throw err;
    } finally {
      setPending(null);
    }
  };

  return (
    <button
      type="button"
      onClick={() => start('google')}
      disabled={pending !== null}
      className="inline-flex w-full items-center justify-center gap-2.5 rounded-[12px] border border-edge-strong bg-surface px-5 py-[13px] text-sm font-medium text-cream transition-colors hover:bg-paper-2 disabled:opacity-50"
    >
      <span className="grid h-[18px] w-[18px] place-items-center rounded-md bg-paper-2 font-serif text-xs text-cream-mute">
        G
      </span>
      {pending === 'google' ? '연결 중…' : 'Google로 계속하기'}
    </button>
  );
}
