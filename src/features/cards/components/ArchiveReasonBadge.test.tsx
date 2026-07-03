import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ArchiveReasonBadge } from './ArchiveReasonBadge';

describe('<ArchiveReasonBadge> (Story 2-3)', () => {
  it('happy · MANUAL은 회색 계열 · "수동 아카이브"', () => {
    render(<ArchiveReasonBadge reason="MANUAL" />);
    const el = screen.getByLabelText('수동 아카이브');
    expect(el).toBeInTheDocument();
    expect(el.className).toMatch(/bg-glass/);
    expect(el.className).toMatch(/text-cream-mute/);
  });

  it('edge · SCHEDULE_EXHAUSTED은 녹색 계열 · "학습 완료"', () => {
    render(<ArchiveReasonBadge reason="SCHEDULE_EXHAUSTED" />);
    const el = screen.getByLabelText('학습 완료 · 정상 소진');
    expect(el).toBeInTheDocument();
    expect(el.className).toMatch(/bg-emerald\/20/);
    expect(el.className).toMatch(/text-emerald/);
  });

  it('error · MODE_DOWNGRADED은 주황 계열 · "스케줄 조정 소진"', () => {
    render(<ArchiveReasonBadge reason="MODE_DOWNGRADED" />);
    const el = screen.getByLabelText('스케줄 다운그레이드로 소진');
    expect(el).toBeInTheDocument();
    expect(el.className).toMatch(/bg-amber\/20/);
    expect(el.className).toMatch(/text-amber/);
  });
});
