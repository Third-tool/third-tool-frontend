import '@testing-library/jest-dom/vitest';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import { cleanup, configure } from '@testing-library/react';
import { server } from '@/mocks/node';

// MSW + zod + React Query roundtrip can exceed the 1000ms default under
// parallel vitest workers; 10s keeps assertions deterministic without making
// genuine failures take long to surface.
configure({ asyncUtilTimeout: 10000 });

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());

class MockIntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
  constructor(_cb: IntersectionObserverCallback, _opts?: IntersectionObserverInit) {}
}

vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
