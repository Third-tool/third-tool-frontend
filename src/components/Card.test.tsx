import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from './Card';

describe('Card (warm single-layer)', () => {
  it('renders children with surface bg + edge border', () => {
    render(
      <Card data-testid="c">
        <p>안녕</p>
      </Card>,
    );
    const el = screen.getByTestId('c');
    expect(el.className).toMatch(/bg-surface/);
    expect(el.className).toMatch(/border-edge/);
    expect(screen.getByText('안녕')).toBeInTheDocument();
  });
  it('applies interactive hover classes when interactive', () => {
    render(
      <Card interactive data-testid="c">
        x
      </Card>,
    );
    expect(screen.getByTestId('c').className).toMatch(/hover:-translate-y-/);
    expect(screen.getByTestId('c').className).toMatch(/hover:border-amber-line/);
  });
});
