import { describe, it, expect } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useMarkViewed } from './useMarkViewed';
import { useReviewSession } from './useReviewSession';

function wrap() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

describe('useMarkViewed (Story 2-3 · record-view)', () => {
  it('happy · 유효 sessionId + cardId → batchViewedCount +1', async () => {
    // 사전 세션 생성 (from-batch).
    const wrapper = wrap();
    const session = renderHook(() => useReviewSession(), { wrapper });
    await act(async () => {
      session.result.current.mutate('2026-07-22');
    });
    await waitFor(() => expect(session.result.current.isSuccess).toBe(true));
    const sessionId = session.result.current.data!.sessionId;
    const firstCardId = session.result.current.data!.currentCard!.cardId;

    const mark = renderHook(() => useMarkViewed(sessionId), { wrapper });
    await act(async () => {
      mark.result.current.mutate(String(firstCardId));
    });
    await waitFor(() => expect(mark.result.current.isSuccess).toBe(true));
    expect(mark.result.current.data?.batchViewedCount).toBe(1);
    expect(Number(mark.result.current.data?.batchTotalCount ?? 0)).toBeGreaterThan(0);
  });

  it('error · sessionId 없음 → throw', async () => {
    const { result } = renderHook(() => useMarkViewed(null), { wrapper: wrap() });
    await act(async () => {
      result.current.mutate('999');
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toMatch(/sessionId missing/);
  });
});
