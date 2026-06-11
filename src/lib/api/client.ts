import axios, { type AxiosInstance } from 'axios';

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

interface CreateApiClientOptions {
  baseURL?: string;
}

export function createApiClient(options: CreateApiClientOptions = {}): AxiosInstance {
  const instance = axios.create({
    baseURL: options.baseURL ?? import.meta.env.VITE_API_BASE_URL ?? '/api',
    headers: { 'Content-Type': 'application/json' },
  });

  instance.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const r = (error as { response?: { status?: number; data?: unknown } }).response;
        const data = (r?.data ?? {}) as { code?: string; message?: string };
        if (data.code) {
          return Promise.reject(
            new ApiError(data.code, data.message ?? 'Unknown error', r?.status ?? 0),
          );
        }
      }
      return Promise.reject(error);
    },
  );

  return instance;
}

export const apiClient = createApiClient();
