import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CreateCardDialog } from './CreateCardDialog';
import { LEARNING_FACADE_KEY } from '@/features/auth/hooks/useLearningFacade';
import type { LearningFacade } from '@/lib/api/schemas/facade';
import type { ReactNode } from 'react';

// M5 재편(2026-07-22+): Deck 참조 소비자 제거 · CreateCardForm이 useLearningFacade().axes 소비.
function wrap(withAxes: boolean) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  if (withAxes) {
    // MSW facade seed는 axes=[] · 테스트에서 캐시로 직접 axis 주입.
    const seed: LearningFacade = {
      facadeId: 'facade-1',
      concept: null,
      concepts: ['테스트'],
      axes: [
        { axisId: 'axis-1', name: '기본 축', displayOrder: 0, topics: [] },
      ],
      coverageSummary: { totalTopics: 0, uncoveredTopics: 0, axesWithUncovered: [] },
    };
    client.setQueryData<LearningFacade>(LEARNING_FACADE_KEY, seed);
  }
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

describe('CreateCardDialog', () => {
  it('disables submit when summary or keywords empty', () => {
    render(<CreateCardDialog open onClose={() => {}} />, { wrapper: wrap(true) });
    const submit = screen.getByRole('button', { name: '카드 펴기' });
    expect(submit).toBeDisabled();
  });

  it('submits and closes on success (axis 선택)', async () => {
    const onClose = vi.fn();
    render(<CreateCardDialog open onClose={onClose} />, { wrapper: wrap(true) });
    // 캐시로 주입된 axis · 즉시 select 노출.
    expect(screen.getByLabelText('axis')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('summary'), 'JPA persistence');
    await userEvent.type(screen.getByLabelText('mainText'), '본문 내용');
    const kwInput = screen.getByLabelText('키워드');
    await userEvent.type(kwInput, 'JPA{Enter}');
    await userEvent.click(screen.getByRole('button', { name: '카드 펴기' }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
