import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useAxisCards } from './useAxisCards';

function wrap() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

describe('useAxisCards (Story S-2 · Cards 탭 실 리스트)', () => {
  it('happy · axis-1 카드 2장 (seed card 1·2) 반환', async () => {
    const { result } = renderHook(() => useAxisCards('axis-1'), { wrapper: wrap() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.map((c) => c.cardId).sort()).toEqual(['1', '2']);
  });

  it('edge · axis-3 카드 2장 ARCHIVE 상태 반환 (card 11·12)', async () => {
    const { result } = renderHook(() => useAxisCards('axis-3'), { wrapper: wrap() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.every((c) => c.status === 'ARCHIVE')).toBe(true);
  });

  it('error · 존재하지 않는 axisId → 빈 배열 (404 없음 · empty state 대응)', async () => {
    const { result } = renderHook(() => useAxisCards('axis-nonexistent'), {
      wrapper: wrap(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});
