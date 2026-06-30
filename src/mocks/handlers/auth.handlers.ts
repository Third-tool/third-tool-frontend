import { http, HttpResponse } from 'msw';
import { clearPersistedScope, loadPersisted, savePersisted } from '../persistence';

interface AuthState {
  authenticated: boolean;
  rtSerial: number;
  nickname: string;
  email: string;
}

const DEMO_USERNAME = 'demo@third.tool';
const DEMO_PASSWORD = 'demo-pass';

function seedAuth(): AuthState {
  return {
    authenticated: true,
    rtSerial: 0,
    nickname: '도연',
    email: DEMO_USERNAME,
  };
}

const state: AuthState = loadPersisted<AuthState>('auth', seedAuth());

function persist(): void {
  savePersisted('auth', state);
}

export function resetAuthMockState(): void {
  Object.assign(state, seedAuth());
  clearPersistedScope('auth');
}

function issueRefreshToken(): string {
  state.rtSerial += 1;
  return `mock-rt-${state.rtSerial}`;
}

function authCookieHeader() {
  return { 'Set-Cookie': 'access_token=mock-at; Path=/; HttpOnly; Max-Age=1800' };
}

export const authHandlers = [
  http.post('/login', async ({ request }) => {
    const body = (await request.json()) as { username?: string; password?: string };
    if (!body.username || !body.password) {
      return HttpResponse.json(
        { code: 'C001', message: '아이디와 비밀번호를 입력해주세요.' },
        { status: 400 },
      );
    }
    if (body.username !== DEMO_USERNAME || body.password !== DEMO_PASSWORD) {
      return HttpResponse.json(
        { code: 'USER001', message: 'invalid credentials' },
        { status: 401 },
      );
    }
    state.authenticated = true;
    persist();
    return HttpResponse.json({ refreshToken: issueRefreshToken() }, { status: 200, headers: authCookieHeader() });
  }),

  http.get('/user', () => {
    if (!state.authenticated) {
      return HttpResponse.json(
        { code: 'AUTH001', message: 'login required' },
        { status: 401 },
      );
    }
    return HttpResponse.json({
      username: DEMO_USERNAME,
      nickname: state.nickname,
      email: state.email,
      social: false,
    });
  }),

  http.post('/jwt/refresh', async ({ request }) => {
    const body = (await request.json()) as { refreshToken?: string };
    if (!body.refreshToken) {
      return HttpResponse.json(
        { code: 'AUTH104', message: 'rt missing' },
        { status: 400 },
      );
    }
    if (!body.refreshToken.startsWith('mock-rt-')) {
      return HttpResponse.json(
        { code: 'AUTH101', message: 'rt invalid' },
        { status: 401 },
      );
    }
    state.authenticated = true;
    persist();
    return HttpResponse.json({ refreshToken: issueRefreshToken() }, { status: 200, headers: authCookieHeader() });
  }),

  http.post('/user', async ({ request }) => {
    const body = (await request.json()) as {
      username?: string;
      password?: string;
      nickname?: string;
      email?: string;
    };
    if (!body.username || !body.password || !body.nickname || !body.email) {
      return HttpResponse.json(
        { code: 'C001', message: '모든 필드를 입력해주세요' },
        { status: 400 },
      );
    }
    if (body.username === DEMO_USERNAME) {
      return HttpResponse.json(
        { code: 'USER003', message: '이미 가입된 사용자입니다' },
        { status: 409 },
      );
    }
    state.authenticated = true;
    persist();
    return HttpResponse.json({ userEntityId: 1234 }, { status: 201 });
  }),

  http.post('/social/login/:provider', async ({ params, request }) => {
    const provider = params.provider as string;
    if (provider !== 'kakao' && provider !== 'naver') {
      return HttpResponse.json(
        { code: 'USER010', message: '지원하지 않는 소셜 제공자입니다.' },
        { status: 400 },
      );
    }
    const body = (await request.json().catch(() => ({}))) as { code?: string; state?: string };
    if (!body.code) {
      return HttpResponse.json(
        { code: 'C001', message: '잘못된 입력 값입니다.' },
        { status: 400 },
      );
    }
    state.authenticated = true;
    persist();
    return HttpResponse.json(
      { refreshToken: issueRefreshToken() },
      { status: 200, headers: authCookieHeader() },
    );
  }),

  http.put('/user', async ({ request }) => {
    if (!state.authenticated) {
      return HttpResponse.json(
        { code: 'AUTH001', message: 'login required' },
        { status: 401 },
      );
    }
    const body = (await request.json().catch(() => ({}))) as {
      username?: unknown;
      password?: unknown;
      nickname?: unknown;
      email?: unknown;
    };
    if (body.username !== undefined || body.password !== undefined) {
      return HttpResponse.json(
        { code: 'C001', message: '잘못된 입력 값입니다.' },
        { status: 400 },
      );
    }
    if (typeof body.email === 'string' && body.email.length > 0 && !body.email.includes('@')) {
      return HttpResponse.json(
        { code: 'C001', message: '올바른 이메일 형식이 아니에요.' },
        { status: 400 },
      );
    }
    if (typeof body.nickname === 'string' && body.nickname.trim()) {
      state.nickname = body.nickname.trim();
    }
    if (typeof body.email === 'string' && body.email.trim()) {
      state.email = body.email.trim();
    }
    persist();
    return HttpResponse.json(1, { status: 200 });
  }),
];
