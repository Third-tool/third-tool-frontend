import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/api/client', () => ({
  apiClient: {
    post: vi.fn(),
  },
  ApiError: class extends Error {
    code: string;
    status: number;
    constructor(code: string, msg: string, status: number) {
      super(msg);
      this.code = code;
      this.status = status;
    }
  },
}));

import { apiClient } from '@/lib/api/client';
import {
  suggestLayers,
  suggestAxes,
} from './suggestion';

const mockPost = apiClient.post as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockPost.mockReset();
});

describe('suggestLayers', () => {
  it('POSTs the request and parses the layers array response', async () => {
    mockPost.mockResolvedValue({
      data: {
        layers: [{ name: 'CS 기초', rationale: 'r', suggestedAxisCount: 3 }],
        suggestionsAvailable: true,
        providerContext: 'static',
      },
    });
    const res = await suggestLayers({ concepts: ['backend'], facadeId: '1' });
    expect(mockPost).toHaveBeenCalledWith('/api/v1/suggestions/layers', {
      concepts: ['backend'],
      facadeId: '1',
    });
    expect(res.layers).toHaveLength(1);
    expect(res.suggestionsAvailable).toBe(true);
    expect(res.providerContext).toBe('static');
  });

  it('rejects if concepts array is empty at the schema boundary', async () => {
    await expect(suggestLayers({ concepts: [] })).rejects.toThrow();
    expect(mockPost).not.toHaveBeenCalled();
  });
});

describe('suggestAxes', () => {
  it('POSTs { layerId } and parses the axes array', async () => {
    mockPost.mockResolvedValue({
      data: {
        axes: [{ name: '자료구조', rationale: 'r', roadmapDraft: '# roadmap' }],
        suggestionsAvailable: true,
      },
    });
    const res = await suggestAxes({ layerId: '2' });
    expect(mockPost).toHaveBeenCalledWith('/api/v1/suggestions/axes', {
      layerId: '2',
    });
    expect(res.axes[0]).toMatchObject({ name: '자료구조' });
  });
});

// M4 FE PR#5 (2026-07-15+): 4-Port (suggestRoadmap · suggestSelections) SUPERSEDED 물리 삭제 완료.
// 대체: `suggestChaptersOutline` · `suggestChapterSubtree` · `suggestSelectionOutline` · `suggestSelectionSubtree`.
// 6-Port hook 통합 테스트는 `src/lib/ai-suggestion/hooks/useSuggest6Port.test.tsx` 참조.
