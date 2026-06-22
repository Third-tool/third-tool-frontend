import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LandingPage } from './LandingPage';

function renderLanding() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('LandingPage', () => {
  it('renders the major warm-redesign section headlines', () => {
    renderLanding();
    expect(
      screen.getByRole('heading', { level: 1, name: /당신이\s*꿈\s*을\s*찾을 때까지/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: /학습은 실패가 아니라\s*순환\s*입니다/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: /매일의\s*의식/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: /조용히 들었던\s*이야기/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: /오늘,?\s*첫 카드\s*를\s*펴볼까요/ }),
    ).toBeInTheDocument();
  });
});
