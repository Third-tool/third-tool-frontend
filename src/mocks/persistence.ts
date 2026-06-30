// MSW mock state persistence (sessionStorage). Lets uxtest multi-step flows
// survive F5 — facade/cards/decks/schedule keep their data instead of reseeding.
//
// sessionStorage is intentional: each tab gets a fresh slate, but the active
// session stays consistent. The `version` envelope auto-invalidates on schema
// changes so a stale shape never crashes the app.

const VERSION = 1;
const PREFIX = 'third:mock:';

interface PersistEnvelope<T> {
  version: number;
  data: T;
}

function hasStorage(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return typeof window.sessionStorage !== 'undefined';
  } catch {
    return false;
  }
}

export function loadPersisted<T>(
  scope: string,
  fallback: T,
  reviver?: (raw: unknown) => T,
): T {
  if (!hasStorage()) return fallback;
  try {
    const raw = window.sessionStorage.getItem(PREFIX + scope);
    if (!raw) return fallback;
    const env = JSON.parse(raw) as PersistEnvelope<unknown>;
    if (env?.version !== VERSION) return fallback;
    return reviver ? reviver(env.data) : (env.data as T);
  } catch {
    return fallback;
  }
}

export function savePersisted<T>(
  scope: string,
  state: T,
  serializer?: (state: T) => unknown,
): void {
  if (!hasStorage()) return;
  try {
    const data = serializer ? serializer(state) : state;
    const env: PersistEnvelope<unknown> = { version: VERSION, data };
    window.sessionStorage.setItem(PREFIX + scope, JSON.stringify(env));
  } catch {
    // quota exceeded / circular refs — silent no-op (mocks only).
  }
}

export function clearPersistedScope(scope: string): void {
  if (!hasStorage()) return;
  try {
    window.sessionStorage.removeItem(PREFIX + scope);
  } catch {
    // no-op
  }
}

export function clearAllPersistedMocks(): void {
  if (!hasStorage()) return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.sessionStorage.length; i++) {
      const k = window.sessionStorage.key(i);
      if (k && k.startsWith(PREFIX)) keys.push(k);
    }
    keys.forEach((k) => window.sessionStorage.removeItem(k));
  } catch {
    // no-op
  }
}
