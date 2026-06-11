import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Section } from './Section';

describe('Section', () => {
  it('renders title and eyebrow when provided', () => {
    render(
      <Section eyebrow="WHY" title="학습은 실패가 아니라 순환입니다.">
        <p>body</p>
      </Section>,
    );
    expect(screen.getByText('WHY')).toBeInTheDocument();
    expect(screen.getByText('학습은 실패가 아니라 순환입니다.')).toBeInTheDocument();
    expect(screen.getByText('body')).toBeInTheDocument();
  });
  it('uses section element by default', () => {
    const { container } = render(<Section>x</Section>);
    expect(container.querySelector('section')).not.toBeNull();
  });
});
