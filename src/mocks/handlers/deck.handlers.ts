import { http, HttpResponse } from 'msw';
import { getCardMockState } from './card.handlers';

type DeckProgress = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

function computeProgress(deckId: number): DeckProgress {
  const cards = [...getCardMockState().cards.values()].filter((c) => c.deckId === deckId);
  if (cards.length === 0) return 'NOT_STARTED';
  if (cards.some((c) => c.status === 'ON_FIELD')) return 'IN_PROGRESS';
  return 'COMPLETED';
}

interface MockDeck {
  deckId: number;
  name: string;
  parentDeckId: number | null;
  depth: number;
  onLibrary: boolean;
  publishedAt: string | null;
  lastAccessed: string | null;
  cardCount: number;
  subDeckCount: number;
  createdDate: string;
  updatedDate: string;
}

const now = '2026-06-01T08:00:00Z';

const state: { decks: Map<number, MockDeck>; nextId: number } = {
  decks: new Map([
    [
      1,
      {
        deckId: 1,
        name: '기본 노트',
        parentDeckId: null,
        depth: 0,
        onLibrary: false,
        publishedAt: null,
        lastAccessed: now,
        cardCount: 5,
        subDeckCount: 0,
        createdDate: now,
        updatedDate: now,
      },
    ],
  ]),
  nextId: 2,
};

function toSummary(d: MockDeck) {
  return {
    deckId: d.deckId,
    name: d.name,
    depth: d.depth,
    onLibrary: d.onLibrary,
    lastAccessed: d.lastAccessed,
    cardCount: d.cardCount,
    subDeckCount: d.subDeckCount,
    progressStatus: computeProgress(d.deckId),
  };
}

function toDetail(d: MockDeck) {
  return {
    deckId: d.deckId,
    name: d.name,
    parentDeckId: d.parentDeckId,
    depth: d.depth,
    onLibrary: d.onLibrary,
    publishedAt: d.publishedAt,
    lastAccessed: d.lastAccessed,
    cardCount: d.cardCount,
    subDeckCount: d.subDeckCount,
    progressStatus: computeProgress(d.deckId),
    createdDate: d.createdDate,
    updatedDate: d.updatedDate,
  };
}

export const deckHandlers = [
  http.get('/api/v1/decks', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? '0');
    const size = Number(url.searchParams.get('size') ?? '20');
    const all = [...state.decks.values()].filter((d) => d.parentDeckId === null);
    const start = page * size;
    const content = all.slice(start, start + size).map(toSummary);
    return HttpResponse.json({
      content,
      totalElements: all.length,
      totalPages: Math.max(1, Math.ceil(all.length / size)),
      page,
      size,
    });
  }),

  http.get('/api/v1/decks/:deckId', ({ params }) => {
    const id = Number(params.deckId);
    const d = state.decks.get(id);
    if (!d) return HttpResponse.json({ code: 'DECK001', message: 'not found' }, { status: 404 });
    return HttpResponse.json(toDetail(d));
  }),

  http.post('/api/v1/decks', async ({ request }) => {
    const body = (await request.json()) as { name?: string; parentDeckId?: number | string | null };
    if (!body.name) return HttpResponse.json({ code: 'DECK004', message: 'name required' }, { status: 400 });
    const parentId =
      body.parentDeckId == null || body.parentDeckId === ''
        ? null
        : Number(body.parentDeckId);
    const parent = parentId !== null ? state.decks.get(parentId) : null;
    const id = state.nextId++;
    const ts = new Date().toISOString();
    const created: MockDeck = {
      deckId: id,
      name: body.name,
      parentDeckId: parentId,
      depth: parent ? parent.depth + 1 : 0,
      onLibrary: false,
      publishedAt: null,
      lastAccessed: ts,
      cardCount: 0,
      subDeckCount: 0,
      createdDate: ts,
      updatedDate: ts,
    };
    state.decks.set(id, created);
    if (parent) {
      parent.subDeckCount += 1;
    }
    return HttpResponse.json(
      {
        deckId: created.deckId,
        name: created.name,
        parentDeckId: created.parentDeckId,
        depth: created.depth,
        onLibrary: created.onLibrary,
        publishedAt: created.publishedAt,
        lastAccessed: created.lastAccessed,
        createdDate: created.createdDate,
      },
      { status: 201 },
    );
  }),

  http.get('/api/v1/decks/:deckId/sub-decks', ({ params }) => {
    const id = Number(params.deckId);
    if (!state.decks.has(id)) {
      return HttpResponse.json({ code: 'DECK001', message: 'not found' }, { status: 404 });
    }
    const subs = [...state.decks.values()]
      .filter((d) => d.parentDeckId === id)
      .map(toSummary);
    return HttpResponse.json(subs);
  }),

  http.patch('/api/v1/decks/:deckId/name', async ({ params, request }) => {
    const id = Number(params.deckId);
    const d = state.decks.get(id);
    if (!d) return HttpResponse.json({ code: 'DECK001', message: 'not found' }, { status: 404 });
    const body = (await request.json()) as { name?: string };
    if (!body.name?.trim()) {
      return HttpResponse.json({ code: 'DECK004', message: 'name required' }, { status: 400 });
    }
    d.name = body.name.trim();
    d.updatedDate = new Date().toISOString();
    return HttpResponse.json({ deckId: d.deckId, name: d.name });
  }),

  http.patch('/api/v1/decks/:deckId/parent', async ({ params, request }) => {
    const id = Number(params.deckId);
    const d = state.decks.get(id);
    if (!d) return HttpResponse.json({ code: 'DECK001', message: 'not found' }, { status: 404 });
    const body = (await request.json()) as { parentDeckId?: number | string | null };
    const nextParentId =
      body.parentDeckId == null || body.parentDeckId === ''
        ? null
        : Number(body.parentDeckId);

    if (nextParentId !== null) {
      if (nextParentId === id) {
        return HttpResponse.json(
          { code: 'DECK006', message: '이미 연결된 덱으로 이동할 수 없어요' },
          { status: 409 },
        );
      }
      let cursor: number | null = nextParentId;
      const visited = new Set<number>();
      while (cursor !== null) {
        if (cursor === id) {
          return HttpResponse.json(
            { code: 'DECK006', message: '이미 연결된 덱으로 이동할 수 없어요' },
            { status: 409 },
          );
        }
        if (visited.has(cursor)) break;
        visited.add(cursor);
        const next = state.decks.get(cursor);
        if (!next) {
          return HttpResponse.json({ code: 'DECK001', message: 'parent not found' }, { status: 404 });
        }
        cursor = next.parentDeckId;
      }
    }

    if (d.parentDeckId !== null) {
      const prev = state.decks.get(d.parentDeckId);
      if (prev) prev.subDeckCount = Math.max(0, prev.subDeckCount - 1);
    }
    d.parentDeckId = nextParentId;
    const nextParent = nextParentId !== null ? state.decks.get(nextParentId) : null;
    d.depth = nextParent ? nextParent.depth + 1 : 0;
    if (nextParent) nextParent.subDeckCount += 1;
    d.updatedDate = new Date().toISOString();
    return HttpResponse.json({ deckId: d.deckId, parentDeckId: d.parentDeckId });
  }),

  http.delete('/api/v1/decks/:deckId', ({ params }) => {
    const id = Number(params.deckId);
    const d = state.decks.get(id);
    if (!d) return HttpResponse.json({ code: 'DECK001', message: 'not found' }, { status: 404 });
    const stack: number[] = [id];
    while (stack.length > 0) {
      const current = stack.pop()!;
      const cur = state.decks.get(current);
      if (!cur) continue;
      for (const child of state.decks.values()) {
        if (child.parentDeckId === current) stack.push(child.deckId);
      }
      if (cur.parentDeckId !== null && cur.deckId === id) {
        const parent = state.decks.get(cur.parentDeckId);
        if (parent) parent.subDeckCount = Math.max(0, parent.subDeckCount - 1);
      }
      state.decks.delete(current);
    }
    return new HttpResponse(null, { status: 204 });
  }),
];
