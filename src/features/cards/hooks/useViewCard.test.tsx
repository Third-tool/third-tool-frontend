import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useViewCard } from './useViewCard';
import { toastStore } from '@/lib/toast/toastQueue';
import type { ReactNode } from 'react';

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

describe('useViewCard', () => {
  it('pushes "배경 지식" toast on auto-archive MAX_VIEW', async () => {
    const sub = vi.fn();
    toastStore.subscribe(sub);
    const { result } = renderHook(() => useViewCard(), { wrapper: makeWrapper() });
    // c4 has viewCount=4, next view triggers MAX_VIEW per mock
    await result.current.mutateAsync('c4');
    await waitFor(() => {
      const messages = toastStore.snapshot().map((t) => t.message);
      expect(messages.some((m) => m.includes('배경 지식'))).toBe(true);
    });
  });
});
