import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { getMemoryRefreshToken, setMemoryRefreshToken } from '@/features/auth/refreshTokenStore';

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly requestId: string | null;
  constructor(code: string, message: string, status: number, requestId: string | null = null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.requestId = requestId;
  }
}

interface CreateApiClientOptions {
  baseURL?: string;
  onSessionLost?: () => void;
}

// Backend ErrorCode short codes: see Common/Exception/ErrorCode/ErrorCode.java.
// AT-expired triggers a one-shot refresh; all other auth failures terminate the session.
const REFRESH_RECOVERABLE_CODES = new Set(['AUTH002']);
const REFRESH_TERMINAL_CODES = new Set([
  'AUTH001', // AUTH_TOKEN_MISSING
  'AUTH003', // AUTH_TOKEN_INVALID
  'AUTH004', // AUTH_USER_NOT_FOUND
  'AUTH101', // REFRESH_TOKEN_INVALID
  'AUTH102', // REFRESH_TOKEN_NOT_FOUND
  'AUTH103', // REFRESH_TOKEN_REUSED
  'AUTH104', // REFRESH_TOKEN_MISSING
]);

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

function newRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createApiClient(options: CreateApiClientOptions = {}): AxiosInstance {
  const instance = axios.create({
    baseURL: options.baseURL ?? import.meta.env.VITE_API_BASE_URL ?? '',
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
  });

  instance.interceptors.request.use((config) => {
    config.headers.set('X-Request-Id', newRequestId());
    return config;
  });

  let refreshPromise: Promise<string> | null = null;

  const runRefresh = async (): Promise<string> => {
    const token = getMemoryRefreshToken();
    if (!token) throw new ApiError('AUTH102', 'no refresh token', 401);
    const { data } = await axios.post(
      `${instance.defaults.baseURL ?? ''}/jwt/refresh`,
      { refreshToken: token },
      { withCredentials: true, headers: { 'X-Request-Id': newRequestId() } },
    );
    const next = (data as { refreshToken?: string }).refreshToken;
    if (!next) throw new ApiError('AUTH101', 'invalid refresh response', 401);
    setMemoryRefreshToken(next);
    return next;
  };

  const handleSessionLost = () => {
    setMemoryRefreshToken(null);
    options.onSessionLost?.();
  };

  const extractRequestId = (error: AxiosError): string | null => {
    const r = error.response;
    if (!r) return null;
    const header = r.headers?.['x-request-id'];
    if (typeof header === 'string' && header.length > 0) return header;
    const bodyId = (r.data as { requestId?: unknown } | undefined)?.requestId;
    return typeof bodyId === 'string' ? bodyId : null;
  };

  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const r = error.response;
      const data = (r?.data ?? {}) as { code?: string; message?: string };
      const status = r?.status ?? 0;
      const code = data.code;
      const requestId = extractRequestId(error);

      if (status === 401 && code && REFRESH_RECOVERABLE_CODES.has(code)) {
        const original = error.config as RetriableConfig | undefined;
        if (!original || original._retry) {
          handleSessionLost();
          return Promise.reject(
            new ApiError(code, data.message ?? 'session expired', status, requestId),
          );
        }
        original._retry = true;
        try {
          refreshPromise = refreshPromise ?? runRefresh();
          await refreshPromise;
          refreshPromise = null;
          return instance.request(original);
        } catch (refreshErr) {
          refreshPromise = null;
          handleSessionLost();
          if (refreshErr instanceof ApiError) return Promise.reject(refreshErr);
          return Promise.reject(
            new ApiError('AUTH101', 'refresh failed', 401, requestId),
          );
        }
      }

      if (
        status === 401 &&
        code &&
        REFRESH_TERMINAL_CODES.has(code) &&
        getMemoryRefreshToken() !== null
      ) {
        handleSessionLost();
      }

      if (code) {
        return Promise.reject(new ApiError(code, data.message ?? 'Unknown error', status, requestId));
      }
      if (status === 503) {
        return Promise.reject(
          new ApiError('MAINTENANCE', 'maintenance', status, requestId),
        );
      }
      if (status >= 500) {
        return Promise.reject(
          new ApiError('INTERNAL_ERROR', error.message ?? 'internal error', status, requestId),
        );
      }
      return Promise.reject(error);
    },
  );

  return instance;
}

let sessionLostHandler: (() => void) | null = null;

export function setSessionLostHandler(handler: () => void) {
  sessionLostHandler = handler;
}

export const apiClient = createApiClient({
  onSessionLost: () => sessionLostHandler?.(),
});
