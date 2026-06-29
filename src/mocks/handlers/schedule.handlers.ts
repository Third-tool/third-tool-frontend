import { http, HttpResponse } from 'msw';

type Mode = 'MODE_10D' | 'MODE_20D' | 'MODE_30D';

interface MockSchedule {
  rawInputDays: number;
  mappedMode: Mode;
  modeDisplayName: string;
  maxView: number;
  maxDuration: number;
  dailyTarget: number;
  softScheduleIntervals: number[];
}

interface MockHistoryEntry {
  historyId: string;
  fromMode: Mode | null;
  toMode: Mode;
  rawInputDays: number;
  changedAt: string;
}

const MODE_DEFAULTS: Record<Mode, { maxView: number; intervals: number[]; label: string }> = {
  MODE_10D: { maxView: 3, intervals: [1, 3, 7], label: '단기 학습 모드' },
  MODE_20D: { maxView: 5, intervals: [1, 3, 7, 14], label: '중기 학습 모드' },
  MODE_30D: { maxView: 7, intervals: [1, 3, 7, 14, 30], label: '장기 학습 모드' },
};

function mapMode(inputDays: number): Mode {
  if (inputDays <= 14) return 'MODE_10D';
  if (inputDays <= 24) return 'MODE_20D';
  return 'MODE_30D';
}

function buildSchedule(inputDays: number, dailyTarget: number): MockSchedule {
  const mode = mapMode(inputDays);
  const defaults = MODE_DEFAULTS[mode];
  return {
    rawInputDays: inputDays,
    mappedMode: mode,
    modeDisplayName: defaults.label,
    maxView: defaults.maxView,
    maxDuration: inputDays,
    dailyTarget,
    softScheduleIntervals: defaults.intervals,
  };
}

interface ScheduleState {
  exists: boolean;
  schedule: MockSchedule;
  updatedAt: string;
  history: MockHistoryEntry[];
  nextHistoryId: number;
}

function initialState(): ScheduleState {
  const initial = buildSchedule(14, 10);
  return {
    exists: true,
    schedule: initial,
    updatedAt: '2026-06-01T08:00:00Z',
    history: [],
    nextHistoryId: 1,
  };
}

const state: ScheduleState = initialState();

export function resetScheduleMockState(): void {
  const fresh = initialState();
  Object.assign(state, fresh);
}

function envelope(extra: { mappingGuide?: object } = {}) {
  return {
    schedule: state.schedule,
    updatedAt: state.updatedAt,
    ...extra,
  };
}

export const scheduleHandlers = [
  http.get('/api/v1/users/me/schedule', () => {
    if (!state.exists) {
      return HttpResponse.json(
        { code: 'SCHEDULE_NOT_FOUND', message: '학습 일정이 없습니다.' },
        { status: 404 },
      );
    }
    return HttpResponse.json(envelope());
  }),

  http.put('/api/v1/users/me/schedule', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { inputDays?: number };
    const inputDays = Number(body.inputDays);
    if (!Number.isFinite(inputDays) || inputDays < 1 || inputDays > 365) {
      return HttpResponse.json(
        { code: 'C001', message: 'inputDays는 1~365 사이여야 합니다.' },
        { status: 400 },
      );
    }
    const prevMode = state.exists ? state.schedule.mappedMode : null;
    const nextSchedule = buildSchedule(inputDays, state.schedule.dailyTarget);
    state.exists = true;
    state.schedule = nextSchedule;
    state.updatedAt = new Date().toISOString();
    if (prevMode !== nextSchedule.mappedMode) {
      state.history.unshift({
        historyId: `history-${state.nextHistoryId++}`,
        fromMode: prevMode,
        toMode: nextSchedule.mappedMode,
        rawInputDays: inputDays,
        changedAt: state.updatedAt,
      });
    }
    return HttpResponse.json(
      envelope({
        mappingGuide: {
          fromMode: prevMode,
          toMode: nextSchedule.mappedMode,
          message: `${inputDays}일 → ${nextSchedule.modeDisplayName}`,
        },
      }),
    );
  }),

  http.patch('/api/v1/users/me/schedule/daily-target', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { dailyTarget?: number };
    const dailyTarget = Number(body.dailyTarget);
    if (!Number.isFinite(dailyTarget) || dailyTarget < 1 || dailyTarget > 200) {
      return HttpResponse.json(
        { code: 'C001', message: 'dailyTarget은 1~200 사이여야 합니다.' },
        { status: 400 },
      );
    }
    state.schedule = { ...state.schedule, dailyTarget };
    state.updatedAt = new Date().toISOString();
    return HttpResponse.json(
      envelope({
        mappingGuide: {
          toMode: state.schedule.mappedMode,
          message: `오늘 목표 ${dailyTarget}장`,
        },
      }),
    );
  }),

  http.get('/api/v1/users/me/schedule/history', ({ request }) => {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get('limit') ?? '0');
    const list =
      limit > 0 ? state.history.slice(0, limit) : state.history;
    return HttpResponse.json(list);
  }),
];
