import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';
import { clearAllPersistedMocks } from './persistence';

export const worker = setupWorker(...handlers);

// Detect ?resetMocks=1 BEFORE worker.start() so the next page load reads a
// fresh seed. Note: by the time this runs, the handler modules have already
// loaded their state from sessionStorage at import time, so a reload is needed
// for the clear to take effect — we redirect with the param stripped.
function handleResetParam(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  if (!params.has('resetMocks')) return false;
  clearAllPersistedMocks();
  params.delete('resetMocks');
  const search = params.toString();
  const next = `${window.location.pathname}${search ? '?' + search : ''}${window.location.hash}`;
  window.location.replace(next);
  return true;
}

export async function startMockServiceWorker(): Promise<void> {
  if (!import.meta.env.DEV) return;
  if (import.meta.env.VITE_USE_MOCKS !== 'true') return;
  if (handleResetParam()) return;

  // Console helper: clears persisted mocks and reloads — useful during uxtest.
  if (typeof window !== 'undefined') {
    (window as unknown as { __resetMocks?: () => void }).__resetMocks = () => {
      clearAllPersistedMocks();
      window.location.reload();
    };
  }

  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: '/mockServiceWorker.js' },
  });

  console.info('[MSW] worker started — __resetMocks() to clear persisted state');
}
