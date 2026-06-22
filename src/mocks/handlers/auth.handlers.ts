import { http, HttpResponse } from 'msw';

interface AuthState {
  authenticated: boolean;
  rtSerial: number;
}

const DEMO_USERNAME = 'demo@third.tool';
const DEMO_PASSWORD = 'demo-pass';

const state: AuthState = {
  authenticated: true,
  rtSerial: 0,
};

export function resetAuthMockState(): void {
  state.authenticated = true;
  state.rtSerial = 0;
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
      nickname: '도연',
      email: DEMO_USERNAME,
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
    return HttpResponse.json({ userEntityId: 1234 }, { status: 201 });
  }),
];
