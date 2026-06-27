import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Icon } from '@/components/Icon';
import { ApiError } from '@/lib/api/client';
import { track } from '@/lib/analytics/track';
import { useLogin } from '../hooks/useLogin';
import { AuthField } from './AuthField';
import { SocialLoginRow } from './SocialLoginRow';

// Keyed by backend ErrorCode short codes (ErrorCode.java).
const ERROR_COPY: Record<string, string> = {
  USER001: '이메일과 비밀번호를 다시 확인해주세요', // USER_NOT_FOUND
  USER005: '이메일과 비밀번호를 다시 확인해주세요', // PASSWORD_NOT_MATCHED
  USER004: '계정 보호를 위해 잠시 잠겨 있어요', // USER_LOCKED
  USER006: '소셜 로그인 계정이에요. 아래 버튼으로 이어가주세요', // USER_IS_SOCIAL
  C001: '이메일과 비밀번호를 입력해주세요', // INVALID_INPUT
};

export function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [inline, setInline] = useState<string | null>(null);
  const login = useLogin();
  const navigate = useNavigate();
  const [search] = useSearchParams();

  const next = search.get('next') ?? '/home';

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setInline(null);
    track('login_submitted', { method: 'password' });
    login.mutate(
      { username: username.trim(), password },
      {
        onSuccess: () => {
          track('login_succeeded', { method: 'password' });
          navigate(next, { replace: true });
        },
        onError: (err) => {
          const code = err instanceof ApiError ? err.code : 'UNKNOWN';
          track('login_failed', { method: 'password', code });
          if (err instanceof ApiError && ERROR_COPY[err.code]) {
            setInline(ERROR_COPY[err.code] ?? null);
          } else {
            setInline('지금 길이 막혀있어요. 잠시 후 다시 이어가주세요');
          }
        },
      },
    );
  };

  const canSubmit = username.trim().length > 0 && password.length > 0 && !login.isPending;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <AuthField
        label="아이디"
        icon="solar:letter-linear"
        type="email"
        autoComplete="email"
        placeholder="hello@third-tool.dev"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />

      <AuthField
        label="비밀번호"
        icon="solar:lock-keyhole-minimalistic-linear"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        rightSlot={
          <button
            type="button"
            className="text-xs text-cream-faint transition-colors hover:text-amber"
          >
            비밀번호를 잊으셨나요?
          </button>
        }
      />

      <div className="min-h-[1.25rem]">
        {inline && (
          <p role="alert" className="text-[12.5px] text-amber-deep">
            {inline}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="mt-2 inline-flex items-center justify-center gap-3 rounded-[12px] bg-amber px-5 py-[15px] text-[15px] font-medium text-white shadow-[0_10px_24px_-12px_rgba(196,103,63,0.65)] transition-all duration-[var(--dur-base)] ease-[var(--ease-spring)] hover:-translate-y-px hover:bg-amber-deep disabled:opacity-50"
      >
        {login.isPending ? '들어가는 중…' : '들어가기'}
        <Icon name="solar:arrow-right-linear" width={16} height={16} />
      </button>

      <div className="my-2 flex items-center gap-3.5">
        <span aria-hidden className="h-px flex-1 bg-edge" />
        <span className="text-xs text-cream-faint">또는</span>
        <span aria-hidden className="h-px flex-1 bg-edge" />
      </div>

      <SocialLoginRow onSuccess={() => navigate(next, { replace: true })} />
    </form>
  );
}
