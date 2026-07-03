import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThresholdGuide } from './ThresholdGuide';

// M4 재편(2026-07-15+): 3옵션(MODE_10D/20D/30D · 1~14/15~24/25+) →
// 4옵션(MODE_7D/14D/28D/60D · 1~7/8~14/15~28/29~60) · product-card Epic 1.

describe('ThresholdGuide', () => {
  it('renders all four mode ranges', () => {
    render(<ThresholdGuide />);
    expect(screen.getByText('1~7일')).toBeInTheDocument();
    expect(screen.getByText('8~14일')).toBeInTheDocument();
    expect(screen.getByText('15~28일')).toBeInTheDocument();
    expect(screen.getByText('29~60일')).toBeInTheDocument();
  });

  it('marks the current mode with aria-current', () => {
    const { container } = render(<ThresholdGuide currentMode="MODE_14D" />);
    const current = container.querySelector('[aria-current="true"]');
    expect(current).not.toBeNull();
    expect(current?.textContent).toContain('8~14일');
  });
});
