import { useEffect, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ApiError } from '@/lib/api/client';
import { ErrorScreen } from '@/components/ErrorScreen';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useLearningFacade } from '../hooks/useLearningFacade';

interface Props {
  children: ReactNode;
  requireConcept?: boolean;
  redirectIfConcept?: string;
}

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
]);

export function ProtectedRoute({ children, requireConcept = false, redirectIfConcept }: Props) {
  const location = useLocation();
  const user = useCurrentUser();
  const facade = useLearningFacade(user.isSuccess);

  const nextParam = encodeURIComponent(`${location.pathname}${location.search}`);

  useEffect(() => {
    // no-op effect for parity with future logging hook
  }, [user.status, facade.status]);

  if (user.isLoading) {
    return <FullPageLoader />;
  }

  if (user.isError) {
    if (user.error instanceof ApiError && user.error.code === 'MAINTENANCE') {
      return <Navigate to="/maintenance" replace />;
    }
    const isAuthFail =
      user.error instanceof ApiError && AUTH_FAIL_CODES.has(user.error.code);
    if (isAuthFail) {
      return <Navigate to={`/login?next=${nextParam}`} replace />;
    }
    return (
      <ErrorScreen
        variant="error"
        requestId={user.error instanceof ApiError ? user.error.requestId : null}
      />
    );
  }

  if (redirectIfConcept) {
    if (facade.isLoading || facade.isFetching) return <FullPageLoader />;
    if (!facade.isError && facade.data?.concept) {
      return <Navigate to={redirectIfConcept} replace />;
    }
  }

  if (requireConcept) {
    if (facade.isLoading) return <FullPageLoader />;
    if (facade.isError) {
      if (facade.error instanceof ApiError && facade.error.code === 'MAINTENANCE') {
        return <Navigate to="/maintenance" replace />;
      }
      const isAuthFail =
        facade.error instanceof ApiError && AUTH_FAIL_CODES.has(facade.error.code);
      if (isAuthFail) return <Navigate to={`/login?next=${nextParam}`} replace />;
      return (
        <ErrorScreen
          variant="error"
          requestId={facade.error instanceof ApiError ? facade.error.requestId : null}
        />
      );
    }
    if (!facade.data?.concept) {
      return <Navigate to="/onboarding" replace />;
    }
  }

  return <>{children}</>;
}

function FullPageLoader() {
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-canvas">
      <span className="font-mono text-[11px] uppercase tracking-[var(--tracking-mono)] text-cream-faint">
        Loading…
      </span>
    </div>
  );
}
