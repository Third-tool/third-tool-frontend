import { http, HttpResponse } from 'msw';
import { getCardMockState } from './card.handlers';
import { clearPersistedScope, loadPersisted, savePersisted } from '../persistence';

// product-review (FE) Epic 1 · M5 신설 (2026-07-22+).
// BE 이슈 #24 DailyLearningBatch Aggregate MSW 미러링.
// - 하루당 1개 · (userId, batchDate UNIQUE)
// - lazy 생성 · idempotent · cross-layer 짬뽕
// - 자정 close 시뮬레이션은 dev tool로 (`?force-closed=true` query · Story 1-5)

const DEFAULT_USER_ID = 'user-1';

interface MockEntry {
  cardId: string;
  cardIntervalDay: number;
  exposedAt: string;
  viewedAt: string | null;
  summary: string;
  layerName: string | null;
  axisName: string | null;
  createdMode: 'MODE_7D' | 'MODE_14D' | 'MODE_28D' | 'MODE_60D' | null;
}

interface MockBatch {
  userId: string;
  batchDate: string;
  entries: MockEntry[];
  completionRate: number;
  streak: number;
  closedAt: string | null;
}

interface MockState {
  batch: MockBatch | null;
  streak: number;
}

function todayKst(): string {
  // KST YYYY-MM-DD · Intl.DateTimeFormat 활용.
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

function generateEntries(): MockEntry[] {
  // cross-layer 짬뽕: card.handlers의 ON_FIELD 카드 중 axisId 태그된 것만 (M5 PR#1 seed 준수).
  const cardState = getCardMockState();
  const onField = [...cardState.cards.values()].filter(
    (c) => c.status === 'ON_FIELD' && c.axisId !== null,
  );
  const now = new Date().toISOString();
  return onField.map((c, idx) => ({
    cardId: String(c.cardId),
    // card_interval_day ASC 정렬 근사값 · viewCount 기준 (0 → D+1, 1 → D+3, 2 → D+7).
    cardIntervalDay: [1, 3, 7, 14, 28, 60][Math.min(c.viewCount, 5)] ?? 1,
    exposedAt: now,
    viewedAt: null,
    summary: c.summary,
    layerName: '기본 레이어',
    axisName: c.axisId,
    createdMode: c.createdMode,
    // 원본 idx는 안정 정렬용 (테스트 재현성).
    _sortKey: idx,
  })).sort((a, b) => a.cardIntervalDay - b.cardIntervalDay)
    .map(({ _sortKey: _s, ...rest }) => rest);
}

function initialState(): MockState {
  return { batch: null, streak: 3 };
}

const state: MockState = loadPersisted<MockState>('daily-batch', initialState());

function persist(): void {
  savePersisted('daily-batch', state);
}

export function resetDailyBatchMockState(): void {
  Object.assign(state, initialState());
  clearPersistedScope('daily-batch');
}

function ensureBatch(force = false): MockBatch {
  const today = todayKst();
  if (!force && state.batch && state.batch.batchDate === today) {
    return state.batch;
  }
  const entries = generateEntries();
  state.batch = {
    userId: DEFAULT_USER_ID,
    batchDate: today,
    entries,
    completionRate: 0,
    streak: state.streak,
    closedAt: null,
  };
  persist();
  return state.batch;
}

function computeCompletionRate(batch: MockBatch): number {
  if (batch.entries.length === 0) return 0;
  const viewed = batch.entries.filter((e) => e.viewedAt !== null).length;
  return viewed / batch.entries.length;
}

export const dailyBatchHandlers = [
  // Story 1-1: POST /api/v1/daily-batch/today · lazy 생성 · idempotent.
  http.post('/api/v1/daily-batch/today', ({ request }) => {
    const url = new URL(request.url);
    // Story 1-5 dev 시뮬: force-closed=true 시 자정 close 상태 반환.
    const forceClosed = url.searchParams.get('force-closed') === 'true';
    const batch = ensureBatch(false);
    batch.completionRate = computeCompletionRate(batch);
    if (forceClosed && !batch.closedAt) {
      batch.closedAt = new Date().toISOString();
      persist();
    }
    return HttpResponse.json(batch);
  }),
];
