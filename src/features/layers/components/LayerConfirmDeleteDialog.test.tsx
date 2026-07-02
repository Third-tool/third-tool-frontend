import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/node';
import { LayerConfirmDeleteDialog } from './LayerConfirmDeleteDialog';
import { resetLayerMockState } from '@/mocks/handlers/layer.handlers';
import type { Layer } from '@/lib/api/schemas/layer';
import type { ReactNode } from 'react';

function wrap() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

const sampleLayer: Layer = {
  layerId: '2',
  name: '시스템 설계',
  displayOrder: 1,
  progressStatus: 'NOT_STARTED',
  deletedAt: null,
  createdAt: '2026-07-01T00:00:00Z',
};

describe('LayerConfirmDeleteDialog', () => {
  beforeEach(() => {
    resetLayerMockState();
  });

  it('deletes only after the user types the confirm word', async () => {
    server.use(
      http.delete('/api/v1/facades/me/layers/:layerId', () => new HttpResponse(null, { status: 204 })),
    );
    const onClose = vi.fn();
    render(<LayerConfirmDeleteDialog open onClose={onClose} layer={sampleLayer} />, {
      wrapper: wrap(),
    });
    const deleteBtn = screen.getByRole('button', { name: '삭제' });
    expect(deleteBtn).toBeDisabled();

    await userEvent.type(screen.getByLabelText('삭제 확인 입력'), '지우기');
    expect(deleteBtn).toBeDisabled();

    await userEvent.clear(screen.getByLabelText('삭제 확인 입력'));
    await userEvent.type(screen.getByLabelText('삭제 확인 입력'), '삭제');
    expect(deleteBtn).toBeEnabled();

    await userEvent.click(deleteBtn);
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('shows inline notice when server returns 409 LAYER_HAS_ACTIVE_AXES', async () => {
    server.use(
      http.delete('/api/v1/facades/me/layers/:layerId', () =>
        HttpResponse.json(
          {
            code: 'LAYER_HAS_ACTIVE_AXES',
            message: 'has axes',
          },
          { status: 409 },
        ),
      ),
    );
    const onClose = vi.fn();
    render(<LayerConfirmDeleteDialog open onClose={onClose} layer={sampleLayer} />, {
      wrapper: wrap(),
    });
    await userEvent.type(screen.getByLabelText('삭제 확인 입력'), '삭제');
    await userEvent.click(screen.getByRole('button', { name: '삭제' }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/축이 남아 있어요/);
    });
    expect(onClose).not.toHaveBeenCalled();
  });
});
