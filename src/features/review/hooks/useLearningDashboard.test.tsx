import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useLearningDashboard } from './useLearningDashboard';
import { resetDashboardMockState } from '@/mocks/handlers/dashboard.handlers';

function wrap() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

describe('useLearningDashboard (Story 3-1 · MSW)', () => {
  it('happy · GET /dashboard/summary · 3 지표 반환', async () => {
    resetDashboardMockState();
    const { result } = renderHook(() => useLearningDashboard(), { wrapper: wrap() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.streak.current).toBe(3);
    expect(result.current.data?.streak.longest).toBe(5);
    expect(result.current.data?.recent7Days.dailyRatios).toHaveLength(7);
  });

  it('edge · recommendations 항상 null (L3 v1 잠금)', async () => {
    resetDashboardMockState();
    const { result } = renderHook(() => useLearningDashboard(), { wrapper: wrap() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.recommendations).toBeNull();
  });
});
