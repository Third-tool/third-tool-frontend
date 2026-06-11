import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders children and applies primary classes by default', () => {
    render(<Button>시작하기</Button>);
    const btn = screen.getByRole('button', { name: '시작하기' });
    expect(btn).toBeInTheDocument();
    expect(btn.className).toMatch(/bg-amber/);
  });

  it('switches to ghost variant', () => {
    render(<Button variant="ghost">취소</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toMatch(/bg-transparent/);
  });

  it('calls onClick', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>go</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('renders right icon slot when provided', () => {
    render(<Button rightIcon={<span data-testid="ri" />}>다음</Button>);
    expect(screen.getByTestId('ri')).toBeInTheDocument();
  });
});
