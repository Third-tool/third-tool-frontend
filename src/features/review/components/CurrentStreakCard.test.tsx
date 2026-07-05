import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CurrentStreakCard } from './CurrentStreakCard';

describe('<CurrentStreakCard> (Story 3-3)', () => {
  it('happy · current 3일 · longest 5일 · 최장 갱신 배지 미노출', () => {
    render(<CurrentStreakCard streak={{ current: 3, longest: 5 }} />);
    expect(screen.getByLabelText('현재 연속 3일')).toBeInTheDocument();
    expect(screen.getByLabelText('최장 5일')).toBeInTheDocument();
    expect(screen.queryByLabelText('최장 기록 갱신')).not.toBeInTheDocument();
  });

  it('edge · current === longest > 0 시 최장 갱신 배지 노출', () => {
    render(<CurrentStreakCard streak={{ current: 5, longest: 5 }} />);
    expect(screen.getByLabelText('최장 기록 갱신')).toBeInTheDocument();
  });

  it('edge · current 0 · longest 0 시 배지 미노출', () => {
    render(<CurrentStreakCard streak={{ current: 0, longest: 0 }} />);
    expect(screen.queryByLabelText('최장 기록 갱신')).not.toBeInTheDocument();
  });
});
