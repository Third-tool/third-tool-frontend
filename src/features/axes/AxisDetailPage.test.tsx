import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AxisDetailPage } from './AxisDetailPage';

function wrap() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/axes/axis-1']}>
        <Routes>
          <Route path="/axes/:axisId" element={children} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('<AxisDetailPage> (Story 3-2 · sticky mount)', () => {
  it('happy · 3-탭 렌더 (Roadmap · Selections · Cards)', () => {
    render(<AxisDetailPage />, { wrapper: wrap() });
    expect(screen.getByRole('tab', { name: 'Roadmap' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Selections' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Cards' })).toBeInTheDocument();
  });

  it('happy · 초기 활성 탭 = Roadmap · 다른 두 탭 panel은 hidden', () => {
    render(<AxisDetailPage />, { wrapper: wrap() });
    const roadmapTab = screen.getByRole('tab', { name: 'Roadmap' });
    expect(roadmapTab).toHaveAttribute('aria-selected', 'true');
    const roadmapPanel = document.getElementById('panel-roadmap');
    const selPanel = document.getElementById('panel-selections');
    const cardsPanel = document.getElementById('panel-cards');
    expect(roadmapPanel).not.toHaveAttribute('hidden');
    expect(selPanel).toHaveAttribute('hidden');
    expect(cardsPanel).toHaveAttribute('hidden');
  });

  it('edge · 탭 스위칭 시 다른 panel은 sticky mount (DOM 유지 · hidden만 토글)', async () => {
    render(<AxisDetailPage />, { wrapper: wrap() });
    const roadmapPanel = document.getElementById('panel-roadmap');
    const selPanel = document.getElementById('panel-selections');
    // 초기: Roadmap panel의 자식 DOM 스냅샷 획득
    const roadmapChildrenBefore = roadmapPanel?.children.length ?? 0;

    fireEvent.click(screen.getByRole('tab', { name: 'Selections' }));
    // Selections 활성 · Roadmap은 hidden이 되었지만 DOM은 그대로.
    expect(selPanel).not.toHaveAttribute('hidden');
    expect(roadmapPanel).toHaveAttribute('hidden');
    expect(roadmapPanel?.children.length ?? 0).toBe(roadmapChildrenBefore);
  });

  it('edge · Cards 탭 → CardsAxisShell + axisId 표기', () => {
    render(<AxisDetailPage />, { wrapper: wrap() });
    fireEvent.click(screen.getByRole('tab', { name: 'Cards' }));
    const cardsPanel = document.getElementById('panel-cards');
    expect(cardsPanel).not.toHaveAttribute('hidden');
    const shell = within(cardsPanel as HTMLElement);
    expect(shell.getByLabelText('이 축의 카드')).toBeInTheDocument();
    expect(shell.getByText('axis-1')).toBeInTheDocument();
  });

  it('error · <ConceptSpecTooltip> Roadmap 모드가 Roadmap 탭에 첫 마운트에서 open', () => {
    // sessionStorage 청소 (재실행 시 자동 open 조건 보장)
    try {
      window.sessionStorage.clear();
    } catch {
      // ignore
    }
    render(<AxisDetailPage />, { wrapper: wrap() });
    // ConceptSpecTooltip open 시 role="tooltip"이 나타남
    const tooltips = screen.getAllByRole('tooltip');
    expect(tooltips.length).toBeGreaterThan(0);
    expect(tooltips[0]!.textContent).toMatch(/로드맵/);
  });
});

describe('<AxisDetailPage> · [AI 초안 요청] 버튼 (Story 3-8)', () => {
  it('happy · Roadmap 탭에 "AI 초안 요청" 버튼 렌더 · Selections 탭도 동일', () => {
    render(<AxisDetailPage />, { wrapper: wrap() });
    const roadmapBtn = screen.getByLabelText('Roadmap 초안 요청');
    expect(roadmapBtn).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Selections' }));
    const selectionBtn = screen.getByLabelText('Selection 초안 요청');
    expect(selectionBtn).toBeInTheDocument();
  });

  it('edge · concepts 미설정 시 [AI 초안 요청] disabled + hint title', async () => {
    render(<AxisDetailPage />, { wrapper: wrap() });
    const roadmapBtn = screen.getByLabelText('Roadmap 초안 요청');
    // MSW facade 응답 로드까지 잠시 대기 · 미로딩 상태에선 concepts=[] → disabled
    // 로드 완료 후에도 initial facade가 concepts=[] 이면 disabled 유지 · 이 assertion은 초기 상태만 검증
    expect(roadmapBtn).toBeDisabled();
    expect(roadmapBtn).toHaveAttribute('title', 'concepts를 먼저 설정하세요');
  });
});

// userEvent 미사용이지만 시멘틱 import 유지용 (dead-code lint 회피).
void userEvent;
