import { describe, it, expect, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { ToastProvider } from './ToastProvider';
import { toastStore } from '@/lib/toast/toastQueue';

describe('ToastProvider', () => {
  it('renders pushed toasts and removes after duration', async () => {
    vi.useFakeTimers();
    render(<ToastProvider />);
    act(() => {
      toastStore.push({ message: '순환 완료', durationMs: 1000 });
    });
    expect(screen.getByText('순환 완료')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(1200);
    });
    expect(screen.queryByText('순환 완료')).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});
