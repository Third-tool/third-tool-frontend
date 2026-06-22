import { useEffect, useRef, useState } from 'react';
import { track } from '@/lib/analytics/track';

interface Props {
  variant?: 'error' | 'timeout' | 'forbidden';
  requestId?: string | null;
  onRetry?: () => void;
  title?: string;
  body?: string;
}

const COPY: Record<NonNullable<Props['variant']>, { tag: string; title: string; body: string }> = {
  error: {
    tag: 'System Pause',
    title: '잠시 길이 막혀있어요',
    body: '잠깐 우리가 정리하고 있어요. 다시 이어가주세요.',
  },
  timeout: {
    tag: 'Slow Response',
    title: '응답이 늦어지고 있어요',
    body: '잠시 후 다시 이어가볼게요.',
  },
  forbidden: {
    tag: 'Locked Path',
    title: '이 길은 잠시 닫혀있어요',
    body: '다른 길로 돌아가볼까요.',
  },
};

export function ErrorScreen({
  variant = 'error',
  requestId = null,
  onRetry,
  title,
  body,
}: Props) {
  const copy = COPY[variant];
  const reportedRef = useRef(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (reportedRef.current) return;
    reportedRef.current = true;
    track('internal_error_seen', { variant, requestId });
  }, [variant, requestId]);

  const handleCopy = async () => {
    if (!requestId) return;
    try {
      await navigator.clipboard.writeText(requestId);
      track('request_id_copied', { requestId });
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard write may fail; ignore silently
    }
  };

  const handleRetry = () => {
    if (onRetry) onRetry();
    else window.location.reload();
  };

  return (
    <div className="grid min-h-[100dvh] place-items-center bg-canvas px-4 text-center">
      <div className="flex max-w-[44ch] flex-col items-center gap-5">
        <span className="font-mono text-[11px] uppercase tracking-[var(--tracking-mono)] text-cream-faint">
          {copy.tag}
        </span>
        <p className="font-display text-2xl text-cream">{title ?? copy.title}</p>
        <p className="text-cream-mute">{body ?? copy.body}</p>

        {requestId && (
          <button
            type="button"
            onClick={handleCopy}
            className="mt-2 inline-flex items-center gap-2 rounded-full border border-edge bg-glass px-4 py-2 font-mono text-[11px] tracking-[var(--tracking-mono)] text-cream-mute transition-colors hover:text-cream"
            aria-label="request id 복사"
          >
            <span className="uppercase text-cream-faint">Request ID</span>
            <span className="text-cream">{requestId}</span>
            <span className="text-cream-faint">{copied ? '· 복사됨' : '· 복사'}</span>
          </button>
        )}

        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={handleRetry}
            className="rounded-full bg-cream px-6 py-3 font-mono text-xs uppercase tracking-[var(--tracking-mono)] text-canvas transition-transform duration-[var(--dur-fast)] ease-[var(--ease-spring)] hover:scale-[1.02]"
          >
            다시 시도
          </button>
          <a
            href="/"
            className="rounded-full border border-edge px-6 py-3 font-mono text-xs uppercase tracking-[var(--tracking-mono)] text-cream-mute transition-colors hover:bg-glass hover:text-cream"
          >
            처음으로
          </a>
        </div>
      </div>
    </div>
  );
}
