import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/node';
import { LayerFormDialog } from './LayerFormDialog';
import { resetLayerMockState } from '@/mocks/handlers/layer.handlers';
import type { ReactNode } from 'react';

function wrap() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

describe('LayerFormDialog', () => {
  beforeEach(() => {
    resetLayerMockState();
  });

  it('creates a Layer on the happy path and closes', async () => {
    const onClose = vi.fn();
    render(<LayerFormDialog open onClose={onClose} />, { wrapper: wrap() });
    const input = screen.getByLabelText('Layer 이름');
    await userEvent.type(input, '시스템 설계');
    await userEvent.click(screen.getByRole('button', { name: '추가' }));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('blocks submit when the name exceeds 50 chars', async () => {
    const onClose = vi.fn();
    render(<LayerFormDialog open onClose={onClose} />, { wrapper: wrap() });
    const input = screen.getByLabelText('Layer 이름');
    await userEvent.type(input, 'A'.repeat(51));
    expect(await screen.findByRole('alert')).toHaveTextContent(/50자를 넘을 수 없/);
    expect(screen.getByRole('button', { name: '추가' })).toBeDisabled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('shows inline error when server returns 409 LAYER_NAME_DUPLICATE', async () => {
    server.use(
      http.post('/api/v1/facades/me/layers', () =>
        HttpResponse.json(
          { code: 'LAYER_NAME_DUPLICATE', message: 'dup' },
          { status: 409 },
        ),
      ),
    );
    const onClose = vi.fn();
    render(<LayerFormDialog open onClose={onClose} />, { wrapper: wrap() });
    await userEvent.type(screen.getByLabelText('Layer 이름'), 'Uncategorized');
    await userEvent.click(screen.getByRole('button', { name: '추가' }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/같은 이름의 Layer/);
    });
    expect(onClose).not.toHaveBeenCalled();
  });
});
