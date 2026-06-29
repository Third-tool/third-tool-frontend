import { http, HttpResponse } from 'msw';
import { getCardMockState, type MockCard } from './card.handlers';

const DEFAULT_DECK_NAME = '기본 노트';
const MAX_VIEW = 5;

interface MockSession {
  sessionId: string;
  deckId: number;
  cardIds: number[];
  currentIndex: number;
  reviewStep: 'RECALLING' | 'COMPARING';
  comparingStartedAt: string | null;
}

const sessions = new Map<string, MockSession>();
let nextSessionId = 1;

export function resetReviewMockState(): void {
  sessions.clear();
  nextSessionId = 1;
}

function buildCard(session: MockSession, card: MockCard) {
  const isComparing = session.reviewStep === 'COMPARING';
  return {
    cardReviewId: `${session.sessionId}-${card.cardId}`,
    cardId: card.cardId,
    cardOrder: session.currentIndex + 1,
    reviewStep: session.reviewStep,
    isLastView: card.viewCount + 1 >= MAX_VIEW,
    mainNote: { text: card.mainText },
    keywordCues: isComparing ? card.keywords.map((k) => ({ value: k.value })) : undefined,
    summary: isComparing ? card.summary : null,
    comparingStartedAt: isComparing ? session.comparingStartedAt : null,
  };
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
    const body = (await request.json().catch(() => ({}))) as { deckId?: number | string };
    if (body.deckId == null || body.deckId === '') {
      return HttpResponse.json(
        { code: 'C001', message: 'deckId required' },
        { status: 400 },
      );
    }
    const deckId = Number(body.deckId);
    const cards = [...getCardMockState().cards.values()].filter(
      (c) => c.deckId === deckId && c.status === 'ON_FIELD',
    );
    const sessionId = `session-${nextSessionId++}`;
    const session: MockSession = {
      sessionId,
      deckId,
      cardIds: cards.map((c) => c.cardId),
      currentIndex: 0,
      reviewStep: 'RECALLING',
      comparingStartedAt: null,
    };
    sessions.set(sessionId, session);
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
    // Increment viewCount of card we are leaving (and auto-archive at MAX_VIEW).
    const cardState = getCardMockState();
    const leavingId = session.cardIds[session.currentIndex];
    if (leavingId !== undefined) {
      const card = cardState.cards.get(leavingId);
      if (card) {
        const now = new Date().toISOString();
        const nextViewCount = card.viewCount + 1;
        const updated: MockCard = {
          ...card,
          viewCount: nextViewCount,
          lastViewedAt: now,
          status: nextViewCount >= MAX_VIEW ? 'ARCHIVE' : card.status,
          updatedDate: now,
        };
        cardState.cards.set(leavingId, updated);
      }
    }
    session.currentIndex += 1;
    session.reviewStep = 'RECALLING';
    session.comparingStartedAt = null;
    const snap = snapshot(session);
    return HttpResponse.json({
      sessionId: snap.sessionId,
      currentIndex: snap.currentIndex,
      isFinished: snap.isFinished,
      currentCard: snap.currentCard,
    });
  }),
];
