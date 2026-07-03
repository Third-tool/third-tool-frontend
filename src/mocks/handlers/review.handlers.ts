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

export const reviewHandlers = [
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
