import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  ModeChangeConfirmDialog,
  isModeDowngrade,
} from './ModeChangeConfirmDialog';

describe('isModeDowngrade (helper)', () => {
  it('MODE_28D → MODE_7D → true', () => {
    expect(isModeDowngrade('MODE_28D', 'MODE_7D')).toBe(true);
  });
  it('MODE_7D → MODE_28D → false (업그레이드)', () => {
    expect(isModeDowngrade('MODE_7D', 'MODE_28D')).toBe(false);
  });
  it('동일 mode → false', () => {
    expect(isModeDowngrade('MODE_14D', 'MODE_14D')).toBe(false);
  });
});

describe('<ModeChangeConfirmDialog> (Story 3-1)', () => {
  it('happy · open 상태에서 다운그레이드 안내 문구 · SCHEDULE_EXHAUSTED 노출', () => {
    render(
      <ModeChangeConfirmDialog
        open
        onClose={() => undefined}
        onConfirm={() => undefined}
        fromMode="MODE_28D"
        toMode="MODE_7D"
      />,
    );
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toMatch(/중기 학습 모드/);
    expect(alert.textContent).toMatch(/집중 학습 모드/);
    expect(alert.textContent).toMatch(/SCHEDULE_EXHAUSTED/);
  });

  it('edge · 취소 클릭 → onClose 호출 · onConfirm 미호출', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    render(
      <ModeChangeConfirmDialog
        open
        onClose={onClose}
        onConfirm={onConfirm}
        fromMode="MODE_14D"
        toMode="MODE_7D"
      />,
    );
    fireEvent.click(screen.getByText('취소'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('error · 확인 클릭 → onConfirm 호출 · isPending 상태에서 버튼 disabled', () => {
    const onConfirm = vi.fn();
    const { rerender } = render(
      <ModeChangeConfirmDialog
        open
        onClose={() => undefined}
        onConfirm={onConfirm}
        fromMode="MODE_60D"
        toMode="MODE_14D"
      />,
    );
    fireEvent.click(screen.getByLabelText('모드 다운그레이드 확인'));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    rerender(
      <ModeChangeConfirmDialog
        open
        onClose={() => undefined}
        onConfirm={onConfirm}
        fromMode="MODE_60D"
        toMode="MODE_14D"
        isPending
      />,
    );
    expect(screen.getByLabelText('모드 다운그레이드 확인')).toBeDisabled();
    expect(screen.getByText('취소')).toBeDisabled();
  });
});
