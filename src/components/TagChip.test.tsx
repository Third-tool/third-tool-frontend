import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TagChip } from './TagChip';

describe('TagChip', () => {
  it('renders label and applies selected styling', () => {
    render(<TagChip label="JPA" selected />);
    const el = screen.getByText('JPA');
    const innerSpan = el.closest('span');
    const outerSpan = innerSpan?.parentElement?.tagName === 'SPAN'
      ? innerSpan?.parentElement
      : innerSpan;
    expect(outerSpan?.className).toMatch(/bg-amber/);
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<TagChip label="DDD" onClick={onClick} />);
    await userEvent.click(screen.getByText('DDD'));
    expect(onClick).toHaveBeenCalled();
  });

  it('shows remove button and fires onRemove', async () => {
    const onRemove = vi.fn();
    render(<TagChip label="X" onRemove={onRemove} />);
    await userEvent.click(screen.getByRole('button', { name: /remove/i }));
    expect(onRemove).toHaveBeenCalled();
  });
});
