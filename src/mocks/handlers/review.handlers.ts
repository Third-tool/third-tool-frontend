import { http, HttpResponse } from 'msw';
import { getCardMockState, persistCardMockState, type MockCard } from './card.handlers';
import { getScheduleMockState } from './schedule.handlers';
import { clearPersistedScope, loadPersisted, savePersisted } from '../persistence';

const DEFAULT_DECK_NAME = '기본 노트';
const FALLBACK_MAX_VIEW = 5;

function currentMaxView(): number {
  return getScheduleMockState().schedule.maxView ?? FALLBACK_MAX_VIEW;
}

interface MockSession {
  sessionId: string;
  deckId: number;
  cardIds: number[];
  currentIndex: number;
  reviewStep: 'RECALLING' | 'COMPARING';
  comparingStartedAt: string | null;
}

interface ReviewState {
  sessions: Map<string, MockSession>;
  nextSessionId: number;
}

interface PersistedReviewState {
  sessions: Array<[string, MockSession]>;
  nextSessionId: number;
}

function seedReview(): ReviewState {
  return { sessions: new Map(), nextSessionId: 1 };
}

const reviewState: ReviewState = loadPersisted<ReviewState>(
  'review',
  seedReview(),
  (raw): ReviewState => {
    const obj = raw as PersistedReviewState;
    return {
      sessions: new Map(obj.sessions ?? []),
      nextSessionId: obj.nextSessionId ?? 1,
    };
  },
);

// Local aliases keep existing handler code readable.
const sessions = reviewState.sessions;

function persist(): void {
  savePersisted<ReviewState>('review', reviewState, (s) => ({
    sessions: [...s.sessions.entries()],
    nextSessionId: s.nextSessionId,
  }));
}

export function resetReviewMockState(): void {
  reviewState.sessions.clear();
  reviewState.nextSessionId = 1;
  clearPersistedScope('review');
}

function buildCard(session: MockSession, card: MockCard) {
  const isComparing = session.reviewStep === 'COMPARING';
  return {
    cardReviewId: `${session.sessionId}-${card.cardId}`,
    cardId: card.cardId,
    cardOrder: session.currentIndex + 1,
    reviewStep: session.reviewStep,
    isLastView: card.viewCount + 1 >= currentMaxView(),
    mainNote: { text: card.mainText },
    keywordCues: isComparing ? card.keywords.map((k) => ({ value: k.value })) : undefined,
    summary: isComparing ? card.summary : null,
    comparingStartedAt: isComparing ? session.comparingStartedAt : null,
  };
}

// Layer 1 sessions cross decks — interleave deck pools so no single deck
// starves the queue. Single-deck scope passes through untouched.
function roundRobinByDeck(cards: MockCard[]): MockCard[] {
  const byDeck = new Map<number, MockCard[]>();
  for (const c of cards) {
    const list = byDeck.get(c.deckId);
    if (list) list.push(c);
    else byDeck.set(c.deckId, [c]);
  }
  if (byDeck.size <= 1) return cards;
  const result: MockCard[] = [];
  let added = true;
  while (added) {
    added = false;
    for (const list of byDeck.values()) {
      const next = list.shift();
      if (next) {
        result.push(next);
        added = true;
      }
    }
  }
  return result;
}

function snapshot(session: MockSession) {
  const isFinished = session.currentIndex >= session.cardIds.length;
  const cardState = getCardMockState();
  const currentCard = isFinished
    ? null
    : cardState.cards.get(session.cardIds[session.currentIndex]!) ?? null;
  return {
    sessionId: session.sessionId,
    deckId: session.deckId,
    deckName: DEFAULT_DECK_NAME,
    totalCardCount: session.cardIds.length,
    currentIndex: session.currentIndex,
    isFinished,
    currentCard: currentCard ? buildCard(session, currentCard) : null,
  };
}

// M5 신설(2026-07-22+): product-review Epic 2 · from-batch 세션 생성 + record-view 진행률 갱신.
// BE 이슈 #25 (Cross-Layer scope 재편) · deck-scope 세션은 하위 호환 유지 · from-batch가 v1 진입.
interface FromBatchSession {
  sessionId: string;
  dailyBatchId: string;
  cardIds: string[];
  currentIndex: number;
  viewedCardIds: Set<string>;
  isFinished: boolean;
}

const fromBatchSessions = new Map<string, FromBatchSession>();
let nextFromBatchSessionId = 100;
// 사용자당 하나의 활성 세션 · Story 2-3 자동 finish 정책. 3명 규모라 user 구분 없이 단일 slot.
let activeFromBatchSessionId: string | null = null;

export const reviewHandlers = [
  // M5 Story 2-1: POST /api/v1/review-sessions/from-batch { batchId }.
  // 진행 중 세션 있으면 자동 finish 후 새 세션 생성 · previousSessionAutoFinished=true.
  http.post('/api/v1/review-sessions/from-batch', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { batchId?: string };
    if (!body.batchId) {
      return HttpResponse.json(
        { code: 'C001', message: 'batchId required' },
        { status: 400 },
      );
    }
    let previousSessionAutoFinished = false;
    if (activeFromBatchSessionId) {
      const prev = fromBatchSessions.get(activeFromBatchSessionId);
      if (prev && !prev.isFinished) {
        prev.isFinished = true;
        previousSessionAutoFinished = true;
      }
    }
    const cardState = getCardMockState();
    const cardIds = [...cardState.cards.values()]
      .filter((c) => c.status === 'ON_FIELD' && c.axisId !== null)
      .map((c) => String(c.cardId));
    const sessionId = `fbs-${nextFromBatchSessionId++}`;
    const session: FromBatchSession = {
      sessionId,
      dailyBatchId: body.batchId,
      cardIds,
      currentIndex: 0,
      viewedCardIds: new Set(),
      isFinished: cardIds.length === 0,
    };
    fromBatchSessions.set(sessionId, session);
    activeFromBatchSessionId = sessionId;
    const firstCardId = cardIds[0];
    const firstCard =
      firstCardId !== undefined
        ? cardState.cards.get(Number(firstCardId))
        : null;
    return HttpResponse.json(
      {
        sessionId,
        dailyBatchId: body.batchId,
        totalCardCount: cardIds.length,
        currentIndex: 0,
        isFinished: session.isFinished,
        currentCard: firstCard
          ? {
              cardReviewId: `${sessionId}-${firstCard.cardId}`,
              cardId: firstCard.cardId,
              cardOrder: 1,
              reviewStep: 'RECALLING',
              isLastView: false,
              mainNote: { text: firstCard.mainText },
              keywordCues: undefined,
              summary: null,
              comparingStartedAt: null,
            }
          : null,
        previousSessionAutoFinished,
      },
      { status: 201 },
    );
  }),

  // M5 Story 2-3: POST /api/v1/review-sessions/:sessionId/record-view { cardId }.
  http.post(
    '/api/v1/review-sessions/:sessionId/record-view',
    async ({ params, request }) => {
      const sessionId = params.sessionId as string;
      const session = fromBatchSessions.get(sessionId);
      if (!session) {
        return HttpResponse.json(
          { code: 'REVIEW_SESSION_NOT_FOUND', message: '세션을 찾을 수 없어요' },
          { status: 404 },
        );
      }
      if (session.isFinished) {
        return HttpResponse.json(
          { code: 'DAILY_BATCH_CLOSED', message: '이 batch는 종료됐어요' },
          { status: 409 },
        );
      }
      const body = (await request.json().catch(() => ({}))) as { cardId?: string };
      const cardId = body.cardId;
      if (!cardId) {
        return HttpResponse.json(
          { code: 'C001', message: 'cardId required' },
          { status: 400 },
        );
      }
      session.viewedCardIds.add(cardId);
      // 카드 실 상태 갱신 (viewCount + lastViewedAt) · card.handlers 미러링.
      const cardState = getCardMockState();
      const card = cardState.cards.get(Number(cardId));
      if (card) {
        const now = new Date().toISOString();
        const nextViewCount = card.viewCount + 1;
        const maxView = currentMaxView();
        const willArchive = nextViewCount >= maxView;
        const updated: MockCard = {
          ...card,
          viewCount: nextViewCount,
          lastViewedAt: now,
          status: willArchive ? 'ARCHIVE' : card.status,
          archiveReason:
            willArchive && card.status === 'ON_FIELD'
              ? 'SCHEDULE_EXHAUSTED'
              : card.archiveReason,
          updatedDate: now,
        };
        cardState.cards.set(Number(cardId), updated);
        persistCardMockState();
      }
      return HttpResponse.json({
        sessionId,
        cardId,
        viewedAt: new Date().toISOString(),
        batchViewedCount: session.viewedCardIds.size,
        batchTotalCount: session.cardIds.length,
      });
    },
  ),

  http.post('/api/v1/reviews', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as {
      deckId?: number | string;
      scope?: 'DECK' | 'FACADE';
    };
    const scope = body.scope ?? 'DECK';

    let cards: MockCard[];
    let deckIdForSession: number;
    if (scope === 'FACADE') {
      cards = [...getCardMockState().cards.values()].filter(
        (c) => c.status === 'ON_FIELD',
      );
      // FACADE scope crosses decks; pick the first card's deck for the snapshot
      // label, or fall back to 0 if pool is empty.
      deckIdForSession = cards[0]?.deckId ?? 0;
    } else {
      if (body.deckId == null || body.deckId === '') {
        return HttpResponse.json(
          { code: 'C001', message: 'deckId required for DECK scope' },
          { status: 400 },
        );
      }
      deckIdForSession = Number(body.deckId);
      cards = [...getCardMockState().cards.values()].filter(
        (c) => c.deckId === deckIdForSession && c.status === 'ON_FIELD',
      );
    }

    const ordered = roundRobinByDeck(cards);
    const sessionId = `session-${reviewState.nextSessionId++}`;
    const session: MockSession = {
      sessionId,
      deckId: deckIdForSession,
      cardIds: ordered.map((c) => c.cardId),
      currentIndex: 0,
      reviewStep: 'RECALLING',
      comparingStartedAt: null,
    };
    sessions.set(sessionId, session);
    persist();
    return HttpResponse.json(snapshot(session), { status: 201 });
  }),

  http.get('/api/v1/reviews/:sessionId', ({ params }) => {
    const session = sessions.get(params.sessionId as string);
    if (!session) {
      return HttpResponse.json(
        { code: 'REVIEW_SESSION_NOT_FOUND', message: '세션을 찾을 수 없어요' },
        { status: 404 },
      );
    }
    return HttpResponse.json(snapshot(session));
  }),

  http.patch('/api/v1/reviews/:sessionId/comparing', ({ params }) => {
    const session = sessions.get(params.sessionId as string);
    if (!session) {
      return HttpResponse.json(
        { code: 'REVIEW_SESSION_NOT_FOUND', message: '세션을 찾을 수 없어요' },
        { status: 404 },
      );
    }
    const cardId = session.cardIds[session.currentIndex];
    const card = cardId !== undefined ? getCardMockState().cards.get(cardId) : undefined;
    if (!card) {
      return HttpResponse.json(
        { code: 'REVIEW_NO_CURRENT_CARD', message: '현재 카드가 없습니다.' },
        { status: 409 },
      );
    }
    session.reviewStep = 'COMPARING';
    session.comparingStartedAt = new Date().toISOString();
    persist();
    return HttpResponse.json(buildCard(session, card));
  }),

  http.patch('/api/v1/reviews/:sessionId/next', ({ params }) => {
    const session = sessions.get(params.sessionId as string);
    if (!session) {
      return HttpResponse.json(
        { code: 'REVIEW_SESSION_NOT_FOUND', message: '세션을 찾을 수 없어요' },
        { status: 404 },
      );
    }
    // M4 Epic 2: 자동 아카이브 시 archiveReason='SCHEDULE_EXHAUSTED' (정상 소진).
    // 구 MAX_VIEW/MAX_DURATION 통합 · MODE_DOWNGRADED는 별도 mode-change 엔드포인트에서 처리.
    const cardState = getCardMockState();
    const leavingId = session.cardIds[session.currentIndex];
    if (leavingId !== undefined) {
      const card = cardState.cards.get(leavingId);
      if (card) {
        const now = new Date().toISOString();
        const nextViewCount = card.viewCount + 1;
        const maxView = currentMaxView();
        const willArchive = nextViewCount >= maxView;
        const updated: MockCard = {
          ...card,
          viewCount: nextViewCount,
          lastViewedAt: now,
          status: willArchive ? 'ARCHIVE' : card.status,
          archiveReason: willArchive && card.status === 'ON_FIELD' ? 'SCHEDULE_EXHAUSTED' : card.archiveReason,
          updatedDate: now,
        };
        cardState.cards.set(leavingId, updated);
        persistCardMockState();
      }
    }
    session.currentIndex += 1;
    session.reviewStep = 'RECALLING';
    session.comparingStartedAt = null;
    persist();
    const snap = snapshot(session);
    return HttpResponse.json({
      sessionId: snap.sessionId,
      currentIndex: snap.currentIndex,
      isFinished: snap.isFinished,
      currentCard: snap.currentCard,
    });
  }),
];
