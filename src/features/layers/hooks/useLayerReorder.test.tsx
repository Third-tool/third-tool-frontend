import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/node';
import { useLayerReorder } from './useLayerReorder';
import { LAYERS_KEY } from './useLayers';
import { resetLayerMockState } from '@/mocks/handlers/layer.handlers';
import type { Layer } from '@/lib/api/schemas/layer';
import type { ReactNode } from 'react';

function makeHarness(initial: Layer[]) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  client.setQueryData<Layer[]>(LAYERS_KEY, initial);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { wrapper, client };
}

const seed: Layer[] = [
  {
    layerId: '1',
    name: 'Uncategorized',
    displayOrder: 0,
    progressStatus: 'NOT_STARTED',
    deletedAt: null,
    createdAt: '2026-07-01T00:00:00Z',
  },
  {
    layerId: '2',
    name: '시스템 설계',
    displayOrder: 1,
    progressStatus: 'NOT_STARTED',
    deletedAt: null,
    createdAt: '2026-07-01T00:00:00Z',
  },
];

describe('useLayerReorder', () => {
  beforeEach(() => {
    resetLayerMockState();
  });

  it('sends new order to PUT /layers/order and updates cache', async () => {
    const { wrapper, client } = makeHarness(seed);
    let received: unknown = null;
    server.use(
      http.put('/api/v1/facades/me/layers/order', async ({ request }) => {
        received = await request.json();
        return HttpResponse.json({
          layers: [
            { ...seed[1]!, displayOrder: 0 },
            { ...seed[0]!, displayOrder: 1 },
          ],
        });
      }),
    );

    const { result } = renderHook(() => useLayerReorder(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync(['2', '1']);
    });

    expect(received).toEqual({ orderedLayerIds: ['2', '1'] });
    const cached = client.getQueryData<Layer[]>(LAYERS_KEY);
    expect(cached?.map((l) => l.layerId)).toEqual(['2', '1']);
    expect(cached?.[0]?.displayOrder).toBe(0);
    expect(cached?.[1]?.displayOrder).toBe(1);
  });

  it('rolls back cache on server error', async () => {
    const { wrapper, client } = makeHarness(seed);
    server.use(
      http.put('/api/v1/facades/me/layers/order', () =>
        HttpResponse.json(
          { code: 'LAYER_REORDER_MISMATCH', message: 'nope' },
          { status: 400 },
        ),
      ),
    );

    const { result } = renderHook(() => useLayerReorder(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync(['2', '1']).catch(() => undefined);
    });

    const cached = client.getQueryData<Layer[]>(LAYERS_KEY);
    expect(cached?.map((l) => l.layerId)).toEqual(['1', '2']);
  });
});
