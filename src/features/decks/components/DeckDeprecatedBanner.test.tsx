import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DeckDeprecatedBanner } from './DeckDeprecatedBanner';

describe('<DeckDeprecatedBanner> (Story S-3)', () => {
  it('happy · Deck 폐기 안내 문구 · [지도로 이동] CTA', () => {
    render(<DeckDeprecatedBanner />, { wrapper: MemoryRouter });
    expect(screen.getByLabelText('Deck 폐기 안내')).toBeInTheDocument();
    expect(screen.getByText('Deck 개념은 폐기되었어요')).toBeInTheDocument();
    const cta = screen.getByRole('link', { name: /지도로 이동/ });
    expect(cta).toBeInTheDocument();
    expect(cta).toHaveAttribute('href', '/map');
  });

  it('edge · Axis 매핑 안내 문구 노출', () => {
    render(<DeckDeprecatedBanner />, { wrapper: MemoryRouter });
    expect(screen.getByText(/Axis/)).toBeInTheDocument();
  });
});
