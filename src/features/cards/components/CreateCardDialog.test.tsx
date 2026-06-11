import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CreateCardDialog } from './CreateCardDialog';
import type { ReactNode } from 'react';

function wrap() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

describe('CreateCardDialog', () => {
  it('disables submit when summary or keywords empty', async () => {
    render(<CreateCardDialog open onClose={() => {}} />, { wrapper: wrap() });
    const submit = screen.getByRole('button', { name: '카드 펴기' });
    expect(submit).toBeDisabled();
  });

  it('submits and closes on success', async () => {
    const onClose = vi.fn();
    render(<CreateCardDialog open onClose={onClose} />, { wrapper: wrap() });
    await userEvent.type(screen.getByLabelText('summary'), 'JPA persistence');
    const kwInput = screen.getByLabelText('키워드');
    await userEvent.type(kwInput, 'JPA{Enter}');
    await userEvent.click(screen.getByRole('button', { name: '카드 펴기' }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
