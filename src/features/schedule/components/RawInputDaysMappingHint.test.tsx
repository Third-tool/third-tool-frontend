import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RawInputDaysMappingHint } from './RawInputDaysMappingHint';

// M4 Story 1-3 (product-card Epic 1) · 매핑 안내 · clamp 정합 검증.

describe('RawInputDaysMappingHint', () => {
  it('happy · 5일 입력 시 MODE_7D(집중 학습 · 1~7일) 표시 · 노출 3회', () => {
    render(<RawInputDaysMappingHint inputDays={5} />);
    expect(screen.getByLabelText('매핑 모드 MODE_7D')).toBeInTheDocument();
    expect(screen.getByText(/집중 학습 모드/)).toBeInTheDocument();
    expect(screen.getByText(/1~7일/)).toBeInTheDocument();
    expect(screen.getByText(/노출 3회.*1·3·7일/)).toBeInTheDocument();
  });

  it('happy · 21일 입력 시 MODE_28D(중기 학습 · 15~28일) 표시 · 노출 5회', () => {
    render(<RawInputDaysMappingHint inputDays={21} />);
    expect(screen.getByLabelText('매핑 모드 MODE_28D')).toBeInTheDocument();
    expect(screen.getByText(/중기 학습 모드/)).toBeInTheDocument();
    expect(screen.getByText(/15~28일/)).toBeInTheDocument();
    expect(screen.getByText(/노출 5회.*1·3·7·14·28일/)).toBeInTheDocument();
  });

  it('edge · 60일 경계 입력 시 MODE_60D · clamp 안내 미노출', () => {
    render(<RawInputDaysMappingHint inputDays={60} />);
    expect(screen.getByLabelText('매핑 모드 MODE_60D')).toBeInTheDocument();
    expect(screen.getByText(/29~60일/)).toBeInTheDocument();
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });

  it('error · 100일 입력 시 60일로 clamp · MODE_60D + 안내 문구 노출 (Story 1-5)', () => {
    render(<RawInputDaysMappingHint inputDays={100} />);
    expect(screen.getByLabelText('매핑 모드 MODE_60D')).toBeInTheDocument();
    expect(screen.getByText(/→ 60일 \(최대 60일\)/)).toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent(/최대 60일까지 지원/);
  });
});
