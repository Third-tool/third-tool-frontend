import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    put: vi.fn(),
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
  listLayers,
  createLayer,
  updateLayer,
  reorderLayers,
} from './layer';

const mockGet = apiClient.get as unknown as ReturnType<typeof vi.fn>;
const mockPost = apiClient.post as unknown as ReturnType<typeof vi.fn>;
const mockPatch = apiClient.patch as unknown as ReturnType<typeof vi.fn>;
const mockPut = apiClient.put as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockGet.mockReset();
  mockPost.mockReset();
  mockPatch.mockReset();
  mockPut.mockReset();
});

describe('listLayers', () => {
  it('coerces numeric Long layerId to string', async () => {
    mockGet.mockResolvedValue({
      data: [
        { layerId: 1, name: 'Uncategorized', displayOrder: 0 },
        { layerId: 2, name: 'CS 기초', displayOrder: 1, progressStatus: 'IN_PROGRESS' },
      ],
    });
    const layers = await listLayers();
    expect(mockGet).toHaveBeenCalledWith('/api/v1/facades/me/layers');
    expect(layers[0]).toMatchObject({ layerId: '1', name: 'Uncategorized' });
    expect(layers[1]).toMatchObject({ layerId: '2', progressStatus: 'IN_PROGRESS' });
  });
});

describe('createLayer', () => {
  it('POSTs { name } and returns the created Layer', async () => {
    mockPost.mockResolvedValue({
      data: { layerId: 5, name: 'DDD', displayOrder: 2 },
    });
    const res = await createLayer({ name: 'DDD' });
    expect(mockPost).toHaveBeenCalledWith('/api/v1/facades/me/layers', {
      name: 'DDD',
    });
    expect(res).toMatchObject({ layerId: '5', name: 'DDD' });
  });

  it('rejects an empty name at the schema boundary', async () => {
    await expect(createLayer({ name: '' })).rejects.toThrow();
    expect(mockPost).not.toHaveBeenCalled();
  });
});

describe('updateLayer', () => {
  it('PATCHes layer-scoped path and returns response', async () => {
    mockPatch.mockResolvedValue({
      data: { layerId: 3, name: '도메인', displayOrder: 1, changed: true },
    });
    const res = await updateLayer('3', { name: '도메인' });
    expect(mockPatch).toHaveBeenCalledWith('/api/v1/facades/me/layers/3', {
      name: '도메인',
    });
    expect(res).toMatchObject({ layerId: '3', name: '도메인', changed: true });
  });
});

describe('reorderLayers', () => {
  it('PUTs the ordered id list to /order', async () => {
    mockPut.mockResolvedValue({
      data: {
        layers: [
          { layerId: 2, name: 'A', displayOrder: 0 },
          { layerId: 1, name: 'B', displayOrder: 1 },
        ],
      },
    });
    const res = await reorderLayers(['2', '1']);
    expect(mockPut).toHaveBeenCalledWith('/api/v1/facades/me/layers/order', {
      orderedLayerIds: ['2', '1'],
    });
    expect(res.layers[0]).toMatchObject({ layerId: '2', displayOrder: 0 });
  });
});
