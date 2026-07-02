import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { server } from '@/mocks/node';
import { resetLayerMockState } from '@/mocks/handlers/layer.handlers';
import { LAYERS_KEY } from './hooks/useLayers';
import { DeckProvider } from '@/features/decks/DeckContext';
import type { Layer } from '@/lib/api/schemas/layer';
import { LayerDetailPage } from './LayerDetailPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

function makeWrapper(initial: Layer[]) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  client.setQueryData<Layer[]>(LAYERS_KEY, initial);
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/layers/2']}>
        <DeckProvider>
          <Routes>
            <Route path="/layers/:layerId" element={children} />
          </Routes>
        </DeckProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
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
    progressStatus: 'IN_PROGRESS',
    deletedAt: null,
    createdAt: '2026-07-02T00:00:00Z',
  },
];

describe('LayerDetailPage', () => {
  beforeEach(() => {
    resetLayerMockState();
    mockNavigate.mockClear();
  });

  it('happy: 캐시에 있는 Layer 를 헤더 · Badge · 축 목록 shell 로 렌더', async () => {
    render(<LayerDetailPage />, { wrapper: makeWrapper(seed) });

    // 헤더에 Layer 이름
    await screen.findByRole('heading', { name: '시스템 설계', level: 1 });
    // LayerHeaderBadge 렌더 (axisCount 미지정 placeholder)
    expect(screen.getByRole('status', { name: 'Layer 요약' })).toHaveTextContent(
      '축 -- / 10',
    );
    // 축 목록 shell + [축 추가] disabled 버튼
    expect(screen.getByRole('region', { name: '하위 축 목록' })).toBeInTheDocument();
    const addAxisBtn = screen.getByRole('button', { name: '축 추가 (준비 중)' });
    expect(addAxisBtn).toBeDisabled();
    // [편집] · [삭제] 진입 버튼
    expect(
      screen.getByRole('button', { name: '시스템 설계 편집' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '시스템 설계 삭제' }),
    ).toBeInTheDocument();
  });

  it('edge: 존재하지 않는 layerId 진입 시 not-found alert 렌더', async () => {
    // 캐시엔 layer 1 만 있고 URL 은 /layers/2
    render(<LayerDetailPage />, { wrapper: makeWrapper([seed[0]!]) });

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Layer 를 찾을 수 없어요');
    expect(
      screen.getByRole('link', { name: 'Layer 목록으로 돌아가기' }),
    ).toBeInTheDocument();
  });

  it('삭제 성공 시 onDeleted → /layers 로 navigate', async () => {
    server.use(
      http.delete('/api/v1/facades/me/layers/2', () => new HttpResponse(null, { status: 204 })),
    );

    render(<LayerDetailPage />, { wrapper: makeWrapper(seed) });
    await screen.findByRole('heading', { name: '시스템 설계' });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: '시스템 설계 삭제' }));

    const confirmInput = await screen.findByLabelText('삭제 확인 입력');
    await user.type(confirmInput, '삭제');
    await user.click(screen.getByRole('button', { name: '삭제', hidden: false }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/layers', { replace: true });
    });
  });
});
