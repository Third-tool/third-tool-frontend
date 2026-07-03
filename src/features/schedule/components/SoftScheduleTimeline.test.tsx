import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SoftScheduleTimeline } from './SoftScheduleTimeline';

describe('SoftScheduleTimeline', () => {
  it('renders nothing when intervals are empty', () => {
    const { container } = render(<SoftScheduleTimeline intervals={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders one dot per interval with proportional positions', () => {
    const { container } = render(
      <SoftScheduleTimeline intervals={[1, 3, 7]} maxDuration={7} />,
    );
    const dots = container.querySelectorAll('[aria-label*="일차"]');
    expect(dots.length).toBe(3);
    // 3일차 dot은 7일 범위 기준 3/7 * 100 ≈ 42.857%.
    expect((dots[1] as HTMLElement).style.left).toMatch(/^42\.85/);
  });

  it('extends the axis to maxDuration when it exceeds the last interval', () => {
    render(<SoftScheduleTimeline intervals={[1, 3, 7]} maxDuration={30} />);
    expect(screen.getByText('Day 30')).toBeInTheDocument();
  });
});
