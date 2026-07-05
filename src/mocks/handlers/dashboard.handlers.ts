import { http, HttpResponse } from 'msw';
import { getCardMockState } from './card.handlers';
import { clearPersistedScope, loadPersisted, savePersisted } from '../persistence';

// product-review (FE) Epic 3 · M5 신설 (2026-07-22+).
// BE 이슈 #26 (캐시 측정 대시보드 L2) MSW 미러링.
// - v1: raw stats만 (Today · Recent7 · Streak)
// - recommendations는 항상 null (v2 M6에서 활성화 · nullable 필드 유지)

interface MockState {
  todayCompleted: number;
  streakCurrent: number;
  streakLongest: number;
}

function initialState(): MockState {
  // seed 데이터 · 사용자 3명 규모 초기값.
  return {
    todayCompleted: 0,
    streakCurrent: 3,
    streakLongest: 5,
  };
}

const state: MockState = loadPersisted<MockState>('dashboard', initialState());

function persist(): void {
  savePersisted('dashboard', state);
}

export function resetDashboardMockState(): void {
  Object.assign(state, initialState());
  clearPersistedScope('dashboard');
}

function computeTodayTotal(): number {
  // Today total = 오늘 batch entries · card.handlers ON_FIELD + axisId 카드 수.
  const cardState = getCardMockState();
  return [...cardState.cards.values()].filter(
    (c) => c.status === 'ON_FIELD' && c.axisId !== null,
  ).length;
}

export const dashboardHandlers = [
  // Story 3-1: GET /api/v1/dashboard/summary · v1 L2.
  http.get('/api/v1/dashboard/summary', ({ request }) => {
    const url = new URL(request.url);
    // dev 시뮬: ?empty=true → 활동 0 empty state 재현.
    const empty = url.searchParams.get('empty') === 'true';

    if (empty) {
      return HttpResponse.json({
        today: { completed: 0, total: 0, ratio: 0 },
        recent7Days: {
          avgCompletionRatio: 0,
          perfectClearDays: 0,
          totalDays: 0,
          dailyRatios: [0, 0, 0, 0, 0, 0, 0],
        },
        streak: { current: 0, longest: 0 },
        recommendations: null,
      });
    }

    const total = computeTodayTotal();
    const completed = state.todayCompleted;
    const ratio = total === 0 ? 0 : completed / total;

    // Recent7Days · v1 하드코딩 샘플 값 (실 계산은 BE에서 · MSW는 대표값).
    const dailyRatios = [0.6, 0.8, 0.5, 1.0, 0.7, 0.9, 0.4];
    const avgCompletionRatio =
      dailyRatios.reduce((a, b) => a + b, 0) / dailyRatios.length;
    const perfectClearDays = dailyRatios.filter((r) => r >= 1).length;

    persist();

    return HttpResponse.json({
      today: { completed, total, ratio },
      recent7Days: {
        avgCompletionRatio,
        perfectClearDays,
        totalDays: 7,
        dailyRatios,
      },
      streak: {
        current: state.streakCurrent,
        longest: state.streakLongest,
      },
      // v1은 항상 null (L3 UI 잠금 · v2에서 배열로 전환).
      recommendations: null,
    });
  }),
];
