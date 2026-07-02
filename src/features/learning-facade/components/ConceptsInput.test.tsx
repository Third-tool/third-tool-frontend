import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConceptsInput, MAX_CONCEPTS } from './ConceptsInput';

describe('ConceptsInput', () => {
  it('adds a concept on Enter and clears input', async () => {
    const onChange = vi.fn();
    render(<ConceptsInput value={[]} onChange={onChange} />);
    const input = screen.getByLabelText('컨셉');
    await userEvent.type(input, '백엔드{Enter}');
    expect(onChange).toHaveBeenLastCalledWith(['백엔드']);
  });

  it('removes a concept via chip remove button', async () => {
    const onChange = vi.fn();
    render(<ConceptsInput value={['시스템 설계']} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: /remove 시스템 설계/i }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it('ignores duplicate input and shows notice', async () => {
    const onChange = vi.fn();
    render(<ConceptsInput value={['JPA']} onChange={onChange} />);
    const input = screen.getByLabelText('컨셉');
    await userEvent.type(input, 'JPA{Enter}');
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent(/이미 추가된 컨셉/);
  });

  it('hides input and shows max notice at 5 items', async () => {
    const onChange = vi.fn();
    const five = ['a', 'b', 'c', 'd', 'e'];
    render(<ConceptsInput value={five} onChange={onChange} />);
    expect(screen.queryByLabelText('컨셉')).not.toBeInTheDocument();
    // list still visible with 5 items
    const list = screen.getByRole('list', { name: /컨셉 목록/ });
    expect(within(list).getAllByRole('listitem')).toHaveLength(MAX_CONCEPTS);
  });

  it('removes last chip on Backspace when input is empty', async () => {
    const onChange = vi.fn();
    render(<ConceptsInput value={['a', 'b']} onChange={onChange} />);
    const input = screen.getByLabelText('컨셉');
    input.focus();
    await userEvent.keyboard('{Backspace}');
    expect(onChange).toHaveBeenLastCalledWith(['a']);
  });

  it('shows counter in status by default', () => {
    render(<ConceptsInput value={['a', 'b']} onChange={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent(`2 / ${MAX_CONCEPTS}`);
  });
});
