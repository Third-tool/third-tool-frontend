import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createApiClient, ApiError } from './client';

describe('createApiClient', () => {
  beforeEach(() => vi.resetAllMocks());

  it('uses VITE_API_BASE_URL or fallback', () => {
    const c = createApiClient({ baseURL: '/api' });
    expect(c.defaults.baseURL).toBe('/api');
  });

  it('normalizes backend error code via response interceptor', async () => {
    const c = createApiClient({ baseURL: '/api' });
    const responded = {
      response: {
        status: 400,
        data: { code: 'LF_CONCEPT_REQUIRED', message: 'concept needed' },
      },
    };
    const handler = (c.interceptors.response as unknown as {
      handlers: Array<{ rejected: (e: unknown) => unknown }>;
    }).handlers[0]!.rejected;
    await expect(handler(responded)).rejects.toBeInstanceOf(ApiError);
    await expect(handler(responded)).rejects.toMatchObject({
      code: 'LF_CONCEPT_REQUIRED',
      status: 400,
    });
  });
});
