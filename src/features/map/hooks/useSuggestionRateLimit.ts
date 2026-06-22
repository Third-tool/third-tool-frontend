import { useEffect, useRef, useState } from 'react';
import { ApiError } from '@/lib/api/client';
import { track } from '@/lib/analytics/track';

const DEFAULT_RETRY_AFTER_SEC = 30;

export type SuggestionScope = 'axis' | 'topic';

export function useSuggestionRateLimit(scope: SuggestionScope, error: unknown) {
  const isRateLimited =
    error instanceof ApiError &&
    (error.status === 429 || error.code === 'AUTH_RATE_LIMIT');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const reportedRef = useRef(false);

  useEffect(() => {
    if (!isRateLimited) {
      reportedRef.current = false;
      setSecondsLeft(0);
      return;
    }
    if (!reportedRef.current) {
      reportedRef.current = true;
      track('ai_suggestion_rate_limited', { scope });
    }
    setSecondsLeft(DEFAULT_RETRY_AFTER_SEC);
    const id = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [isRateLimited, scope]);

  return {
    active: isRateLimited,
    secondsLeft,
    canRetry: isRateLimited && secondsLeft === 0,
  };
}
