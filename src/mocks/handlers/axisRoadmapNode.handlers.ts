import { http, HttpResponse } from 'msw';
import { clearPersistedScope, loadPersisted, savePersisted } from '../persistence';

// product-learning-tower Epic 3 Story 3-9~3-11 mock.
// BE `AxisRoadmapNode` API 대응 — Story 3-3 (textarea 원안 SUPERSEDED) 대체.

interface MockRoadmapNode {
  id: string;
  axisId: string;
  displayOrder: number; // 1-based
  title: string;
  rationale: string | null;
  body: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface RoadmapNodeState {
  nodes: MockRoadmapNode[];
  nextId: number;
}

function seed(): RoadmapNodeState {
  return { nodes: [], nextId: 1 };
}

const state: RoadmapNodeState = loadPersisted<RoadmapNodeState>(
  'axisRoadmapNode',
  seed(),
);

function persist(): void {
  savePersisted('axisRoadmapNode', state);
}

export function resetAxisRoadmapNodeMockState(): void {
  Object.assign(state, seed());
  clearPersistedScope('axisRoadmapNode');
}

function activeNodes(axisId: string): MockRoadmapNode[] {
  return state.nodes
    .filter((n) => n.axisId === axisId && n.deletedAt === null)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

function findNode(nodeId: string): MockRoadmapNode | undefined {
  return state.nodes.find((n) => n.id === nodeId && n.deletedAt === null);
}

const MAX_TITLE = 200;
const MAX_RATIONALE = 500;

function trim(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

export const axisRoadmapNodeHandlers = [
  http.get('/api/v1/axes/:axisId/roadmap-nodes', ({ params }) => {
    return HttpResponse.json(activeNodes(String(params.axisId)));
  }),

  http.post('/api/v1/axes/:axisId/roadmap-nodes', async ({ params, request }) => {
    const axisId = String(params.axisId);
    const body = (await request.json().catch(() => ({}))) as {
      title?: string;
      rationale?: string | null;
      body?: string;
    };
    const title = trim(body.title);
    const bodyText = typeof body.body === 'string' ? body.body : '';
    const rationale =
      body.rationale === null || body.rationale === undefined
        ? null
        : trim(body.rationale);

    if (!title) {
      return HttpResponse.json(
        { code: 'ROADMAP_NODE_TITLE_BLANK', message: '노드 제목을 입력해주세요.' },
        { status: 400 },
      );
    }
    if (title.length > MAX_TITLE) {
      return HttpResponse.json(
        { code: 'C001', message: `제목은 ${MAX_TITLE}자를 넘을 수 없어요.` },
        { status: 400 },
      );
    }
    if (rationale !== null && rationale.length > MAX_RATIONALE) {
      return HttpResponse.json(
        { code: 'C001', message: `근거는 ${MAX_RATIONALE}자를 넘을 수 없어요.` },
        { status: 400 },
      );
    }
    if (!bodyText.trim()) {
      return HttpResponse.json(
        { code: 'ROADMAP_NODE_BODY_BLANK', message: '노드 본문을 입력해주세요.' },
        { status: 400 },
      );
    }

    const displayOrder = activeNodes(axisId).length + 1;
    const now = new Date().toISOString();
    const node: MockRoadmapNode = {
      id: String(state.nextId++),
      axisId,
      displayOrder,
      title,
      rationale: rationale === '' ? null : rationale,
      body: bodyText,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    state.nodes.push(node);
    persist();
    return HttpResponse.json(node, { status: 201 });
  }),

  http.patch('/api/v1/roadmap-nodes/:nodeId', async ({ params, request }) => {
    const nodeId = String(params.nodeId);
    const node = findNode(nodeId);
    if (!node) {
      return HttpResponse.json(
        { code: 'ROADMAP_NODE_NOT_FOUND', message: '노드를 찾을 수 없어요.' },
        { status: 404 },
      );
    }
    const body = (await request.json().catch(() => ({}))) as {
      title?: string;
      rationale?: string | null;
      body?: string;
    };

    if (body.title !== undefined) {
      const t = trim(body.title);
      if (!t) {
        return HttpResponse.json(
          { code: 'ROADMAP_NODE_TITLE_BLANK', message: '노드 제목을 입력해주세요.' },
          { status: 400 },
        );
      }
      if (t.length > MAX_TITLE) {
        return HttpResponse.json(
          { code: 'C001', message: `제목은 ${MAX_TITLE}자를 넘을 수 없어요.` },
          { status: 400 },
        );
      }
      node.title = t;
    }
    if (body.rationale !== undefined) {
      if (body.rationale === null) {
        node.rationale = null;
      } else {
        const r = trim(body.rationale);
        if (r.length > MAX_RATIONALE) {
          return HttpResponse.json(
            { code: 'C001', message: `근거는 ${MAX_RATIONALE}자를 넘을 수 없어요.` },
            { status: 400 },
          );
        }
        node.rationale = r === '' ? null : r;
      }
    }
    if (body.body !== undefined) {
      const b = typeof body.body === 'string' ? body.body : '';
      if (!b.trim()) {
        return HttpResponse.json(
          { code: 'ROADMAP_NODE_BODY_BLANK', message: '노드 본문을 입력해주세요.' },
          { status: 400 },
        );
      }
      node.body = b;
    }
    node.updatedAt = new Date().toISOString();
    persist();
    return HttpResponse.json(node);
  }),

  http.delete('/api/v1/roadmap-nodes/:nodeId', ({ params }) => {
    const node = findNode(String(params.nodeId));
    if (!node) {
      return HttpResponse.json(
        { code: 'ROADMAP_NODE_NOT_FOUND', message: '노드를 찾을 수 없어요.' },
        { status: 404 },
      );
    }
    node.deletedAt = new Date().toISOString();
    // display_order 재계산 (남은 노드 재정렬)
    const remaining = activeNodes(node.axisId);
    remaining.forEach((n, i) => {
      n.displayOrder = i + 1;
    });
    persist();
    return new HttpResponse(null, { status: 204 });
  }),

  http.put(
    '/api/v1/axes/:axisId/roadmap-nodes/order',
    async ({ params, request }) => {
      const axisId = String(params.axisId);
      const body = (await request.json().catch(() => ({}))) as {
        orderedNodeIds?: string[];
      };
      const ordered = (body.orderedNodeIds ?? []).map((v) => String(v));
      const alive = activeNodes(axisId);
      if (ordered.length !== alive.length) {
        return HttpResponse.json(
          {
            code: 'ROADMAP_NODE_ORDER_MISMATCH',
            message: '노드 id 집합이 일치하지 않아요.',
          },
          { status: 400 },
        );
      }
      const idSet = new Set(alive.map((n) => n.id));
      for (const id of ordered) {
        if (!idSet.has(id)) {
          return HttpResponse.json(
            {
              code: 'ROADMAP_NODE_ORDER_MISMATCH',
              message: '노드 id 집합이 일치하지 않아요.',
            },
            { status: 400 },
          );
        }
      }
      ordered.forEach((id, i) => {
        const n = state.nodes.find((x) => x.id === id);
        if (n) n.displayOrder = i + 1;
      });
      persist();
      return HttpResponse.json({ nodes: activeNodes(axisId) });
    },
  ),
];
