import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UpcomingExposureIndicator } from './UpcomingExposureIndicator';

const eff28 = { mode: 'MODE_28D' as const, maxView: 5, intervals: [1, 3, 7, 14, 28] };
const eff7 = { mode: 'MODE_7D' as const, maxView: 3, intervals: [1, 3, 7] };

describe('<UpcomingExposureIndicator> (Story 2-4)', () => {
  it('happy · viewCount=0, MODE_28D → "다음 노출 1일 후"', () => {
    render(
      <UpcomingExposureIndicator viewCount={0} createdMode="MODE_28D" effectiveMax={eff28} />,
    );
    expect(screen.getByLabelText('다음 노출 1일 후')).toBeInTheDocument();
    expect(screen.getByText('다음 노출 1일 후')).toBeInTheDocument();
  });

  it('edge · viewCount=2, MODE_28D → "다음 노출 7일 후" (interval[2])', () => {
    render(
      <UpcomingExposureIndicator viewCount={2} createdMode="MODE_28D" effectiveMax={eff28} />,
    );
    expect(screen.getByLabelText('다음 노출 7일 후')).toBeInTheDocument();
  });

  it('error · viewCount >= effectiveMax.maxView → "노출 소진"', () => {
    render(<UpcomingExposureIndicator viewCount={3} createdMode={null} effectiveMax={eff7} />);
    expect(screen.getByLabelText('다음 노출 없음 · 학습 소진')).toBeInTheDocument();
    expect(screen.getByText('노출 소진')).toBeInTheDocument();
  });
});
