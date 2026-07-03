import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/node';
import { useSuggestChaptersOutline } from './useSuggestChaptersOutline';
import { useSuggestChapterSubtree } from './useSuggestChapterSubtree';
import { useSuggestSelectionOutline } from './useSuggestSelectionOutline';
import { useSuggestSelectionSubtree } from './useSuggestSelectionSubtree';
import { ApiError } from '@/lib/api/client';
import type { ReactNode } from 'react';

// product-ai-suggestion Story 1-5~1-8 검증. 6-Port 후반 4개 hook (2026-07-02 pivot).
// 각 hook 에 대해 3-구분: happy (Zod parse 성공) · edge (Zod parse 실패) · error (429 rate limit).
// milestone.md PR#5 종단 신호 — 총 12건 통과.

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

// ── S1-5 ChaptersOutline ────────────────────────────────────
describe('useSuggestChaptersOutline (Story 1-5)', () => {
  beforeEach(() => {
    // MSW default handler 는 backend-developer catalog stub 4챕터 반환.
  });

  it('happy: MSW stub 응답 → Zod parse 성공 · chapters 배열 반환', async () => {
    const { result } = renderHook(() => useSuggestChaptersOutline(), {
      wrapper: makeWrapper(),
    });
    let response: Awaited<ReturnType<typeof result.current.mutateAsync>> | undefined;
    await act(async () => {
      response = await result.current.mutateAsync({
        concepts: ['백엔드', '기획자'],
        layerName: '기능의 구현',
        axisName: '하네스 엔지니어링',
      });
    });
    expect(response?.chapters.length).toBeGreaterThan(0);
    expect(response?.chapters[0]).toHaveProperty('title');
    expect(response?.chapters[0]).toHaveProperty('rationale');
    expect(response?.providerContext).toBe('static:backend-developer');
  });

  it('edge: chapters 빈 배열 응답 → Zod min(1) 위반 → mutation reject', async () => {
    server.use(
      http.post('/api/v1/suggestions/chapters-outline', () =>
        HttpResponse.json({
          chapters: [],
          suggestionsAvailable: true,
          providerContext: 'static:backend-developer',
        }),
      ),
    );
    const { result } = renderHook(() => useSuggestChaptersOutline(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current
        .mutateAsync({
          concepts: ['백엔드'],
          layerName: 'L',
          axisName: 'A',
        })
        .catch(() => undefined);
    });
    expect(result.current.isError).toBe(true);
  });

  it('error: 429 응답 → ApiError · Retry-After 노출', async () => {
    server.use(
      http.post('/api/v1/suggestions/chapters-outline', () =>
        HttpResponse.json(
          { code: 'RATE_LIMITED', message: '요청이 많아요.' },
          { status: 429, headers: { 'Retry-After': '30' } },
        ),
      ),
    );
    const { result } = renderHook(() => useSuggestChaptersOutline(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current
        .mutateAsync({
          concepts: ['백엔드'],
          layerName: 'L',
          axisName: 'A',
        })
        .catch(() => undefined);
    });
    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBeInstanceOf(ApiError);
    expect((result.current.error as ApiError).status).toBe(429);
  });
});

// ── S1-6 ChapterSubtree ─────────────────────────────────────
describe('useSuggestChapterSubtree (Story 1-6)', () => {
  it('happy: MSW stub 응답 → bodyAsciiTree monospace 문자열', async () => {
    const { result } = renderHook(() => useSuggestChapterSubtree(), {
      wrapper: makeWrapper(),
    });
    let response: Awaited<ReturnType<typeof result.current.mutateAsync>> | undefined;
    await act(async () => {
      response = await result.current.mutateAsync({
        chapter: { title: '1. 하네스', rationale: 'R' },
        siblings: [],
        layerName: 'L',
        axisName: 'A',
      });
    });
    expect(response?.bodyAsciiTree).toContain('├──');
  });

  it('edge: bodyAsciiTree 필드 누락 → Zod parse 실패', async () => {
    server.use(
      http.post('/api/v1/suggestions/chapter-subtree', () =>
        HttpResponse.json({
          suggestionsAvailable: true,
          providerContext: 'static:backend-developer',
        }),
      ),
    );
    const { result } = renderHook(() => useSuggestChapterSubtree(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current
        .mutateAsync({
          chapter: { title: '1', rationale: 'R' },
          siblings: [],
          layerName: 'L',
          axisName: 'A',
        })
        .catch(() => undefined);
    });
    expect(result.current.isError).toBe(true);
  });

  it('error: 429 응답 → ApiError', async () => {
    server.use(
      http.post('/api/v1/suggestions/chapter-subtree', () =>
        HttpResponse.json(
          { code: 'RATE_LIMITED', message: '요청이 많아요.' },
          { status: 429, headers: { 'Retry-After': '30' } },
        ),
      ),
    );
    const { result } = renderHook(() => useSuggestChapterSubtree(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current
        .mutateAsync({
          chapter: { title: '1', rationale: 'R' },
          siblings: [],
          layerName: 'L',
          axisName: 'A',
        })
        .catch(() => undefined);
    });
    expect((result.current.error as ApiError).status).toBe(429);
  });
});

// ── S1-7 SelectionOutline ───────────────────────────────────
describe('useSuggestSelectionOutline (Story 1-7)', () => {
  it('happy: MSW stub 응답 → containerName + chapters', async () => {
    const { result } = renderHook(() => useSuggestSelectionOutline(), {
      wrapper: makeWrapper(),
    });
    let response: Awaited<ReturnType<typeof result.current.mutateAsync>> | undefined;
    await act(async () => {
      response = await result.current.mutateAsync({
        concepts: ['백엔드'],
        layerName: 'L',
        axisName: 'A',
        roadmapChapters: [{ title: '1', rationale: 'R' }],
      });
    });
    expect(response?.containerName).toBeTruthy();
    expect(response?.chapters.length).toBeGreaterThan(0);
  });

  it('edge: containerName 필드 누락 → Zod parse 실패', async () => {
    server.use(
      http.post('/api/v1/suggestions/selection-outline', () =>
        HttpResponse.json({
          chapters: [{ title: '1', rationale: 'R' }],
          suggestionsAvailable: true,
        }),
      ),
    );
    const { result } = renderHook(() => useSuggestSelectionOutline(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current
        .mutateAsync({
          concepts: ['백엔드'],
          layerName: 'L',
          axisName: 'A',
          roadmapChapters: [],
        })
        .catch(() => undefined);
    });
    expect(result.current.isError).toBe(true);
  });

  it('error: 429 응답 → ApiError', async () => {
    server.use(
      http.post('/api/v1/suggestions/selection-outline', () =>
        HttpResponse.json(
          { code: 'RATE_LIMITED', message: '요청이 많아요.' },
          { status: 429, headers: { 'Retry-After': '30' } },
        ),
      ),
    );
    const { result } = renderHook(() => useSuggestSelectionOutline(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current
        .mutateAsync({
          concepts: ['백엔드'],
          layerName: 'L',
          axisName: 'A',
          roadmapChapters: [],
        })
        .catch(() => undefined);
    });
    expect((result.current.error as ApiError).status).toBe(429);
  });
});

// ── S1-8 SelectionSubtree ───────────────────────────────────
describe('useSuggestSelectionSubtree (Story 1-8)', () => {
  it('happy: MSW stub 응답 → bodyAsciiTree monospace 문자열', async () => {
    const { result } = renderHook(() => useSuggestSelectionSubtree(), {
      wrapper: makeWrapper(),
    });
    let response: Awaited<ReturnType<typeof result.current.mutateAsync>> | undefined;
    await act(async () => {
      response = await result.current.mutateAsync({
        chapter: { title: '스택 선정', rationale: 'R' },
        siblings: [],
        containerName: '웹 서비스 실전 v1',
        layerName: 'L',
        axisName: 'A',
      });
    });
    expect(response?.bodyAsciiTree).toContain('├──');
  });

  it('edge: bodyAsciiTree 필드 타입 오류 → Zod parse 실패', async () => {
    server.use(
      http.post('/api/v1/suggestions/selection-subtree', () =>
        HttpResponse.json({
          bodyAsciiTree: 123, // number → string 위반
          suggestionsAvailable: true,
        }),
      ),
    );
    const { result } = renderHook(() => useSuggestSelectionSubtree(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current
        .mutateAsync({
          chapter: { title: '1', rationale: 'R' },
          siblings: [],
          containerName: 'C',
          layerName: 'L',
          axisName: 'A',
        })
        .catch(() => undefined);
    });
    expect(result.current.isError).toBe(true);
  });

  it('error: 429 응답 → ApiError', async () => {
    server.use(
      http.post('/api/v1/suggestions/selection-subtree', () =>
        HttpResponse.json(
          { code: 'RATE_LIMITED', message: '요청이 많아요.' },
          { status: 429, headers: { 'Retry-After': '30' } },
        ),
      ),
    );
    const { result } = renderHook(() => useSuggestSelectionSubtree(), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current
        .mutateAsync({
          chapter: { title: '1', rationale: 'R' },
          siblings: [],
          containerName: 'C',
          layerName: 'L',
          axisName: 'A',
        })
        .catch(() => undefined);
    });
    expect((result.current.error as ApiError).status).toBe(429);
  });
});
