import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { GlassPillNav } from './GlassPillNav';

describe('GlassPillNav', () => {
  it('renders brand and CTA', () => {
    render(
      <MemoryRouter>
        <GlassPillNav />
      </MemoryRouter>,
    );
    expect(screen.getByText(/third/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /시작하기/ })).toBeInTheDocument();
  });
});
