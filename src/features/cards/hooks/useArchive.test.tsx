import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useArchive } from './useArchive';
import { DeckProvider } from '@/features/decks/DeckContext';
import type { ReactNode } from 'react';

function wrap() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <DeckProvider>{children}</DeckProvider>
    </QueryClientProvider>
  );
}

describe('useArchive', () => {
  it('lists archived cards from the deck-scoped MSW handler', async () => {
    const { result } = renderHook(() => useArchive({ deckId: '1' }), { wrapper: wrap() });
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
