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

describe('useArchive (M5 · Axis 스코프 재편)', () => {
  it('lists archived cards from axis-scoped endpoint (axis-3 = ARCHIVE seed)', async () => {
    const { result } = renderHook(() => useArchive({ axisId: 'axis-3' }), { wrapper: wrap() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.length).toBeGreaterThan(0);
    expect(result.current.data?.every((c) => c.status === 'ARCHIVE')).toBe(true);
  });

  it('returns archive cards for a tagId via the tag-scoped endpoint', async () => {
    const { result } = renderHook(() => useArchive('4'), { wrapper: wrap() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.length).toBeGreaterThan(0);
  });
});
