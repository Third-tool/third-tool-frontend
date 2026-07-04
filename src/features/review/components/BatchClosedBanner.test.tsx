import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BatchClosedBanner } from './BatchClosedBanner';

describe('<BatchClosedBanner> (Story 1-5)', () => {
  beforeEach(() => {
    try {
      window.sessionStorage.clear();
    } catch {
      // ignore
    }
  });

  it('happy · closedAt 있음 · 첫 마운트에서 렌더 · 미완주 카드 수 표기', () => {
    render(<BatchClosedBanner closedAt="2026-07-23T00:05:00Z" missedCount={5} />);
    expect(screen.getByLabelText('이전 batch 종료 안내')).toBeInTheDocument();
    expect(screen.getByText(/5장을 다 못 봤지만/)).toBeInTheDocument();
  });

  it('edge · closedAt null → 렌더 안 함', () => {
    const { container } = render(<BatchClosedBanner closedAt={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('error · [닫기] 클릭 → sessionStorage 저장 · 리렌더 시에도 미표시', () => {
    const { rerender } = render(
      <BatchClosedBanner closedAt="2026-07-23T00:05:00Z" missedCount={0} />,
    );
    expect(screen.getByLabelText('이전 batch 종료 안내')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('배너 닫기'));
    expect(screen.queryByLabelText('이전 batch 종료 안내')).not.toBeInTheDocument();
    // 같은 closedAt으로 재렌더해도 sessionStorage 판정으로 미표시.
    rerender(<BatchClosedBanner closedAt="2026-07-23T00:05:00Z" missedCount={0} />);
    expect(screen.queryByLabelText('이전 batch 종료 안내')).not.toBeInTheDocument();
  });
});
