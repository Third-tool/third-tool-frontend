import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dialog } from './Dialog';

describe('Dialog', () => {
  it('renders children when open', () => {
    render(
      <Dialog open onClose={() => {}} title="안내">
        <p>본문</p>
      </Dialog>,
    );
    expect(screen.getByText('안내')).toBeInTheDocument();
    expect(screen.getByText('본문')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <Dialog open={false} onClose={() => {}} title="안내">
        <p>본문</p>
      </Dialog>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls onClose when backdrop clicked', async () => {
    const onClose = vi.fn();
    render(
      <Dialog open onClose={onClose} title="t">
        body
      </Dialog>,
    );
    await userEvent.click(screen.getByTestId('dialog-backdrop'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when Escape pressed', async () => {
    const onClose = vi.fn();
    render(
      <Dialog open onClose={onClose} title="t">
        body
      </Dialog>,
    );
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });
});
