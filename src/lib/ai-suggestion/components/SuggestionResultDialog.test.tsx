import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SuggestionResultDialog, type SuggestionResult } from './SuggestionResultDialog';

const layerResult: SuggestionResult = {
  port: 'layer',
  response: {
    layers: [
      { name: '시스템 설계', rationale: 'r1', suggestedAxisCount: 3 },
      { name: '데이터 모델링', rationale: 'r2', suggestedAxisCount: 4 },
    ],
    suggestionsAvailable: true,
    providerContext: 'stub',
  },
};

const axisResult: SuggestionResult = {
  port: 'axis',
  response: {
    axes: [{ name: '결제 시스템 설계', rationale: 'r', roadmapDraft: '# ...' }],
    suggestionsAvailable: true,
    providerContext: 'stub',
  },
};

const roadmapResult: SuggestionResult = {
  port: 'roadmap',
  response: {
    roadmapDraft: '# 축 헌법 초안 (AI 제안)\n- 원리 1\n- 원리 2',
    suggestionsAvailable: true,
    providerContext: 'stub',
  },
};

const selectionsResult: SuggestionResult = {
  port: 'selections',
  response: {
    selections: [{ name: '사례 A', content: '내용 A' }],
    suggestionsAvailable: true,
    providerContext: 'stub',
  },
};

describe('SuggestionResultDialog', () => {
  it('does not render when closed', () => {
    render(<SuggestionResultDialog open={false} onClose={() => undefined} result={layerResult} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders Layer port with layer 제안 헤더 and list', () => {
    render(<SuggestionResultDialog open onClose={() => undefined} result={layerResult} />);
    expect(screen.getByRole('dialog', { name: /AI 가 제안한 Layer/ })).toBeInTheDocument();
    expect(screen.getByText(/LAYER · AI 제안/)).toBeInTheDocument();
    expect(screen.getByRole('list', { name: /Layer 제안 목록/ })).toBeInTheDocument();
    expect(screen.getByText('시스템 설계')).toBeInTheDocument();
    expect(screen.getByText('데이터 모델링')).toBeInTheDocument();
  });

  it('renders Axis port with axis 제안 목록', () => {
    render(<SuggestionResultDialog open onClose={() => undefined} result={axisResult} />);
    expect(screen.getByRole('dialog', { name: /AI 가 제안한 축/ })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: /축 제안 목록/ })).toBeInTheDocument();
    expect(screen.getByText('결제 시스템 설계')).toBeInTheDocument();
  });

  it('renders Roadmap port with 축 헌법 초안 헤더 (ADR023 어휘)', () => {
    render(<SuggestionResultDialog open onClose={() => undefined} result={roadmapResult} />);
    expect(screen.getByRole('dialog', { name: /AI 가 제안한 축 헌법 초안/ })).toBeInTheDocument();
    expect(screen.getByLabelText('축 헌법 초안 요약')).toBeInTheDocument();
  });

  it('renders Selections port with 판례 목록 헤더 (ADR023 어휘)', () => {
    render(<SuggestionResultDialog open onClose={() => undefined} result={selectionsResult} />);
    expect(screen.getByRole('dialog', { name: /AI 가 제안한 축 판례/ })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: /판례 제안 목록/ })).toBeInTheDocument();
    expect(screen.getByText('사례 A')).toBeInTheDocument();
  });

  it('shows fallback message when suggestionsAvailable is false', () => {
    render(
      <SuggestionResultDialog
        open
        onClose={() => undefined}
        result={{
          port: 'layer',
          response: { layers: [], suggestionsAvailable: false, providerContext: 'stub' },
        }}
      />,
    );
    expect(screen.getByText(/AI 제안을 준비하지 못했어요/)).toBeInTheDocument();
  });

  it('closes on 닫기 click', async () => {
    const onClose = vi.fn();
    render(<SuggestionResultDialog open onClose={onClose} result={layerResult} />);
    await userEvent.click(screen.getByRole('button', { name: '닫기' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
