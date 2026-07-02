import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ApiError } from '@/lib/api/client';
import { track } from '@/lib/analytics/track';
import { ErrorScreen } from '@/components/ErrorScreen';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { useLearningFacade } from '@/features/auth/hooks/useLearningFacade';
import { LandingPage } from '@/features/landing/LandingPage';

// Backend ErrorCode short codes (Common/Exception/ErrorCode/ErrorCode.java).
const AUTH_FAIL_CODES = new Set([
  'AUTH001', // AUTH_TOKEN_MISSING
  'AUTH002', // AUTH_TOKEN_EXPIRED
  'AUTH003', // AUTH_TOKEN_INVALID
  'AUTH004', // AUTH_USER_NOT_FOUND
  'AUTH101', // REFRESH_TOKEN_INVALID
  'AUTH102', // REFRESH_TOKEN_NOT_FOUND
  'AUTH103', // REFRESH_TOKEN_REUSED
  'AUTH104', // REFRESH_TOKEN_MISSING
  'USER001', // USER_NOT_FOUND (login fail)
]);

type Outcome =
  | 'pending'
  | 'landing'
  | 'onboarding'
  | 'home'
  | 'error'
  | 'timeout'
  | 'maintenance';
type Tier = 'invisible' | 'spinner' | 'message' | 'timeout';

function useLoadTier(enabled: boolean): Tier {
  const [tier, setTier] = useState<Tier>('invisible');
  useEffect(() => {
    if (!enabled) {
      setTier('invisible');
      return;
    }
    const t1 = setTimeout(() => setTier('spinner'), 300);
    const t2 = setTimeout(() => setTier('message'), 3000);
    const t3 = setTimeout(() => setTier('timeout'), 10000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [enabled]);
  return tier;
}

function isAuthFail(err: unknown) {
  return err instanceof ApiError && AUTH_FAIL_CODES.has(err.code);
}

function isMaintenance(err: unknown) {
  return err instanceof ApiError && (err.code === 'MAINTENANCE' || err.status === 503);
}

function extractRequestId(err: unknown): string | null {
  return err instanceof ApiError ? err.requestId : null;
}

export function BootstrapGate() {
  const user = useCurrentUser();
  const facade = useLearningFacade(user.isSuccess);
  const loading = user.isLoading || (user.isSuccess && facade.isLoading);
  const tier = useLoadTier(loading);

  let outcome: Outcome = 'pending';
  let requestId: string | null = null;
  if (user.isError) {
    if (isMaintenance(user.error)) outcome = 'maintenance';
    else if (isAuthFail(user.error)) outcome = 'landing';
    else outcome = 'error';
    requestId = extractRequestId(user.error);
  } else if (user.isSuccess) {
    if (facade.isError) {
      if (isMaintenance(facade.error)) outcome = 'maintenance';
      else if (isAuthFail(facade.error)) outcome = 'landing';
      else outcome = 'error';
      requestId = extractRequestId(facade.error);
    } else if (facade.isSuccess) {
      outcome = (facade.data?.concepts?.length ?? 0) > 0 ? 'home' : 'onboarding';
    }
  }
  if (outcome === 'pending' && tier === 'timeout') {
    outcome = 'timeout';
  }

  const startedRef = useRef(false);
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    track('app_bootstrap_started');
  }, []);

  const reportedRef = useRef<Outcome | null>(null);
  useEffect(() => {
    if (outcome === 'pending') return;
    if (reportedRef.current === outcome) return;
    reportedRef.current = outcome;
    if (outcome === 'error' || outcome === 'timeout') {
      track('app_bootstrap_failed', { reason: outcome });
      return;
    }
    track('app_bootstrap_succeeded', { redirect: outcome });
    track(`main_redirect_to_${outcome}`);
  }, [outcome]);

  if (outcome === 'pending') return <BootstrapLoader tier={tier} />;
  if (outcome === 'landing') return <LandingPage />;
  if (outcome === 'onboarding') return <Navigate to="/onboarding" replace />;
  if (outcome === 'home') return <Navigate to="/home" replace />;
  if (outcome === 'maintenance') return <Navigate to="/maintenance" replace />;
  return <ErrorScreen variant={outcome === 'timeout' ? 'timeout' : 'error'} requestId={requestId} />;
}

function BootstrapLoader({ tier }: { tier: Tier }) {
  if (tier === 'invisible') {
    return <div aria-hidden className="min-h-[100dvh] bg-canvas" />;
  }
  if (tier === 'timeout') {
    return <ErrorScreen variant="timeout" />;
  }
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-canvas">
      <div className="flex flex-col items-center gap-4">
        <span
          aria-hidden
          className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-cream/20 border-t-cream"
        />
        {tier === 'message' && (
          <p className="font-mono text-[11px] uppercase tracking-[var(--tracking-mono)] text-cream-mute">
            내 학습 지도를 확인하고 있어요
          </p>
        )}
      </div>
    </div>
  );
}
