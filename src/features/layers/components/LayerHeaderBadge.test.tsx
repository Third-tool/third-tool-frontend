import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LayerHeaderBadge } from './LayerHeaderBadge';

describe('LayerHeaderBadge', () => {
  it('happy: 정상 개수 · 근접/최대 경고 없음', () => {
    render(<LayerHeaderBadge axisCount={3} />);
    expect(screen.getByRole('status', { name: 'Layer 요약' })).toHaveTextContent(
      '축 3 / 10',
    );
    expect(screen.queryByText(/곧 최대/)).not.toBeInTheDocument();
    expect(screen.queryByText(/삭제됨/)).not.toBeInTheDocument();
  });

  it('edge: axis 개수가 max-2 이상이면 "곧 최대" 경고 표시', () => {
    render(<LayerHeaderBadge axisCount={9} />);
    expect(screen.getByRole('status')).toHaveTextContent('축 9 / 10 · 곧 최대');
  });

  it('edge: axis 개수가 max 이상이면 "최대 도달" 강조', () => {
    render(<LayerHeaderBadge axisCount={10} />);
    expect(screen.getByRole('status')).toHaveTextContent('축 10 / 10 · 최대 도달');
  });

  it('deletedAt 존재 시 "삭제됨" 배지 노출', () => {
    render(<LayerHeaderBadge axisCount={2} deletedAt="2026-07-02T00:00:00Z" />);
    expect(screen.getByLabelText('삭제됨')).toBeInTheDocument();
  });

  it('axisCount 미지정 시 placeholder(--) 렌더', () => {
    render(<LayerHeaderBadge />);
    expect(screen.getByRole('status')).toHaveTextContent('축 -- / 10');
  });

  it('M5 · LT E6 S6-5 · progressStatus NOT_STARTED 회색', () => {
    render(<LayerHeaderBadge axisCount={3} progressStatus="NOT_STARTED" />);
    const badge = screen.getByLabelText('진행 상태 아직 시작 안 함');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toMatch(/bg-glass/);
    expect(badge.className).toMatch(/text-cream-mute/);
  });

  it('M5 · LT E6 S6-5 · progressStatus IN_PROGRESS 주황', () => {
    render(<LayerHeaderBadge axisCount={3} progressStatus="IN_PROGRESS" />);
    const badge = screen.getByLabelText('진행 상태 학습 중');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toMatch(/bg-amber\/20/);
    expect(badge.className).toMatch(/text-amber-deep/);
  });

  it('M5 · LT E6 S6-5 · progressStatus COMPLETED 녹색', () => {
    render(<LayerHeaderBadge axisCount={3} progressStatus="COMPLETED" />);
    const badge = screen.getByLabelText('진행 상태 완료');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toMatch(/bg-emerald\/20/);
    expect(badge.className).toMatch(/text-emerald/);
  });
});
