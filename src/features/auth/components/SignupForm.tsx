import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@/components/Icon';
import { ApiError } from '@/lib/api/client';
import { track } from '@/lib/analytics/track';
import { useSignup } from '../hooks/useSignup';
import { AuthField } from './AuthField';

// Keyed by backend ErrorCode short codes (ErrorCode.java).
const ERROR_COPY: Record<string, string> = {
  USER003: '이미 자리가 있는 이메일이에요. 로그인으로 이어가볼까요?', // USER_ALREADY_EXISTS
  C001: '모든 필드를 채워주세요', // INVALID_INPUT
};

export function SignupForm() {
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inline, setInline] = useState<string | null>(null);
  const signup = useSignup();
  const navigate = useNavigate();

  const canSubmit =
    nickname.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 8 &&
    !signup.isPending;

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setInline(null);
    track('signup_submitted');
    signup.mutate(
      {
        username: email.trim(),
        password,
        nickname: nickname.trim(),
        email: email.trim(),
      },
      {
        onSuccess: () => {
          track('signup_succeeded');
          navigate('/onboarding', { replace: true });
        },
        onError: (err) => {
          const code = err instanceof ApiError ? err.code : 'UNKNOWN';
          track('signup_failed', { code });
          if (err instanceof ApiError && ERROR_COPY[err.code]) {
            setInline(ERROR_COPY[err.code] ?? null);
          } else {
            setInline('지금 가입이 어려워요. 잠시 후 다시 이어가주세요');
          }
        },
      },
    );
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <AuthField
        label="닉네임"
        icon="solar:user-linear"
        autoComplete="nickname"
        placeholder="옆자리에서 부를 이름"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        required
      />

      <AuthField
        label="아이디"
        icon="solar:letter-linear"
        type="email"
        autoComplete="email"
        placeholder="hello@third-tool.dev"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <AuthField
        label="비밀번호"
        icon="solar:lock-keyhole-minimalistic-linear"
        type="password"
        autoComplete="new-password"
        placeholder="8자 이상"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
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
        {signup.isPending ? '자리 만드는 중…' : '시작하기'}
        <Icon name="solar:arrow-right-linear" width={16} height={16} />
      </button>
    </form>
  );
}
