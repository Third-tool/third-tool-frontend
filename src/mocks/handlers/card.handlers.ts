import { http, HttpResponse } from 'msw';
import type { Card } from '@/lib/api/schemas/card';

interface MockState {
  cards: Map<string, Card>;
  nextId: number;
}

function seed(): MockState {
  const now = '2026-06-10T08:00:00Z';
  const data: Card[] = [
    {
      cardId: 'c1', status: 'ON_FIELD', enteredFieldAt: now, viewCount: 0,
      summary: 'JPA의 영속성 컨텍스트는 1차 캐시 역할을 한다.',
      keywords: ['JPA', '영속성'], tags: [{ tagId: 't_jpa', name: 'JPA' }],
    },
    {
      cardId: 'c2', status: 'ON_FIELD', enteredFieldAt: now, viewCount: 1,
      summary: 'B+ tree의 리프 노드만이 실제 데이터를 가진다.',
      keywords: ['Index', 'BTree'], tags: [{ tagId: 't_db', name: 'DB' }],
    },
    {
      cardId: 'c3', status: 'ON_FIELD', enteredFieldAt: now, viewCount: 2,
      summary: 'Kafka의 컨슈머 그룹은 파티션 단위로 오프셋을 관리한다.',
      keywords: ['Kafka'], tags: [{ tagId: 't_kafka', name: 'Kafka' }],
    },
    {
      cardId: 'c4', status: 'ON_FIELD', enteredFieldAt: now, viewCount: 4,
      summary: 'DDD의 Aggregate는 일관성 경계의 단위이다.',
      keywords: ['DDD', 'Aggregate'], tags: [{ tagId: 't_ddd', name: 'DDD' }],
    },
    {
      cardId: 'a1', status: 'ARCHIVE', enteredFieldAt: '2026-05-20T08:00:00Z', viewCount: 5,
      summary: 'HTTP/2의 헤더 압축(HPACK)은 정적 + 동적 테이블 기반이다.',
      keywords: ['HTTP/2'], tags: [{ tagId: 't_net', name: 'Network' }],
    },
    {
      cardId: 'a2', status: 'ARCHIVE', enteredFieldAt: '2026-05-22T08:00:00Z', viewCount: 5,
      summary: 'TCP slow start는 초기 cwnd를 두 RTT마다 두 배로 증가시킨다.',
      keywords: ['TCP'], tags: [{ tagId: 't_net', name: 'Network' }],
    },
    {
      cardId: 'a3', status: 'ARCHIVE', enteredFieldAt: '2026-05-25T08:00:00Z', viewCount: 5,
      summary: 'Effective Java 항목 17: 불변 객체는 자유롭게 공유될 수 있다.',
      keywords: ['Java', 'Effective Java'], tags: [{ tagId: 't_java', name: 'Java' }],
    },
    {
      cardId: 'a4', status: 'ARCHIVE', enteredFieldAt: '2026-05-28T08:00:00Z', viewCount: 5,
      summary: '동시성 제어에서 OCC는 충돌이 드문 경우 좋은 성능을 보인다.',
      keywords: ['OCC', '동시성'], tags: [{ tagId: 't_db', name: 'DB' }],
    },
    {
      cardId: 'a5', status: 'ARCHIVE', enteredFieldAt: '2026-06-01T08:00:00Z', viewCount: 5,
      summary: 'TLS 1.3은 0-RTT 재개를 지원한다.',
      keywords: ['TLS'], tags: [{ tagId: 't_net', name: 'Network' }],
    },
  ];
  const map = new Map<string, Card>();
  data.forEach((c) => map.set(c.cardId, c));
  return { cards: map, nextId: 100 };
}

const state: MockState = seed();

export function resetCardMockState(): void {
  const fresh = seed();
  state.cards = fresh.cards;
  state.nextId = fresh.nextId;
}

const dayLabels = ['DAY_1', 'DAY_3', 'DAY_7'] as const;

function labelForViewCount(viewCount: number): typeof dayLabels[number] {
  if (viewCount <= 0) return 'DAY_1';
  if (viewCount <= 2) return 'DAY_3';
  return 'DAY_7';
}

export const cardHandlers = [
  http.get('/api/review-session/today', ({ request }) => {
    const url = new URL(request.url);
    const dailyTarget = Number(url.searchParams.get('dailyTarget') ?? '30');
    const onField = [...state.cards.values()].filter((c) => c.status === 'ON_FIELD');
    const ordered = [...onField].sort((a, b) => a.viewCount - b.viewCount).slice(0, dailyTarget);
    const cards = ordered.map((c) => ({
      cardId: c.cardId,
      state: labelForViewCount(c.viewCount),
      summary: c.summary,
    }));
    const breakdown = { DAY_1: 0, DAY_3: 0, DAY_7: 0 };
    cards.forEach((c) => breakdown[c.state]++);
    return HttpResponse.json({
      stateBreakdown: breakdown,
      recommended: cards.length,
      cards,
    });
  }),

  http.post('/api/cards/:id/view', ({ params }) => {
    const id = params.id as string;
    const c = state.cards.get(id);
    if (!c) return HttpResponse.json({ code: 'CARD_NOT_FOUND', message: 'gone' }, { status: 404 });
    const newCount = c.viewCount + 1;
    const maxView = 5;
    let autoArchived = false;
    let archiveReason: 'MAX_VIEW' | 'MAX_DURATION' | null = null;
    if (newCount >= maxView) {
      autoArchived = true;
      archiveReason = 'MAX_VIEW';
      state.cards.set(id, { ...c, viewCount: newCount, status: 'ARCHIVE' });
    } else {
      state.cards.set(id, { ...c, viewCount: newCount });
    }
    return HttpResponse.json({
      autoArchived,
      archiveReason,
      lastViewedAt: new Date().toISOString(),
      viewCount: newCount,
    });
  }),

  http.post('/api/cards/:id/archive', ({ params }) => {
    const id = params.id as string;
    const c = state.cards.get(id);
    if (!c) return HttpResponse.json({ code: 'CARD_NOT_FOUND', message: 'gone' }, { status: 404 });
    const updated: Card = { ...c, status: 'ARCHIVE' };
    state.cards.set(id, updated);
    return HttpResponse.json(updated);
  }),

  http.post('/api/cards/:id/return-to-field', ({ params }) => {
    const id = params.id as string;
    const c = state.cards.get(id);
    if (!c) return HttpResponse.json({ code: 'CARD_NOT_FOUND', message: 'gone' }, { status: 404 });
    const updated: Card = {
      ...c,
      status: 'ON_FIELD',
      viewCount: 0,
      enteredFieldAt: new Date().toISOString(),
    };
    state.cards.set(id, updated);
    return HttpResponse.json(updated);
  }),

  http.post('/api/review-session/extend', ({ request }) => {
    const url = new URL(request.url);
    const count = Number(url.searchParams.get('count') ?? '10');
    return HttpResponse.json({
      addedCards: [],
      remainingAvailable: 0,
      completedAll: true,
      _meta: { requested: count },
    });
  }),

  http.get('/api/cards', ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') ?? 'ON_FIELD';
    const tagId = url.searchParams.get('tagId');
    let cards = [...state.cards.values()].filter((c) => c.status === status);
    if (tagId) cards = cards.filter((c) => c.tags.some((t) => t.tagId === tagId));
    return HttpResponse.json(cards);
  }),

  http.post('/api/cards', async ({ request }) => {
    const body = (await request.json()) as { summary?: string; keywords?: string[]; tags?: string[] };
    if (!body.summary) return HttpResponse.json({ code: 'CARD_SUMMARY_REQUIRED', message: 'need summary' }, { status: 400 });
    if (!body.keywords || body.keywords.length === 0) {
      return HttpResponse.json({ code: 'CARD_KEYWORD_MIN_REQUIRED', message: 'need 1+ keywords' }, { status: 400 });
    }
    const id = `c-${state.nextId++}`;
    const card: Card = {
      cardId: id,
      status: 'ON_FIELD',
      enteredFieldAt: new Date().toISOString(),
      viewCount: 0,
      summary: body.summary,
      keywords: body.keywords,
      tags: (body.tags ?? []).map((name) => ({ tagId: `t_${name}`, name })),
    };
    state.cards.set(id, card);
    return HttpResponse.json(card);
  }),
];
