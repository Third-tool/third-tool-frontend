import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TodayCompletionCard } from './TodayCompletionCard';

describe('<TodayCompletionCard> (Story 3-3)', () => {
  it('happy · completed/total + ratio · streak >=3 시 배지 노출', () => {
    render(
      <TodayCompletionCard
        today={{ completed: 5, total: 10, ratio: 0.5 }}
        streak={{ current: 3, longest: 5 }}
      />,
    );
    expect(screen.getByLabelText('오늘 완료 5')).toBeInTheDocument();
    expect(screen.getByLabelText('오늘 전체 10')).toBeInTheDocument();
    expect(screen.getByText(/완료율/)).toBeInTheDocument();
    expect(screen.getByLabelText('3일 연속 학습')).toBeInTheDocument();
  });

  it('edge · streak <3 시 배지 미노출', () => {
    render(
      <TodayCompletionCard
        today={{ completed: 1, total: 5, ratio: 0.2 }}
        streak={{ current: 2, longest: 5 }}
      />,
    );
    expect(screen.queryByLabelText(/연속 학습/)).not.toBeInTheDocument();
  });
});
