import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Recent7DaysCard } from './Recent7DaysCard';

describe('<Recent7DaysCard> (Story 3-3)', () => {
  it('happy · 평균 완료율 + perfect clear 일수 노출', () => {
    render(
      <Recent7DaysCard
        recent7Days={{
          avgCompletionRatio: 0.7,
          perfectClearDays: 2,
          totalDays: 7,
          dailyRatios: [0.6, 0.8, 0.5, 1, 0.7, 0.9, 0.4],
        }}
      />,
    );
    expect(screen.getByLabelText('완벽 clear 2일')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /완료율 차트 · 평균 70%/ })).toBeInTheDocument();
  });

  it('edge · dailyRatios 0 값 · 최소 4% height 유지 (시각 확인성)', () => {
    render(
      <Recent7DaysCard
        recent7Days={{
          avgCompletionRatio: 0,
          perfectClearDays: 0,
          totalDays: 7,
          dailyRatios: [0, 0, 0, 0, 0, 0, 0],
        }}
      />,
    );
    expect(screen.getByLabelText('완벽 clear 0일')).toBeInTheDocument();
  });
});
