import { http, HttpResponse } from 'msw';
import { clearPersistedScope, loadPersisted, savePersisted } from '../persistence';

// product-learning-tower Epic 3 Story 3-10 mock.
// BE `AxisSelection` (컨테이너) + `AxisSelectionNode` (자식) API 대응.
// 컨테이너 정책 (이슈 #11 계승): name UNIQUE per axis · created_at DESC · hard delete.
// 노드 정책 (이슈 #16 신설): soft delete · display_order · Roadmap 노드와 동일 shape.

interface MockSelectionNode {
  id: string;
  selectionId: string;
  displayOrder: number;
  title: string;
  rationale: string | null;
  body: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface MockSelection {
  id: string;
  axisId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface SelectionState {
  selections: MockSelection[];
  nodes: MockSelectionNode[];
  nextSelectionId: number;
  nextNodeId: number;
}

function seed(): SelectionState {
  return { selections: [], nodes: [], nextSelectionId: 1, nextNodeId: 1 };
}

const state: SelectionState = loadPersisted<SelectionState>('axisSelection', seed());

function persist(): void {
  savePersisted('axisSelection', state);
}

export function resetAxisSelectionMockState(): void {
  Object.assign(state, seed());
  clearPersistedScope('axisSelection');
}

function activeNodesFor(selectionId: string): MockSelectionNode[] {
  return state.nodes
    .filter((n) => n.selectionId === selectionId && n.deletedAt === null)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

function findSelection(selectionId: string): MockSelection | undefined {
  return state.selections.find((s) => s.id === selectionId);
}

function findSelectionNode(nodeId: string): MockSelectionNode | undefined {
  return state.nodes.find((n) => n.id === nodeId && n.deletedAt === null);
}

const MAX_NAME = 100;
const MAX_TITLE = 200;
const MAX_RATIONALE = 500;

function trim(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

export const axisSelectionHandlers = [
  // ── 컨테이너 ─────────────────────────────────────────────
  http.get('/api/v1/axes/:axisId/selections', ({ params }) => {
    const axisId = String(params.axisId);
    const rows = state.selections
      .filter((s) => s.axisId === axisId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)) // DESC
      .map((s) => ({ ...s, nodes: activeNodesFor(s.id) }));
    return HttpResponse.json(rows);
  }),

  http.post('/api/v1/axes/:axisId/selections', async ({ params, request }) => {
    const axisId = String(params.axisId);
    const body = (await request.json().catch(() => ({}))) as { name?: string };
    const name = trim(body.name);
    if (!name) {
      return HttpResponse.json(
        { code: 'C001', message: 'Selection 이름을 입력해주세요.' },
        { status: 400 },
      );
    }
    if (name.length > MAX_NAME) {
      return HttpResponse.json(
        { code: 'C001', message: `Selection 이름은 ${MAX_NAME}자를 넘을 수 없어요.` },
        { status: 400 },
      );
    }
    // UNIQUE per axis (이슈 #11 계승)
    if (state.selections.some((s) => s.axisId === axisId && s.name === name)) {
      return HttpResponse.json(
        {
          code: 'AXIS_SELECTION_NAME_DUPLICATE',
          message: '이미 같은 이름의 Selection 이 있어요.',
        },
        { status: 409 },
      );
    }
    const now = new Date().toISOString();
    const selection: MockSelection = {
      id: String(state.nextSelectionId++),
      axisId,
      name,
      createdAt: now,
      updatedAt: now,
    };
    state.selections.push(selection);
    persist();
    return HttpResponse.json({ ...selection, nodes: [] }, { status: 201 });
  }),

  http.patch('/api/v1/selections/:selectionId', async ({ params, request }) => {
    const selectionId = String(params.selectionId);
    const selection = findSelection(selectionId);
    if (!selection) {
      return HttpResponse.json(
        { code: 'AXIS_SELECTION_NOT_FOUND', message: 'Selection 을 찾을 수 없어요.' },
        { status: 404 },
      );
    }
    const body = (await request.json().catch(() => ({}))) as { name?: string };
    const name = trim(body.name);
    if (!name) {
      return HttpResponse.json(
        { code: 'C001', message: 'Selection 이름을 입력해주세요.' },
        { status: 400 },
      );
    }
    if (name.length > MAX_NAME) {
      return HttpResponse.json(
        { code: 'C001', message: `Selection 이름은 ${MAX_NAME}자를 넘을 수 없어요.` },
        { status: 400 },
      );
    }
    if (
      state.selections.some(
        (s) => s.axisId === selection.axisId && s.id !== selectionId && s.name === name,
      )
    ) {
      return HttpResponse.json(
        {
          code: 'AXIS_SELECTION_NAME_DUPLICATE',
          message: '이미 같은 이름의 Selection 이 있어요.',
        },
        { status: 409 },
      );
    }
    selection.name = name;
    selection.updatedAt = new Date().toISOString();
    persist();
    return HttpResponse.json({ ...selection, nodes: activeNodesFor(selection.id) });
  }),

  http.delete('/api/v1/selections/:selectionId', ({ params }) => {
    const selectionId = String(params.selectionId);
    const idx = state.selections.findIndex((s) => s.id === selectionId);
    if (idx === -1) {
      return HttpResponse.json(
        { code: 'AXIS_SELECTION_NOT_FOUND', message: 'Selection 을 찾을 수 없어요.' },
        { status: 404 },
      );
    }
    // hard delete (이슈 #11 정책 계승) — 컨테이너 + 자식 노드 물리 삭제
    state.selections.splice(idx, 1);
    state.nodes = state.nodes.filter((n) => n.selectionId !== selectionId);
    persist();
    return new HttpResponse(null, { status: 204 });
  }),

  // ── 노드 ─────────────────────────────────────────────────
  http.get('/api/v1/selections/:selectionId/nodes', ({ params }) => {
    return HttpResponse.json(activeNodesFor(String(params.selectionId)));
  }),

  http.post('/api/v1/selections/:selectionId/nodes', async ({ params, request }) => {
    const selectionId = String(params.selectionId);
    const selection = findSelection(selectionId);
    if (!selection) {
      return HttpResponse.json(
        { code: 'AXIS_SELECTION_NOT_FOUND', message: 'Selection 을 찾을 수 없어요.' },
        { status: 404 },
      );
    }
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
        { code: 'SELECTION_NODE_TITLE_BLANK', message: '노드 제목을 입력해주세요.' },
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
        { code: 'SELECTION_NODE_BODY_BLANK', message: '노드 본문을 입력해주세요.' },
        { status: 400 },
      );
    }
    const displayOrder = activeNodesFor(selectionId).length + 1;
    const now = new Date().toISOString();
    const node: MockSelectionNode = {
      id: String(state.nextNodeId++),
      selectionId,
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

  http.patch('/api/v1/selection-nodes/:nodeId', async ({ params, request }) => {
    const nodeId = String(params.nodeId);
    const node = findSelectionNode(nodeId);
    if (!node) {
      return HttpResponse.json(
        { code: 'SELECTION_NODE_NOT_FOUND', message: '노드를 찾을 수 없어요.' },
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
          { code: 'SELECTION_NODE_TITLE_BLANK', message: '노드 제목을 입력해주세요.' },
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
          { code: 'SELECTION_NODE_BODY_BLANK', message: '노드 본문을 입력해주세요.' },
          { status: 400 },
        );
      }
      node.body = b;
    }
    node.updatedAt = new Date().toISOString();
    persist();
    return HttpResponse.json(node);
  }),

  http.delete('/api/v1/selection-nodes/:nodeId', ({ params }) => {
    const node = findSelectionNode(String(params.nodeId));
    if (!node) {
      return HttpResponse.json(
        { code: 'SELECTION_NODE_NOT_FOUND', message: '노드를 찾을 수 없어요.' },
        { status: 404 },
      );
    }
    node.deletedAt = new Date().toISOString();
    const remaining = activeNodesFor(node.selectionId);
    remaining.forEach((n, i) => {
      n.displayOrder = i + 1;
    });
    persist();
    return new HttpResponse(null, { status: 204 });
  }),

  http.put(
    '/api/v1/selections/:selectionId/nodes/order',
    async ({ params, request }) => {
      const selectionId = String(params.selectionId);
      const body = (await request.json().catch(() => ({}))) as {
        orderedNodeIds?: string[];
      };
      const ordered = (body.orderedNodeIds ?? []).map((v) => String(v));
      const alive = activeNodesFor(selectionId);
      if (ordered.length !== alive.length) {
        return HttpResponse.json(
          {
            code: 'SELECTION_NODE_ORDER_MISMATCH',
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
              code: 'SELECTION_NODE_ORDER_MISMATCH',
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
      return HttpResponse.json({ nodes: activeNodesFor(selectionId) });
    },
  ),
];
