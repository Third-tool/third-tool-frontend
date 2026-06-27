import type { SocialProvider } from '@/lib/api/schemas/auth';

interface ProviderConfig {
  label: string;
  authorizeUrl: string;
  clientId: string | undefined;
  // Comma-separated additional scopes the provider expects (optional).
  scope?: string;
}

export const PROVIDERS: Record<SocialProvider, ProviderConfig> = {
  kakao: {
    label: '카카오로 계속하기',
    authorizeUrl: 'https://kauth.kakao.com/oauth/authorize',
    clientId: import.meta.env.VITE_KAKAO_CLIENT_ID,
  },
  naver: {
    label: '네이버로 계속하기',
    authorizeUrl: 'https://nid.naver.com/oauth2.0/authorize',
    clientId: import.meta.env.VITE_NAVER_CLIENT_ID,
  },
};

// BE registered redirect URI per provider is http://localhost:5173/oauth/{provider}/callback
// (application-dev.yml). In staging/prod the host changes but the path is identical, so
// derive from window.location.origin.
export function redirectUriFor(provider: SocialProvider): string {
  return `${window.location.origin}/oauth/${provider}/callback`;
}

const STATE_KEY = 'oauth.pending';

interface PendingState {
  provider: SocialProvider;
  state: string;
  next: string;
}

function randomState(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `state-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function startOAuthFlow(provider: SocialProvider, next: string): void {
  const cfg = PROVIDERS[provider];
  if (!cfg.clientId) {
    throw new Error(`OAuth client id missing for ${provider}`);
  }
  const state = randomState();
  const pending: PendingState = { provider, state, next };
  sessionStorage.setItem(STATE_KEY, JSON.stringify(pending));
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: cfg.clientId,
    redirect_uri: redirectUriFor(provider),
    state,
  });
  if (cfg.scope) params.set('scope', cfg.scope);
  window.location.assign(`${cfg.authorizeUrl}?${params.toString()}`);
}

export function consumePendingOAuth(provider: SocialProvider): PendingState | null {
  const raw = sessionStorage.getItem(STATE_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(STATE_KEY);
  try {
    const parsed = JSON.parse(raw) as PendingState;
    if (parsed.provider !== provider) return null;
    return parsed;
  } catch {
    return null;
  }
}
