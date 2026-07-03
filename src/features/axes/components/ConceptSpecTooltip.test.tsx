import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConceptSpecTooltip } from './ConceptSpecTooltip';

const STORAGE_PREFIX = 'concept-spec-shown-';

describe('ConceptSpecTooltip', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('mode="roadmap" · sessionStorage 미기록 시 첫 마운트에서 자동 open', () => {
    render(<ConceptSpecTooltip mode="roadmap" />);
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveTextContent('로드맵 = 수렴 (헌법)');
    expect(tooltip).toHaveTextContent('오래가는 원리·판단 프레임');
  });

  it('mode="selection" · 문구 정합 (ADR023 어휘)', () => {
    render(<ConceptSpecTooltip mode="selection" />);
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveTextContent('Selection = 발산 (판례)');
    expect(tooltip).toHaveTextContent('특정 상황·시대에 적용한 사례');
  });

  it('[이해했어요] 클릭 시 닫힘 + sessionStorage 기록', async () => {
    render(<ConceptSpecTooltip mode="roadmap" />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: '이해했어요' }));

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(window.sessionStorage.getItem(STORAGE_PREFIX + 'roadmap')).toBe('1');
  });

  it('sessionStorage 기록 상태에서 재마운트하면 자동 open 안 됨', () => {
    window.sessionStorage.setItem(STORAGE_PREFIX + 'roadmap', '1');
    render(<ConceptSpecTooltip mode="roadmap" />);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    // 정보 아이콘은 항상 노출
    expect(screen.getByRole('button', { name: /안내 열기/ })).toBeInTheDocument();
  });

  it('정보 아이콘 클릭 시 sessionStorage 무시하고 재open', async () => {
    window.sessionStorage.setItem(STORAGE_PREFIX + 'roadmap', '1');
    render(<ConceptSpecTooltip mode="roadmap" />);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /안내 열기/ }));

    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('Esc 키 입력 시 닫힘 + sessionStorage 기록', async () => {
    render(<ConceptSpecTooltip mode="selection" />);
    const tooltip = screen.getByRole('tooltip');
    tooltip.focus();

    const user = userEvent.setup();
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(window.sessionStorage.getItem(STORAGE_PREFIX + 'selection')).toBe('1');
  });
});
