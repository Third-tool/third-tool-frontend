import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useArchive } from './useArchive';
import type { ReactNode } from 'react';

function wrap() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

describe('useArchive', () => {
  it('lists archived cards from MSW', async () => {
    const { result } = renderHook(() => useArchive(), { wrapper: wrap() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.length).toBeGreaterThan(0);
  });

  it('passes tagId to API', async () => {
    const { result } = renderHook(() => useArchive('t_net'), { wrapper: wrap() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.every((c) => c.tags.some((t) => t.tagId === 't_net'))).toBe(true);
  });
});
