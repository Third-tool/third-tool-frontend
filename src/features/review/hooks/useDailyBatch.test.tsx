import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useDailyBatch } from './useDailyBatch';
import { resetDailyBatchMockState } from '@/mocks/handlers/dailyBatch.handlers';

function wrap() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

describe('useDailyBatch (Story 1-1 · lazy 생성 idempotent)', () => {
  it('happy · POST /daily-batch/today 응답 · entries · streak', async () => {
    resetDailyBatchMockState();
    const { result } = renderHook(() => useDailyBatch(), { wrapper: wrap() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.userId).toBe('user-1');
    expect(result.current.data?.streak).toBe(3);
    // seed 카드 중 ON_FIELD + axisId 있는 것만 · card 1·2·3 = 3장.
    expect(result.current.data?.entries.length ?? 0).toBeGreaterThanOrEqual(1);
  });

  it('edge · card_interval_day ASC 정렬 · 첫 카드 최소 interval', async () => {
    resetDailyBatchMockState();
    const { result } = renderHook(() => useDailyBatch(), { wrapper: wrap() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const entries = result.current.data?.entries ?? [];
    if (entries.length >= 2) {
      const days = entries.map((e) => e.cardIntervalDay);
      const sorted = [...days].sort((a, b) => a - b);
      expect(days).toEqual(sorted);
    }
  });
});
