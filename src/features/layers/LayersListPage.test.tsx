import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { LayersListPage } from './LayersListPage';
import { resetLayerMockState } from '@/mocks/handlers/layer.handlers';
import type { ReactNode } from 'react';

function makeWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('LayersListPage', () => {
  beforeEach(() => {
    resetLayerMockState();
  });

  it('renders the default Uncategorized layer from the MSW handler', async () => {
    render(<LayersListPage />, { wrapper: makeWrapper() });
    const list = await screen.findByRole('list', { name: /Layer 목록/ });
    await waitFor(() => {
      expect(list).toHaveTextContent('Uncategorized');
    });
  });

  it('shows the [+ Layer 추가] entry button in the header', async () => {
    render(<LayersListPage />, { wrapper: makeWrapper() });
    expect(
      await screen.findByRole('button', { name: /Layer 추가/ }),
    ).toBeInTheDocument();
  });
});
