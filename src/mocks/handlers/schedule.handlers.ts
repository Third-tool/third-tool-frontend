import { http, HttpResponse } from 'msw';
import { clearPersistedScope, loadPersisted, savePersisted } from '../persistence';

// M4 재편(2026-07-15+): LearningMode 4옵션 (MODE_7D/14D/28D/60D · product-card Epic 1).
// 기존 3옵션 (MODE_10D/20D/30D) SUPERSEDED · learningMode.ts 정책 스냅샷 미러링.
type Mode = 'MODE_7D' | 'MODE_14D' | 'MODE_28D' | 'MODE_60D';

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
  MODE_7D: { maxView: 3, intervals: [1, 3, 7], label: '집중 학습 모드' },
  MODE_14D: { maxView: 4, intervals: [1, 3, 7, 14], label: '단기 학습 모드' },
  MODE_28D: { maxView: 5, intervals: [1, 3, 7, 14, 28], label: '중기 학습 모드' },
  MODE_60D: { maxView: 6, intervals: [1, 3, 7, 14, 28, 60], label: '장기 학습 모드' },
};

const RAW_INPUT_DAYS_CAP = 60;

function mapMode(inputDays: number): Mode {
  if (inputDays <= 7) return 'MODE_7D';
  if (inputDays <= 14) return 'MODE_14D';
  if (inputDays <= 28) return 'MODE_28D';
  return 'MODE_60D';
}

function buildSchedule(inputDays: number, dailyTarget: number): MockSchedule {
  const clampedDays = Math.min(inputDays, RAW_INPUT_DAYS_CAP);
  const mode = mapMode(clampedDays);
  const defaults = MODE_DEFAULTS[mode];
  return {
    rawInputDays: clampedDays,
    mappedMode: mode,
    modeDisplayName: defaults.label,
    maxView: defaults.maxView,
    maxDuration: clampedDays,
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

const state: ScheduleState = loadPersisted<ScheduleState>('schedule', initialState());

function persist(): void {
  savePersisted('schedule', state);
}

// Exposed so review/card handlers can read maxView and softScheduleIntervals
// without re-implementing the BE mode-mapping rules.
export function getScheduleMockState(): ScheduleState {
  return state;
}

export function resetScheduleMockState(): void {
  Object.assign(state, initialState());
  clearPersistedScope('schedule');
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
    // M4 Story 1-5: raw_input_days > 60 시 MODE_60D_CLAMPED 정보성 안내.
    const wasClamped = inputDays > RAW_INPUT_DAYS_CAP;
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
        rawInputDays: nextSchedule.rawInputDays,
        changedAt: state.updatedAt,
      });
    }
    persist();
    return HttpResponse.json(
      envelope({
        mappingGuide: {
          fromMode: prevMode,
          toMode: nextSchedule.mappedMode,
          message: wasClamped
            ? `${inputDays}일은 최대 ${RAW_INPUT_DAYS_CAP}일까지 지원돼요. ${nextSchedule.modeDisplayName}(${nextSchedule.rawInputDays}일)로 저장됐어요.`
            : `${inputDays}일 → ${nextSchedule.modeDisplayName}`,
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
    persist();
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
