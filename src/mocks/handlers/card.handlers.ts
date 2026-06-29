import { http, HttpResponse } from 'msw';

const DEFAULT_DECK_ID = 1;
const DEFAULT_DECK_NAME = '기본 노트';

interface RawTagDto {
  id: number;
  value: string;
  linkedAt: string;
}
interface RawKeywordDto {
  id: number;
  value: string;
}
interface MockCard {
  cardId: number;
  deckId: number;
  status: 'ON_FIELD' | 'ARCHIVE';
  enteredFieldAt: string;
  viewCount: number;
  summary: string;
  keywords: RawKeywordDto[];
  tags: RawTagDto[];
  mainText: string;
  lastViewedAt: string | null;
  createdDate: string;
  updatedDate: string;
}

interface MockState {
  cards: Map<number, MockCard>;
  nextId: number;
}

function tag(id: number, value: string): RawTagDto {
  return { id, value, linkedAt: '2026-06-01T08:00:00Z' };
}
function kw(id: number, value: string): RawKeywordDto {
  return { id, value };
}

function seed(): MockState {
  const now = '2026-06-10T08:00:00Z';
  const old = '2026-05-20T08:00:00Z';
  const data: MockCard[] = [
    {
      cardId: 1, deckId: DEFAULT_DECK_ID, status: 'ON_FIELD', enteredFieldAt: now, viewCount: 0,
      summary: 'JPA의 영속성 컨텍스트는 1차 캐시 역할을 한다.',
      keywords: [kw(1, 'JPA'), kw(2, '영속성')], tags: [tag(1, 'JPA')],
      mainText: 'JPA persistence context acts as a 1st level cache.',
      lastViewedAt: null, createdDate: now, updatedDate: now,
    },
    {
      cardId: 2, deckId: DEFAULT_DECK_ID, status: 'ON_FIELD', enteredFieldAt: now, viewCount: 1,
      summary: 'B+ tree의 리프 노드만이 실제 데이터를 가진다.',
      keywords: [kw(3, 'Index'), kw(4, 'BTree')], tags: [tag(2, 'DB')],
      mainText: 'Only leaf nodes of B+ trees hold actual data.',
      lastViewedAt: null, createdDate: now, updatedDate: now,
    },
    {
      cardId: 3, deckId: DEFAULT_DECK_ID, status: 'ON_FIELD', enteredFieldAt: now, viewCount: 2,
      summary: 'Kafka의 컨슈머 그룹은 파티션 단위로 오프셋을 관리한다.',
      keywords: [kw(5, 'Kafka')], tags: [tag(3, 'Kafka')],
      mainText: 'Kafka consumer groups track offsets per partition.',
      lastViewedAt: null, createdDate: now, updatedDate: now,
    },
    {
      cardId: 11, deckId: DEFAULT_DECK_ID, status: 'ARCHIVE', enteredFieldAt: old, viewCount: 5,
      summary: 'HTTP/2의 헤더 압축(HPACK)은 정적 + 동적 테이블 기반이다.',
      keywords: [kw(11, 'HTTP/2')], tags: [tag(4, 'Network')],
      mainText: 'HTTP/2 header compression uses static + dynamic tables.',
      lastViewedAt: null, createdDate: old, updatedDate: old,
    },
    {
      cardId: 12, deckId: DEFAULT_DECK_ID, status: 'ARCHIVE', enteredFieldAt: old, viewCount: 5,
      summary: 'TLS 1.3은 0-RTT 재개를 지원한다.',
      keywords: [kw(12, 'TLS')], tags: [tag(4, 'Network')],
      mainText: 'TLS 1.3 supports 0-RTT resumption.',
      lastViewedAt: null, createdDate: old, updatedDate: old,
    },
  ];
  const map = new Map<number, MockCard>();
  data.forEach((c) => map.set(c.cardId, c));
  return { cards: map, nextId: 100 };
}

const state: MockState = seed();

export function resetCardMockState(): void {
  const fresh = seed();
  state.cards = fresh.cards;
  state.nextId = fresh.nextId;
}

type SoftScheduleState = 'FRESH' | 'INTERVAL_1D' | 'INTERVAL_3D' | 'INTERVAL_7D' | 'INTERVAL_14D' | 'INTERVAL_21D';

function stateForViewCount(viewCount: number): SoftScheduleState {
  if (viewCount <= 0) return 'FRESH';
  if (viewCount === 1) return 'INTERVAL_1D';
  if (viewCount === 2) return 'INTERVAL_3D';
  return 'INTERVAL_7D';
}

function toDetail(c: MockCard) {
  return {
    cardId: c.cardId,
    deckId: c.deckId,
    mainNote: { textContent: c.mainText, imageUrl: null, contentType: 'TEXT' },
    keywords: c.keywords,
    summary: c.summary,
    tags: c.tags,
    status: c.status,
    enteredFieldAt: c.enteredFieldAt,
    viewCount: c.viewCount,
    lastViewedAt: c.lastViewedAt,
    createdDate: c.createdDate,
    updatedDate: c.updatedDate,
  };
}

function toSummary(c: MockCard) {
  return {
    cardId: c.cardId,
    keywords: c.keywords,
    summary: c.summary,
    tags: c.tags,
    contentType: 'TEXT' as const,
    status: c.status,
    enteredFieldAt: c.enteredFieldAt,
    viewCount: c.viewCount,
    lastViewedAt: c.lastViewedAt,
    createdDate: c.createdDate,
  };
}

export const cardHandlers = [
  http.get('/api/v1/review-session/today', ({ request }) => {
    const url = new URL(request.url);
    const target = Number(url.searchParams.get('target') ?? '30');
    const onField = [...state.cards.values()].filter((c) => c.status === 'ON_FIELD');
    const byState: Record<SoftScheduleState, Array<{ cardId: number; deckId: number; deckName: string; summary: string }>> = {
      FRESH: [], INTERVAL_1D: [], INTERVAL_3D: [], INTERVAL_7D: [], INTERVAL_14D: [], INTERVAL_21D: [],
    };
    for (const c of onField) {
      const s = stateForViewCount(c.viewCount);
      byState[s].push({ cardId: c.cardId, deckId: c.deckId, deckName: DEFAULT_DECK_NAME, summary: c.summary });
    }
    const total = onField.length;
    const recommendedTotal = Math.min(target, total);
    const recommendedByState: Record<SoftScheduleState, number> = {
      FRESH: byState.FRESH.length, INTERVAL_1D: byState.INTERVAL_1D.length,
      INTERVAL_3D: byState.INTERVAL_3D.length, INTERVAL_7D: byState.INTERVAL_7D.length,
      INTERVAL_14D: 0, INTERVAL_21D: 0,
    };
    return HttpResponse.json({ total, dailyTarget: target, recommendedTotal, recommendedByState, byState });
  }),

  http.get('/api/v1/cards/:id', ({ params }) => {
    const id = Number(params.id);
    const c = state.cards.get(id);
    if (!c) {
      return HttpResponse.json(
        { code: 'CARD_NOT_FOUND', message: '카드를 찾을 수 없습니다.' },
        { status: 404 },
      );
    }
    return HttpResponse.json(toDetail(c));
  }),

  http.post('/api/v1/cards/:id/tags', async ({ params, request }) => {
    const id = Number(params.id);
    const c = state.cards.get(id);
    if (!c) {
      return HttpResponse.json(
        { code: 'CARD_NOT_FOUND', message: '카드를 찾을 수 없습니다.' },
        { status: 404 },
      );
    }
    const body = (await request.json().catch(() => ({}))) as { value?: string };
    const value = body.value?.trim();
    if (!value) {
      return HttpResponse.json(
        { code: 'C001', message: '잘못된 입력 값입니다.' },
        { status: 400 },
      );
    }
    if (c.tags.some((t) => t.value === value)) {
      return HttpResponse.json(
        { code: 'CARD_TAG_ALREADY_EXISTS', message: '이미 있는 태그예요' },
        { status: 409 },
      );
    }
    if (c.tags.length >= 3) {
      return HttpResponse.json(
        { code: 'CARD_TAG_LIMIT_EXCEEDED', message: '태그는 최대 3개까지' },
        { status: 400 },
      );
    }
    const newTag = tag(state.nextId++, value);
    const updated: MockCard = {
      ...c,
      tags: [...c.tags, newTag],
      updatedDate: new Date().toISOString(),
    };
    state.cards.set(id, updated);
    return HttpResponse.json({ cardId: updated.cardId, tags: updated.tags });
  }),

  http.delete('/api/v1/cards/:id/tags/:tagId', ({ params }) => {
    const id = Number(params.id);
    const tagId = Number(params.tagId);
    const c = state.cards.get(id);
    if (!c) {
      return HttpResponse.json(
        { code: 'CARD_NOT_FOUND', message: '카드를 찾을 수 없습니다.' },
        { status: 404 },
      );
    }
    const updated: MockCard = {
      ...c,
      tags: c.tags.filter((t) => t.id !== tagId),
      updatedDate: new Date().toISOString(),
    };
    state.cards.set(id, updated);
    return HttpResponse.json({ cardId: updated.cardId, tags: updated.tags });
  }),

  http.patch('/api/v1/cards/:id/summary', async ({ params, request }) => {
    const id = Number(params.id);
    const c = state.cards.get(id);
    if (!c) {
      return HttpResponse.json(
        { code: 'CARD_NOT_FOUND', message: '카드를 찾을 수 없습니다.' },
        { status: 404 },
      );
    }
    const body = (await request.json().catch(() => ({}))) as { summary?: string };
    const summary = body.summary?.trim();
    if (!summary) {
      return HttpResponse.json(
        { code: 'C001', message: '요약을 입력해주세요.' },
        { status: 400 },
      );
    }
    const updated: MockCard = { ...c, summary, updatedDate: new Date().toISOString() };
    state.cards.set(id, updated);
    return HttpResponse.json({ cardId: updated.cardId, summary: updated.summary });
  }),

  http.delete('/api/v1/cards/:id', ({ params }) => {
    const id = Number(params.id);
    if (!state.cards.has(id)) {
      return HttpResponse.json(
        { code: 'CARD_NOT_FOUND', message: '카드를 찾을 수 없습니다.' },
        { status: 404 },
      );
    }
    state.cards.delete(id);
    return new HttpResponse(null, { status: 204 });
  }),

  http.post('/api/v1/cards/:id/archive', ({ params }) => {
    const id = Number(params.id);
    const c = state.cards.get(id);
    if (!c) return HttpResponse.json({ code: 'CARD001', message: '카드를 찾을 수 없습니다.' }, { status: 404 });
    const updated: MockCard = { ...c, status: 'ARCHIVE', updatedDate: new Date().toISOString() };
    state.cards.set(id, updated);
    return HttpResponse.json(toDetail(updated));
  }),

  http.post('/api/v1/cards/:id/return-to-field', ({ params }) => {
    const id = Number(params.id);
    const c = state.cards.get(id);
    if (!c) return HttpResponse.json({ code: 'CARD001', message: '카드를 찾을 수 없습니다.' }, { status: 404 });
    const updated: MockCard = {
      ...c,
      status: 'ON_FIELD',
      viewCount: 0,
      enteredFieldAt: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
    };
    state.cards.set(id, updated);
    return HttpResponse.json(toDetail(updated));
  }),

  http.get('/api/v1/decks/:deckId/cards', ({ params }) => {
    const deckId = Number(params.deckId);
    const list = [...state.cards.values()].filter((c) => c.deckId === deckId).map(toSummary);
    return HttpResponse.json(list);
  }),

  http.post('/api/v1/decks/:deckId/cards', async ({ params, request }) => {
    const deckId = Number(params.deckId);
    const body = (await request.json()) as {
      mainNote?: { textContent?: string };
      keywords?: string[];
      summary?: string;
      tags?: string[];
    };
    if (!body.summary) return HttpResponse.json({ code: 'CARD020', message: 'summary required' }, { status: 400 });
    if (!body.keywords || body.keywords.length === 0) {
      return HttpResponse.json({ code: 'CARD031', message: 'keyword required' }, { status: 400 });
    }
    const id = state.nextId++;
    const now = new Date().toISOString();
    const card: MockCard = {
      cardId: id,
      deckId,
      status: 'ON_FIELD',
      enteredFieldAt: now,
      viewCount: 0,
      summary: body.summary,
      keywords: body.keywords.map((value, i) => kw(state.nextId++ + i, value)),
      tags: (body.tags ?? []).map((value, i) => tag(state.nextId++ + i, value)),
      mainText: body.mainNote?.textContent ?? '',
      lastViewedAt: null,
      createdDate: now,
      updatedDate: now,
    };
    state.cards.set(id, card);
    return HttpResponse.json(toDetail(card), { status: 201 });
  }),
];
