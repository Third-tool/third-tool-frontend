import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTodayReview } from './useTodayReview';
import type { ReactNode } from 'react';

function makeWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

describe('useTodayReview', () => {
  it('returns mock session cards from MSW handler', async () => {
    const { result } = renderHook(() => useTodayReview(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.cards.length).toBeGreaterThan(0);
    expect(result.current.data?.cards[0]?.cardId).toBeDefined();
  });
});
