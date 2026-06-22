import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GlassPillNav } from './GlassPillNav';

function renderWithProviders(node: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{node}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('GlassPillNav', () => {
  it('renders brand and unauthenticated CTA', () => {
    renderWithProviders(<GlassPillNav />);
    expect(screen.getByText(/third/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /시작하기/ })).toBeInTheDocument();
  });
});
