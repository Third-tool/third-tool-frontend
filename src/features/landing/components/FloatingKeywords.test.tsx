import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FloatingKeywords } from './FloatingKeywords';

describe('FloatingKeywords', () => {
  it('renders all provided keywords', () => {
    render(<FloatingKeywords words={['DDD', '관계형 모델링', 'Effective Java']} />);
    expect(screen.getByText('DDD')).toBeInTheDocument();
    expect(screen.getByText('관계형 모델링')).toBeInTheDocument();
    expect(screen.getByText('Effective Java')).toBeInTheDocument();
  });
});
