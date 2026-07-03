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
    providerContext: 'static:backend-developer',
  },
};

const axisResult: SuggestionResult = {
  port: 'axis',
  response: {
    axes: [{ name: '결제 시스템 설계', rationale: 'r', roadmapDraft: '# ...' }],
    suggestionsAvailable: true,
    providerContext: 'static:planner',
  },
};

const chaptersOutlineResult: SuggestionResult = {
  port: 'chapters-outline',
  response: {
    chapters: [
      { title: '1. 기초 원리', rationale: '축의 헌법 뼈대' },
      { title: '2. 실전 적용', rationale: '원리를 사례로 확인' },
    ],
    suggestionsAvailable: true,
    providerContext: 'static:designer',
  },
};

const chapterSubtreeResult: SuggestionResult = {
  port: 'chapter-subtree',
  response: {
    bodyAsciiTree: '├── 1-1. 정의\n│       개념 정의\n└── 1-2. 사례',
    suggestionsAvailable: true,
    providerContext: 'static:problem-solver',
  },
};

const selectionOutlineResult: SuggestionResult = {
  port: 'selection-outline',
  response: {
    containerName: '웹 서비스 실전 v1',
    chapters: [
      { title: '1. 사이드 프로젝트', rationale: '작은 실전 스택' },
    ],
    suggestionsAvailable: true,
    providerContext: 'static:backend-developer',
  },
};

const selectionSubtreeResult: SuggestionResult = {
  port: 'selection-subtree',
  response: {
    bodyAsciiTree: '├── 스택 선정\n│       기준 A · 기준 B\n└── 배포',
    suggestionsAvailable: true,
    providerContext: 'llm:vertex-gemini',
  },
};

describe('SuggestionResultDialog', () => {
  it('does not render when closed', () => {
    render(<SuggestionResultDialog open={false} onClose={() => undefined} result={layerResult} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders Layer port with layer 제안 헤더 · providerContext 3종 매핑 · list', () => {
    render(<SuggestionResultDialog open onClose={() => undefined} result={layerResult} />);
    expect(screen.getByRole('dialog', { name: /AI 가 제안한 Layer/ })).toBeInTheDocument();
    expect(screen.getByText(/LAYER · AI 제안/)).toBeInTheDocument();
    expect(screen.getByLabelText('AI provider: static:backend-developer')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: /Layer 제안 목록/ })).toBeInTheDocument();
    expect(screen.getByText('시스템 설계')).toBeInTheDocument();
  });

  it('renders Axis port with axis 제안 목록 · planner role 라벨', () => {
    render(<SuggestionResultDialog open onClose={() => undefined} result={axisResult} />);
    expect(screen.getByRole('dialog', { name: /AI 가 제안한 축/ })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: /축 제안 목록/ })).toBeInTheDocument();
    expect(screen.getByText('기획')).toBeInTheDocument();
  });

  it('renders ChaptersOutline port · designer role · 챕터 title/rationale 노출 (6-Port · 신규)', () => {
    render(
      <SuggestionResultDialog open onClose={() => undefined} result={chaptersOutlineResult} />,
    );
    expect(
      screen.getByRole('dialog', { name: /AI 가 제안한 축 헌법 챕터/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/CHAPTERS · 수렴\/헌법/)).toBeInTheDocument();
    expect(screen.getByText('디자인')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: /챕터 outline 제안 목록/ })).toBeInTheDocument();
    expect(screen.getByText('1. 기초 원리')).toBeInTheDocument();
    expect(screen.getByText('축의 헌법 뼈대')).toBeInTheDocument();
  });

  it('renders ChapterSubtree port · problem-solver role · body ASCII pre monospace (6-Port · 신규)', () => {
    render(
      <SuggestionResultDialog open onClose={() => undefined} result={chapterSubtreeResult} />,
    );
    expect(
      screen.getByRole('dialog', { name: /AI 가 제안한 챕터 subtree/ }),
    ).toBeInTheDocument();
    expect(screen.getByText('문제해결')).toBeInTheDocument();
    expect(screen.getByLabelText('챕터 subtree ASCII')).toHaveTextContent('1-1. 정의');
  });

  it('renders SelectionOutline port · containerName + chapters (ADR023 발산/판례 · 6-Port 신규)', () => {
    render(
      <SuggestionResultDialog open onClose={() => undefined} result={selectionOutlineResult} />,
    );
    expect(
      screen.getByRole('dialog', { name: /AI 가 제안한 축 판례 컨테이너/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/SELECTIONS · 발산\/판례/)).toBeInTheDocument();
    expect(screen.getByLabelText('판례 컨테이너 이름')).toHaveTextContent('웹 서비스 실전 v1');
    expect(screen.getByRole('list', { name: /판례 outline 제안 목록/ })).toBeInTheDocument();
    expect(screen.getByText('1. 사이드 프로젝트')).toBeInTheDocument();
  });

  it('renders SelectionSubtree port · LLM 프로바이더 라벨 · ASCII (6-Port · 신규)', () => {
    render(
      <SuggestionResultDialog open onClose={() => undefined} result={selectionSubtreeResult} />,
    );
    expect(
      screen.getByRole('dialog', { name: /AI 가 제안한 판례 subtree/ }),
    ).toBeInTheDocument();
    expect(screen.getByText('LLM · vertex-gemini')).toBeInTheDocument();
    expect(screen.getByLabelText('판례 subtree ASCII')).toHaveTextContent('스택 선정');
  });

  it('shows fallback message when suggestionsAvailable is false', () => {
    render(
      <SuggestionResultDialog
        open
        onClose={() => undefined}
        result={{
          port: 'chapters-outline',
          response: { chapters: [], suggestionsAvailable: false, providerContext: 'stub' },
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
