import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from './Card';

describe('Card (Double-Bezel)', () => {
  it('renders children and applies double-bezel structure', () => {
    render(<Card data-testid="c"><p>안녕</p></Card>);
    const outer = screen.getByTestId('c');
    expect(outer.className).toMatch(/ring-1/);
    expect(outer.firstElementChild?.className).toMatch(/shadow-\[var\(--shadow-card-inset\)\]/);
    expect(screen.getByText('안녕')).toBeInTheDocument();
  });
  it('applies interactive hover classes when interactive', () => {
    render(<Card interactive data-testid="c">x</Card>);
    expect(screen.getByTestId('c').className).toMatch(/hover:-translate-y-/);
  });
});
