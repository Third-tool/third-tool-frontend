import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CardScheduleBadge } from './CardScheduleBadge';

const eff28 = { mode: 'MODE_28D' as const, maxView: 5, intervals: [1, 3, 7, 14, 28] };
const eff14 = { mode: 'MODE_14D' as const, maxView: 4, intervals: [1, 3, 7, 14] };

describe('<CardScheduleBadge> (Story 2-2)', () => {
  it('happy · createdMode = effectiveMax (동일 시 단일 표기)', () => {
    render(<CardScheduleBadge createdMode="MODE_28D" effectiveMax={eff28} />);
    expect(screen.getByLabelText('스케줄 MODE_28D')).toBeInTheDocument();
    expect(screen.getByText('중기 학습 모드 · 15~28일')).toBeInTheDocument();
  });

  it('edge · createdMode 없음 (M4 이전 카드 · effectiveMax만 표기)', () => {
    render(<CardScheduleBadge createdMode={null} effectiveMax={eff14} />);
    expect(screen.getByLabelText('유효 스케줄 MODE_14D')).toBeInTheDocument();
    expect(screen.getByText('단기 학습 모드 · 8~14일')).toBeInTheDocument();
  });

  it('error · 다운그레이드 시 두 값 병기 + 시각 강조', () => {
    render(<CardScheduleBadge createdMode="MODE_60D" effectiveMax={eff14} />);
    expect(
      screen.getByLabelText('스케줄 다운그레이드 MODE_60D → MODE_14D'),
    ).toBeInTheDocument();
    expect(screen.getByText('장기 학습 모드')).toBeInTheDocument();
    expect(screen.getByText('단기 학습 모드 · 8~14일')).toBeInTheDocument();
  });
});
