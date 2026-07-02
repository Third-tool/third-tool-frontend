import { http, HttpResponse } from 'msw';
import { clearPersistedScope, loadPersisted, savePersisted } from '../persistence';

// product-learning-tower Epic 2 (BE Layer 도메인) 로컬 mock.
// Layer 도메인은 아직 BE 진행 중이므로 이 handler 가 실제 응답을 대체.
// state 는 sessionStorage 로 지속되어 F5 후에도 유지된다 (persistence 스캇 관례).

interface MockLayer {
  layerId: string;
  name: string;
  displayOrder: number;
  progressStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  deletedAt: string | null;
  createdAt: string;
}

interface LayerState {
  layers: MockLayer[];
  nextId: number;
}

function seed(): LayerState {
  return {
    layers: [
      {
        layerId: '1',
        name: 'Uncategorized',
        displayOrder: 0,
        progressStatus: 'NOT_STARTED',
        deletedAt: null,
        createdAt: '2026-07-01T00:00:00Z',
      },
    ],
    nextId: 2,
  };
}

const state: LayerState = loadPersisted<LayerState>('layer', seed());

function persist(): void {
  savePersisted('layer', state);
}

export function resetLayerMockState(): void {
  Object.assign(state, seed());
  clearPersistedScope('layer');
}

function activeLayers(): MockLayer[] {
  return state.layers
    .filter((l) => l.deletedAt === null)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

function findLayer(layerId: string): MockLayer | undefined {
  return state.layers.find((l) => l.layerId === layerId && l.deletedAt === null);
}

function nameExists(name: string, excludeLayerId?: string): boolean {
  return state.layers.some(
    (l) =>
      l.deletedAt === null &&
      l.name === name &&
      (excludeLayerId === undefined || l.layerId !== excludeLayerId),
  );
}

export const layerHandlers = [
  http.get('/api/v1/facades/me/layers', () => {
    return HttpResponse.json(activeLayers());
  }),

  http.get('/api/v1/facades/me/layers/:layerId', ({ params }) => {
    const layer = findLayer(String(params.layerId));
    if (!layer) {
      return HttpResponse.json(
        { code: 'LAYER_NOT_FOUND', message: 'Layer 를 찾을 수 없습니다.' },
        { status: 404 },
      );
    }
    return HttpResponse.json(layer);
  }),

  http.post('/api/v1/facades/me/layers', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { name?: string };
    const trimmed = body.name?.trim();
    if (!trimmed || trimmed.length > 50) {
      return HttpResponse.json(
        { code: 'C001', message: 'Layer 이름은 1~50자 사이여야 합니다.' },
        { status: 400 },
      );
    }
    if (nameExists(trimmed)) {
      return HttpResponse.json(
        { code: 'LAYER_NAME_DUPLICATE', message: '이미 존재하는 Layer 이름입니다.' },
        { status: 409 },
      );
    }
    const displayOrder = activeLayers().length;
    const layer: MockLayer = {
      layerId: String(state.nextId++),
      name: trimmed,
      displayOrder,
      progressStatus: 'NOT_STARTED',
      deletedAt: null,
      createdAt: new Date().toISOString(),
    };
    state.layers.push(layer);
    persist();
    return HttpResponse.json(layer, { status: 201 });
  }),

  http.patch('/api/v1/facades/me/layers/:layerId', async ({ params, request }) => {
    const layerId = String(params.layerId);
    const layer = findLayer(layerId);
    if (!layer) {
      return HttpResponse.json(
        { code: 'LAYER_NOT_FOUND', message: 'Layer 를 찾을 수 없습니다.' },
        { status: 404 },
      );
    }
    const body = (await request.json().catch(() => ({}))) as { name?: string };
    const trimmed = body.name?.trim();
    if (!trimmed || trimmed.length > 50) {
      return HttpResponse.json(
        { code: 'C001', message: 'Layer 이름은 1~50자 사이여야 합니다.' },
        { status: 400 },
      );
    }
    if (nameExists(trimmed, layerId)) {
      return HttpResponse.json(
        { code: 'LAYER_NAME_DUPLICATE', message: '이미 존재하는 Layer 이름입니다.' },
        { status: 409 },
      );
    }
    const changed = layer.name !== trimmed;
    layer.name = trimmed;
    persist();
    return HttpResponse.json({ ...layer, changed });
  }),

  http.delete('/api/v1/facades/me/layers/:layerId', ({ params }) => {
    const layerId = String(params.layerId);
    const layer = findLayer(layerId);
    if (!layer) {
      return HttpResponse.json(
        { code: 'LAYER_NOT_FOUND', message: 'Layer 를 찾을 수 없습니다.' },
        { status: 404 },
      );
    }
    layer.deletedAt = new Date().toISOString();
    persist();
    return new HttpResponse(null, { status: 204 });
  }),

  http.put('/api/v1/facades/me/layers/order', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as {
      orderedLayerIds?: string[];
    };
    const ordered = body.orderedLayerIds ?? [];
    const alive = activeLayers();
    if (ordered.length !== alive.length) {
      return HttpResponse.json(
        {
          code: 'LAYER_REORDER_MISMATCH',
          message: 'Layer id 집합이 일치하지 않습니다.',
        },
        { status: 400 },
      );
    }
    const idSet = new Set(alive.map((l) => l.layerId));
    for (const id of ordered) {
      if (!idSet.has(String(id))) {
        return HttpResponse.json(
          {
            code: 'LAYER_REORDER_MISMATCH',
            message: 'Layer id 집합이 일치하지 않습니다.',
          },
          { status: 400 },
        );
      }
    }
    ordered.forEach((id, i) => {
      const l = state.layers.find((x) => x.layerId === String(id));
      if (l) l.displayOrder = i;
    });
    persist();
    return HttpResponse.json({ layers: activeLayers() });
  }),
];
