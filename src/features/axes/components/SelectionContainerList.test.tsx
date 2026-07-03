import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { server } from '@/mocks/node';
import { resetAxisSelectionMockState } from '@/mocks/handlers/axisSelection.handlers';
import { SelectionContainerList } from './SelectionContainerList';
import { axisSelectionsKey } from '../hooks/useAxisSelections';
import type { AxisSelection } from '@/lib/api/schemas/axisSelection';

const AXIS_ID = 'axis-1';

function makeHarness(preloaded?: AxisSelection[]) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  if (preloaded) {
    client.setQueryData<AxisSelection[]>(axisSelectionsKey(AXIS_ID), preloaded);
  }
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { wrapper, client };
}

const seedSelections: AxisSelection[] = [
  {
    id: '10',
    axisId: AXIS_ID,
    name: '웹 서비스 실전 v1',
    createdAt: '2026-07-03T00:00:00Z',
    updatedAt: '2026-07-03T00:00:00Z',
    nodes: [
      {
        id: '100',
        selectionId: '10',
        displayOrder: 1,
        title: '1. 사이드 프로젝트 구성',
        rationale: null,
        body: '├── 1-1. 스택 선정',
      },
    ],
  },
  {
    id: '11',
    axisId: AXIS_ID,
    name: '리서치 노트 2026Q3',
    createdAt: '2026-07-02T00:00:00Z',
    updatedAt: '2026-07-02T00:00:00Z',
    nodes: [],
  },
];

describe('SelectionContainerList', () => {
  beforeEach(() => {
    resetAxisSelectionMockState();
  });

  it('happy: 캐시의 컨테이너 목록을 렌더 · 접힘 상태 · 노드 개수 배지', async () => {
    const { wrapper } = makeHarness(seedSelections);
    render(<SelectionContainerList axisId={AXIS_ID} />, { wrapper });

    const list = await screen.findByRole('list', { name: 'Selection 리스트' });
    // DESC 정렬은 preload 그대로 유지 (MSW GET 안 함)
    expect(within(list).getByText(/웹 서비스 실전 v1/)).toBeInTheDocument();
    expect(within(list).getByText(/리서치 노트 2026Q3/)).toBeInTheDocument();
    // 노드 개수 표기
    expect(within(list).getByText(/노드 1$/)).toBeInTheDocument();
    expect(within(list).getByText(/노드 0$/)).toBeInTheDocument();
    // 초기엔 접힘 상태 → SelectionNodeList 미마운트
    expect(
      within(list).queryByRole('region', { name: 'Selection 노드 목록' }),
    ).not.toBeInTheDocument();
  });

  it('edge: 빈 상태에서 안내 문구 노출', async () => {
    const { wrapper } = makeHarness([]);
    render(<SelectionContainerList axisId={AXIS_ID} />, { wrapper });
    expect(
      await screen.findByText(
        '아직 Selection 이 없어요. 사례/응용 컨테이너를 하나 추가해보세요.',
      ),
    ).toBeInTheDocument();
  });

  it('[+ Selection 추가] → 이름 UNIQUE 위반 시 인라인 에러 (409 재현)', async () => {
    const { wrapper } = makeHarness([]);
    server.use(
      http.post(`/api/v1/axes/${AXIS_ID}/selections`, () =>
        HttpResponse.json(
          {
            code: 'AXIS_SELECTION_NAME_DUPLICATE',
            message: '이미 같은 이름의 Selection 이 있어요.',
          },
          { status: 409 },
        ),
      ),
    );

    render(<SelectionContainerList axisId={AXIS_ID} />, { wrapper });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Selection 추가' }));
    const form = await screen.findByRole('form', { name: '새 Selection 추가' });
    await user.type(within(form).getByLabelText('Selection 이름'), '중복 이름');
    await user.click(within(form).getByRole('button', { name: '추가' }));

    const alert = await within(form).findByRole('alert');
    expect(alert).toHaveTextContent('같은 이름의 Selection 이 이미 있어요');
    // 폼은 유지되고 이름도 preserve
    expect(within(form).getByLabelText('Selection 이름')).toHaveValue('중복 이름');
  });

  it('컨테이너 펼침 → SelectionNodeList 마운트 · 노드 title 렌더', async () => {
    const { wrapper } = makeHarness(seedSelections);
    render(<SelectionContainerList axisId={AXIS_ID} />, { wrapper });

    const user = userEvent.setup();
    // "▸ 웹 서비스 실전 v1" 헤더 버튼 클릭 → 펼침
    await user.click(screen.getByRole('button', { name: /웹 서비스 실전 v1 펼치기/ }));

    const region = await screen.findByRole('region', { name: 'Selection 노드 목록' });
    expect(within(region).getByText('1. 사이드 프로젝트 구성')).toBeInTheDocument();
  });
});
