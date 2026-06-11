import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LandingPage } from './LandingPage';

describe('LandingPage', () => {
  it('renders the major section headlines', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Until you find your dream/i)).toBeInTheDocument();
    expect(screen.getByText('학습은 실패가 아니라 순환입니다.')).toBeInTheDocument();
    expect(screen.getByText('세 걸음이면 충분합니다.')).toBeInTheDocument();
    expect(screen.getByText('조용히 곁에서 들었던 이야기들.')).toBeInTheDocument();
    expect(screen.getByText('오늘, 첫 카드를 쓰러 가볼까요?')).toBeInTheDocument();
  });
});
