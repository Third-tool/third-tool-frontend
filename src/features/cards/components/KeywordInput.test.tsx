import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KeywordInput } from './KeywordInput';

describe('KeywordInput', () => {
  it('adds a keyword on Enter and clears input', async () => {
    const onChange = vi.fn();
    render(<KeywordInput value={[]} onChange={onChange} label="키워드" />);
    const input = screen.getByLabelText('키워드');
    await userEvent.type(input, 'JPA{Enter}');
    expect(onChange).toHaveBeenLastCalledWith(['JPA']);
  });

  it('removes a keyword via chip remove button', async () => {
    const onChange = vi.fn();
    render(<KeywordInput value={['DDD']} onChange={onChange} label="키워드" />);
    await userEvent.click(screen.getByRole('button', { name: /remove DDD/i }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it('ignores duplicate input', async () => {
    const onChange = vi.fn();
    render(<KeywordInput value={['JPA']} onChange={onChange} label="키워드" />);
    const input = screen.getByLabelText('키워드');
    await userEvent.type(input, 'JPA{Enter}');
    expect(onChange).not.toHaveBeenCalled();
  });
});
