import { describe, it, expect } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useReviewSession } from './useReviewSession';

function wrap() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

describe('useReviewSession (Story 2-2 · from-batch)', () => {
  it('happy · batchId 전달 → sessionId 응답 · previousSessionAutoFinished=false (첫 세션)', async () => {
    const { result } = renderHook(() => useReviewSession(), { wrapper: wrap() });
    await act(async () => {
      result.current.mutate('2026-07-22');
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.sessionId).toMatch(/^fbs-/);
    expect(result.current.data?.previousSessionAutoFinished).toBe(false);
  });

  it('edge · 두 번째 진입 → 이전 세션 자동 finish · previousSessionAutoFinished=true', async () => {
    const first = renderHook(() => useReviewSession(), { wrapper: wrap() });
    await act(async () => {
      first.result.current.mutate('2026-07-22');
    });
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true));

    const second = renderHook(() => useReviewSession(), { wrapper: wrap() });
    await act(async () => {
      second.result.current.mutate('2026-07-22');
    });
    await waitFor(() => expect(second.result.current.isSuccess).toBe(true));
    expect(second.result.current.data?.previousSessionAutoFinished).toBe(true);
  });
});
