import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/node';
import { useConceptsMutation } from './useConceptsMutation';
import { LEARNING_FACADE_KEY } from '@/features/auth/hooks/useLearningFacade';
import { resetFacadeMockState } from '@/mocks/handlers/facade.handlers';
import type { LearningFacade } from '@/lib/api/schemas/facade';
import type { ReactNode } from 'react';

function makeHarness() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const initial: LearningFacade = {
    facadeId: 'facade-1',
    concept: '기존',
    concepts: ['기존'],
    axes: [],
    coverageSummary: { totalTopics: 0, uncoveredTopics: 0, axesWithUncovered: [] },
  };
  client.setQueryData<LearningFacade>(LEARNING_FACADE_KEY, initial);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { wrapper, client, initial };
}

describe('useConceptsMutation', () => {
  beforeEach(() => {
    resetFacadeMockState();
  });

  it('sends the concepts array and updates cache on success', async () => {
    const { wrapper, client } = makeHarness();
    let received: unknown = null;
    server.use(
      http.patch('/api/v1/learning-facade/concepts', async ({ request }) => {
        received = await request.json();
        const body = received as { concepts: string[] };
        return HttpResponse.json({
          facadeId: 'facade-1',
          concept: body.concepts[0],
          concepts: body.concepts,
          changed: true,
          updatedAt: new Date().toISOString(),
        });
      }),
    );

    const { result } = renderHook(() => useConceptsMutation(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(['백엔드', 'DDD']);
    });

    expect(received).toEqual({ concepts: ['백엔드', 'DDD'] });
    expect(client.getQueryData<LearningFacade>(LEARNING_FACADE_KEY)?.concepts).toEqual([
      '백엔드',
      'DDD',
    ]);
  });

  it('rolls back the cache when the request fails', async () => {
    const { wrapper, client, initial } = makeHarness();
    server.use(
      http.patch('/api/v1/learning-facade/concepts', () => {
        return HttpResponse.json({ code: 'X', message: 'fail' }, { status: 400 });
      }),
    );

    const { result } = renderHook(() => useConceptsMutation(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(['새', '값']).catch(() => undefined);
    });

    expect(client.getQueryData<LearningFacade>(LEARNING_FACADE_KEY)?.concepts).toEqual(
      initial.concepts,
    );
  });
});
