import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DailyBatchProgress } from './DailyBatchProgress';
import type { DailyLearningBatch } from '@/lib/api/schemas/dailyLearningBatch';

function makeBatch(viewed: number, total: number): DailyLearningBatch {
  const entries = Array.from({ length: total }, (_, i) => ({
    cardId: String(i + 1),
    cardIntervalDay: 1,
    exposedAt: '2026-07-22T00:00:00Z',
    viewedAt: i < viewed ? '2026-07-22T09:00:00Z' : null,
    summary: `card ${i + 1}`,
    layerName: null,
    axisName: null,
    createdMode: null,
  }));
  return {
    userId: 'user-1',
    batchDate: '2026-07-22',
    entries,
    completionRate: viewed / (total || 1),
    streak: 1,
    closedAt: null,
  };
}

describe('<DailyBatchProgress> (Story 1-3)', () => {
  it('happy · viewed/total + progress bar aria', () => {
    render(<DailyBatchProgress batch={makeBatch(3, 10)} />);
    expect(screen.getByLabelText('완료 3')).toBeInTheDocument();
    expect(screen.getByLabelText('전체 10')).toBeInTheDocument();
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '3');
    expect(bar).toHaveAttribute('aria-valuemax', '10');
  });

  it('edge · total 0 시 percent 0 · 남은 시간 미표기', () => {
    render(<DailyBatchProgress batch={makeBatch(0, 0)} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '0');
    expect(screen.queryByLabelText(/남은 예상/)).not.toBeInTheDocument();
  });

  it('happy · 남은 카드 있으면 예상 시간 노출 (30초/카드 하드코딩)', () => {
    render(<DailyBatchProgress batch={makeBatch(0, 4)} />);
    // 4장 * 30초 = 120초 = 2분.
    expect(screen.getByLabelText('남은 예상 시간 2분')).toBeInTheDocument();
  });
});
