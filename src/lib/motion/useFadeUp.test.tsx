import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useFadeUp } from './useFadeUp';
import { createRef } from 'react';

function Demo() {
  const ref = useFadeUp<HTMLDivElement>();
  return (
    <div ref={ref} data-testid="t" data-state="hidden">
      hi
    </div>
  );
}

describe('useFadeUp', () => {
  it('renders without throwing and attaches a ref', () => {
    render(<Demo />);
    expect(screen.getByTestId('t')).toBeInTheDocument();
  });

  it('returns a usable ref (no observer in jsdom mock)', () => {
    const ref = createRef<HTMLDivElement>();
    expect(ref.current).toBeNull();
  });
});
