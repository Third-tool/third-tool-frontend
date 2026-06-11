import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EyebrowTag } from './EyebrowTag';

describe('EyebrowTag', () => {
  it('renders uppercase tracked label', () => {
    render(<EyebrowTag>why</EyebrowTag>);
    const el = screen.getByText('why');
    expect(el.className).toMatch(/uppercase/);
    expect(el.className).toMatch(/tracking-\[var\(--tracking-eyebrow\)\]/);
  });
});
