import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api/client';
import { socialLogin } from '@/lib/api/endpoints/auth';
import { track } from '@/lib/analytics/track';
import { SocialProviderSchema, type SocialProvider } from '@/lib/api/schemas/auth';
import { useAuth } from './hooks/useAuth';
import { CURRENT_USER_KEY } from './hooks/useCurrentUser';
import { LEARNING_FACADE_KEY } from './hooks/useLearningFacade';
import { consumePendingOAuth } from './oauth/providerConfig';

type Status = 'pending' | 'failed';

export function OAuthCallbackPage() {
  const { provider: rawProvider } = useParams<{ provider: string }>();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const auth = useAuth();
  const [status, setStatus] = useState<Status>('pending');
  const [message, setMessage] = useState<string>('소셜 로그인 마무리 중이에요…');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const parsed = SocialProviderSchema.safeParse(rawProvider);
    if (!parsed.success) {
      track('social_login_failed', { provider: rawProvider, code: 'PROVIDER_UNKNOWN' });
      setStatus('failed');
      setMessage('알 수 없는 소셜 제공자예요');
      return;
    }
    const provider: SocialProvider = parsed.data;

    // Provider-reported error (e.g. user cancelled) lands in ?error=...
    const providerError = search.get('error');
    if (providerError) {
      track('social_login_failed', { provider, code: providerError });
      setStatus('failed');
      setMessage('소셜 로그인을 취소했어요. 다시 시도해주세요');
      return;
    }

    const code = search.get('code');
    const state = search.get('state') ?? undefined;
    if (!code) {
      track('social_login_failed', { provider, code: 'CODE_MISSING' });
      setStatus('failed');
      setMessage('소셜 응답에 인증 코드가 없어요');
      return;
    }

    const pending = consumePendingOAuth(provider);
    if (!pending || pending.state !== state) {
      // CSRF check failed. Refuse the exchange rather than leak the code.
      track('social_login_failed', { provider, code: 'STATE_MISMATCH' });
      setStatus('failed');
      setMessage('세션이 일치하지 않아요. 다시 시도해주세요');
      return;
    }

    void (async () => {
      try {
        const res = await socialLogin(provider, { code, state });
        auth.setRefreshToken(res.refreshToken);
        await Promise.all([
          qc.invalidateQueries({ queryKey: CURRENT_USER_KEY }),
          qc.invalidateQueries({ queryKey: LEARNING_FACADE_KEY }),
        ]);
        track('login_succeeded', { method: 'social', provider });
        navigate(pending.next || '/home', { replace: true });
      } catch (err) {
        const errorCode = err instanceof ApiError ? err.code : 'UNKNOWN';
        track('social_login_failed', { provider, code: errorCode });
        setStatus('failed');
        if (err instanceof ApiError) {
          setMessage(err.message);
        } else {
          setMessage('지금은 소셜 로그인 길이 막혀있어요. 잠시 후 다시 이어가주세요');
        }
      }
    })();
  }, [rawProvider, search, auth, navigate, qc]);

  return (
    <div className="grid min-h-[100dvh] place-items-center bg-canvas px-7 py-16 text-cream">
      <div className="max-w-[420px] text-center">
        <h1 className="mb-3 font-serif text-[28px] font-medium tracking-[-0.01em] text-cream">
          {status === 'pending' ? '잠시만요' : '다시 시도해주세요'}
        </h1>
        <p className="m-0 mb-7 text-[15px] leading-[1.7] text-cream-mute break-keep">
          {message}
        </p>
        {status === 'failed' && (
          <button
            type="button"
            onClick={() => navigate('/login', { replace: true })}
            className="inline-flex items-center gap-2 rounded-[12px] bg-amber px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-amber-deep"
          >
            로그인으로 돌아가기
          </button>
        )}
      </div>
    </div>
  );
}
