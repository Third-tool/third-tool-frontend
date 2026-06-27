import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/node';
import { BootstrapGate } from './BootstrapGate';

function renderGate() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<BootstrapGate />} />
          <Route path="/onboarding" element={<div>ONBOARDING ROUTE</div>} />
          <Route path="/home" element={<div>HOME ROUTE</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const userOk = () =>
  HttpResponse.json({
    username: 'a',
    nickname: 'a',
    email: 'a@a',
    social: false,
  });

describe('BootstrapGate', () => {
  it('falls back to the landing page when /users/me returns 401', async () => {
    server.use(
      http.get('/user', () =>
        HttpResponse.json(
          { code: 'AUTH001', message: 'no auth' },
          { status: 401 },
        ),
      ),
    );
    renderGate();
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { level: 1, name: /당신이\s*꿈\s*을\s*찾을 때까지/ }),
      ).toBeInTheDocument(),
    );
  });

  it('redirects to /onboarding when authenticated user has no concept', async () => {
    server.use(
      http.get('/user', () => userOk()),
      http.get('/api/v1/learning-facade', () =>
        HttpResponse.json({
          facadeId: 'f',
          concept: null,
          axes: [],
          coverageSummary: { totalTopics: 0, uncoveredTopics: 0, axesWithUncovered: [] },
        }),
      ),
    );
    renderGate();
    await waitFor(() =>
      expect(screen.getByText('ONBOARDING ROUTE')).toBeInTheDocument(),
    );
  });

  it('redirects to /home when authenticated user has a concept', async () => {
    server.use(
      http.get('/user', () => userOk()),
      http.get('/api/v1/learning-facade', () =>
        HttpResponse.json({
          facadeId: 'f',
          concept: '시스템 설계',
          axes: [],
          coverageSummary: { totalTopics: 0, uncoveredTopics: 0, axesWithUncovered: [] },
        }),
      ),
    );
    renderGate();
    await waitFor(() => expect(screen.getByText('HOME ROUTE')).toBeInTheDocument());
  });
});
