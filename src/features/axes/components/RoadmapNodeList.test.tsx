import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { server } from '@/mocks/node';
import { resetAxisRoadmapNodeMockState } from '@/mocks/handlers/axisRoadmapNode.handlers';
import { RoadmapNodeList } from './RoadmapNodeList';
import { roadmapNodesKey } from '../hooks/useAxisRoadmapNodes';
import type { AxisRoadmapNode } from '@/lib/api/schemas/axisRoadmapNode';

const AXIS_ID = 'axis-1';

function makeHarness(preloaded?: AxisRoadmapNode[]) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  if (preloaded) {
    client.setQueryData<AxisRoadmapNode[]>(roadmapNodesKey(AXIS_ID), preloaded);
  }
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { wrapper, client };
}

const seedNodes: AxisRoadmapNode[] = [
  {
    id: '1',
    axisId: AXIS_ID,
    displayOrder: 1,
    title: '1. 하네스 엔지니어링 기초',
    rationale: 'AI 에이전트의 기본 프레임 확립',
    body: '├── 1-1. 정의와 본질\n│       모델 + 하네스 — ...',
    createdAt: '2026-07-02T00:00:00Z',
    updatedAt: '2026-07-02T00:00:00Z',
  },
  {
    id: '2',
    axisId: AXIS_ID,
    displayOrder: 2,
    title: '2. 프롬프트 설계',
    rationale: null,
    body: '├── 2-1. 시스템 프롬프트',
    createdAt: '2026-07-02T00:00:00Z',
    updatedAt: '2026-07-02T00:00:00Z',
  },
];

describe('RoadmapNodeList', () => {
  beforeEach(() => {
    resetAxisRoadmapNodeMockState();
  });

  it('happy: 캐시의 노드 목록을 display_order ASC 로 렌더', async () => {
    const { wrapper } = makeHarness(seedNodes);
    render(<RoadmapNodeList axisId={AXIS_ID} />, { wrapper });

    const list = await screen.findByRole('list', { name: 'Roadmap 노드 리스트' });
    expect(within(list).getByText('1. 하네스 엔지니어링 기초')).toBeInTheDocument();
    expect(within(list).getByText('2. 프롬프트 설계')).toBeInTheDocument();
    // rationale 렌더
    expect(within(list).getByText('AI 에이전트의 기본 프레임 확립')).toBeInTheDocument();
    // body monospace preview
    expect(
      within(list).getByLabelText('1. 하네스 엔지니어링 기초 본문 미리보기'),
    ).toHaveTextContent('├── 1-1. 정의와 본질');
  });

  it('edge: 빈 상태에서 안내 문구 노출', async () => {
    const { wrapper } = makeHarness([]);
    render(<RoadmapNodeList axisId={AXIS_ID} />, { wrapper });

    expect(
      await screen.findByText('아직 노드가 없어요. 챕터를 하나 추가해보세요.'),
    ).toBeInTheDocument();
  });

  it('[+ 노드 추가] → title/body 입력 → MSW POST 히트 후 목록 갱신', async () => {
    const { wrapper } = makeHarness([]);
    let received: unknown = null;
    server.use(
      http.post(`/api/v1/axes/${AXIS_ID}/roadmap-nodes`, async ({ request }) => {
        received = await request.json();
        return HttpResponse.json(
          {
            id: '99',
            axisId: AXIS_ID,
            displayOrder: 1,
            title: '새 챕터',
            rationale: null,
            body: '본문',
            createdAt: '2026-07-03T00:00:00Z',
            updatedAt: '2026-07-03T00:00:00Z',
          },
          { status: 201 },
        );
      }),
      http.get(`/api/v1/axes/${AXIS_ID}/roadmap-nodes`, () =>
        HttpResponse.json([
          {
            id: '99',
            axisId: AXIS_ID,
            displayOrder: 1,
            title: '새 챕터',
            rationale: null,
            body: '본문',
          },
        ]),
      ),
    );

    render(<RoadmapNodeList axisId={AXIS_ID} />, { wrapper });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: '노드 추가' }));

    const form = await screen.findByRole('article', { name: '새 노드 추가' });
    await user.type(within(form).getByLabelText('새 노드 제목'), '새 챕터');
    await user.type(within(form).getByRole('textbox', { name: /본문/ }), '본문');
    await user.click(within(form).getByRole('button', { name: '추가' }));

    await waitFor(() => {
      expect(received).toMatchObject({ title: '새 챕터', body: '본문', rationale: null });
    });
    // form close 후 재렌더로 목록에 새 노드
    await screen.findByText('새 챕터');
  });

  it('error: create 시 서버 400 → alert 노출 · 폼 유지', async () => {
    const { wrapper } = makeHarness([]);
    server.use(
      http.post(`/api/v1/axes/${AXIS_ID}/roadmap-nodes`, () =>
        HttpResponse.json(
          { code: 'ROADMAP_NODE_BODY_BLANK', message: 'body blank' },
          { status: 400 },
        ),
      ),
    );

    render(<RoadmapNodeList axisId={AXIS_ID} />, { wrapper });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: '노드 추가' }));

    const form = await screen.findByRole('article', { name: '새 노드 추가' });
    await user.type(within(form).getByLabelText('새 노드 제목'), '제목만 있음');
    await user.type(within(form).getByRole('textbox', { name: /본문/ }), 'x');
    await user.click(within(form).getByRole('button', { name: '추가' }));

    const alert = await within(form).findByRole('alert');
    expect(alert).toHaveTextContent('노드 본문을 입력해주세요.');
    // 폼은 여전히 열려 있음 (제목 preserved)
    expect(within(form).getByLabelText('새 노드 제목')).toHaveValue('제목만 있음');
  });
});
