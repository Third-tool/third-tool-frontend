import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReturnToFieldConfirmDialog } from './ReturnToFieldConfirmDialog';

describe('<ReturnToFieldConfirmDialog> (Story 3-2)', () => {
  it('happy · fresh 재시작 안내 · 현재 mode 라벨 노출', () => {
    render(
      <ReturnToFieldConfirmDialog
        open
        onClose={() => undefined}
        onConfirm={() => undefined}
        previousCreatedMode="MODE_28D"
        currentUserMode="MODE_14D"
      />,
    );
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toMatch(/노출 이력이 리셋/);
    expect(alert.textContent).toMatch(/단기 학습 모드/);
    expect(alert.textContent).toMatch(/MODE_14D/);
  });

  it('edge · previousCreatedMode ≠ currentUserMode → createdMode 갱신 배너 노출', () => {
    render(
      <ReturnToFieldConfirmDialog
        open
        onClose={() => undefined}
        onConfirm={() => undefined}
        previousCreatedMode="MODE_60D"
        currentUserMode="MODE_7D"
      />,
    );
    expect(screen.getByLabelText('createdMode 갱신 안내')).toBeInTheDocument();
  });

  it('edge · previousCreatedMode = currentUserMode → 갱신 배너 없음', () => {
    render(
      <ReturnToFieldConfirmDialog
        open
        onClose={() => undefined}
        onConfirm={() => undefined}
        previousCreatedMode="MODE_14D"
        currentUserMode="MODE_14D"
      />,
    );
    expect(screen.queryByLabelText('createdMode 갱신 안내')).not.toBeInTheDocument();
  });

  it('error · 취소·확인 액션 정합 · isPending 시 버튼 disabled', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    const { rerender } = render(
      <ReturnToFieldConfirmDialog
        open
        onClose={onClose}
        onConfirm={onConfirm}
        previousCreatedMode={null}
        currentUserMode="MODE_14D"
      />,
    );
    fireEvent.click(screen.getByLabelText('필드 복귀 확인'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText('취소'));
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(
      <ReturnToFieldConfirmDialog
        open
        onClose={onClose}
        onConfirm={onConfirm}
        previousCreatedMode={null}
        currentUserMode="MODE_14D"
        isPending
      />,
    );
    expect(screen.getByLabelText('필드 복귀 확인')).toBeDisabled();
    expect(screen.getByText('취소')).toBeDisabled();
  });
});
