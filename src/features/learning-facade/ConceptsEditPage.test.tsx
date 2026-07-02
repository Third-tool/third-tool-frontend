import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { server } from '@/mocks/node';
import { resetFacadeMockState } from '@/mocks/handlers/facade.handlers';
import { LEARNING_FACADE_KEY } from '@/features/auth/hooks/useLearningFacade';
import { DeckProvider } from '@/features/decks/DeckContext';
import type { LearningFacade } from '@/lib/api/schemas/facade';
import { ConceptsEditPage } from './ConceptsEditPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

function makeHarness(initialConcepts: string[] = ['기존']) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const initial: LearningFacade = {
    facadeId: 'facade-1',
    concept: initialConcepts[0] ?? null,
    concepts: initialConcepts,
    axes: [],
    coverageSummary: { totalTopics: 0, uncoveredTopics: 0, axesWithUncovered: [] },
  };
  client.setQueryData<LearningFacade>(LEARNING_FACADE_KEY, initial);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <DeckProvider>{children}</DeckProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
  return { wrapper, client, initial };
}

describe('ConceptsEditPage 종단 UX', () => {
  beforeEach(() => {
    resetFacadeMockState();
    mockNavigate.mockClear();
  });

  it('happy: 컨셉 추가 후 저장 → /me 로 이동 + PATCH payload 정합', async () => {
    const { wrapper } = makeHarness(['기존']);
    let received: unknown = null;
    server.use(
      http.patch('/api/v1/learning-facade/concepts', async ({ request }) => {
        received = await request.json();
        const body = received as { concepts: string[] };
        return HttpResponse.json({
          facadeId: 'facade-1',
          concept: body.concepts[0] ?? null,
          concepts: body.concepts,
          changed: true,
          updatedAt: new Date().toISOString(),
        });
      }),
    );

    render(<ConceptsEditPage />, { wrapper });

    // useEffect 로 draft 초기값이 캐시 concepts 를 반영해 chip 이 그려진다.
    await screen.findByText('기존');

    const user = userEvent.setup();
    const input = screen.getByRole('textbox', { name: /컨셉/ });
    await user.type(input, '백엔드');
    await user.keyboard('{Enter}');
    // 추가된 chip 이 UI 에 붙었는지 확인
    await screen.findByText('백엔드');

    await user.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/me');
    });
    // PATCH payload 가 concepts 배열로 전송됐는지 확인 (단수 concept 필드 미사용)
    expect(received).toEqual({ concepts: ['기존', '백엔드'] });
  });

  it('edge: 서버 409 중복 응답 → alert 노출 · 페이지 유지', async () => {
    const { wrapper } = makeHarness(['기존']);
    server.use(
      http.patch('/api/v1/learning-facade/concepts', () =>
        HttpResponse.json(
          {
            code: 'LEARNING_FACADE_CONCEPT_DUPLICATE',
            message: '중복된 컨셉이 있어요',
          },
          { status: 409 },
        ),
      ),
    );

    render(<ConceptsEditPage />, { wrapper });
    await screen.findByText('기존');

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: '저장' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('중복된 컨셉이 있어요');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('error: 서버 5xx 응답 → alert 노출 · 페이지 유지', async () => {
    const { wrapper } = makeHarness(['기존']);
    server.use(
      http.patch('/api/v1/learning-facade/concepts', () =>
        HttpResponse.json(
          { code: 'INTERNAL', message: '일시적인 서버 오류입니다' },
          { status: 500 },
        ),
      ),
    );

    render(<ConceptsEditPage />, { wrapper });
    await screen.findByText('기존');

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: '저장' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
