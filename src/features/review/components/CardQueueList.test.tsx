import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CardQueueList } from './CardQueueList';
import type { DailyLearningBatch } from '@/lib/api/schemas/dailyLearningBatch';

function makeBatch(entries: DailyLearningBatch['entries']): DailyLearningBatch {
  return {
    userId: 'user-1',
    batchDate: '2026-07-22',
    entries,
    completionRate: 0,
    streak: 0,
    closedAt: null,
  };
}

describe('<CardQueueList> (Story 1-4)', () => {
  it('happy · 3장 카드 preview · D+ 라벨 · 클릭 링크 /study?cardId', () => {
    render(
      <CardQueueList
        batch={makeBatch([
          { cardId: '1', cardIntervalDay: 1, exposedAt: 't', viewedAt: null, summary: 'JPA', layerName: '기본', axisName: 'axis-1', createdMode: 'MODE_14D' },
          { cardId: '2', cardIntervalDay: 3, exposedAt: 't', viewedAt: null, summary: 'BTree', layerName: '기본', axisName: 'axis-1', createdMode: 'MODE_28D' },
          { cardId: '3', cardIntervalDay: 7, exposedAt: 't', viewedAt: null, summary: 'Kafka', layerName: '기본', axisName: 'axis-2', createdMode: 'MODE_28D' },
        ])}
      />,
      { wrapper: MemoryRouter },
    );
    expect(screen.getByText('총 3장 · cross-layer 짬뽕')).toBeInTheDocument();
    expect(screen.getByLabelText('간격 D+1')).toBeInTheDocument();
    expect(screen.getByLabelText('간격 D+3')).toBeInTheDocument();
    expect(screen.getByLabelText('간격 D+7')).toBeInTheDocument();
    const link = screen.getByLabelText(/JPA · D\+1/);
    expect(link).toHaveAttribute('href', '/study?cardId=1');
  });

  it('edge · viewed 카드는 opacity 60 · "clear" 배지 노출', () => {
    render(
      <CardQueueList
        batch={makeBatch([
          { cardId: '1', cardIntervalDay: 1, exposedAt: 't', viewedAt: 't2', summary: 'A', layerName: null, axisName: null, createdMode: null },
        ])}
      />,
      { wrapper: MemoryRouter },
    );
    expect(screen.getByText('clear')).toBeInTheDocument();
    expect(screen.getByLabelText(/A · D\+1 완료/)).toBeInTheDocument();
  });

  it('empty · entries 0장 · [새 카드 만들기] · [대시보드] CTA', () => {
    render(<CardQueueList batch={makeBatch([])} />, { wrapper: MemoryRouter });
    expect(screen.getByText('오늘 복습할 카드가 없어요')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '새 카드 만들기' })).toHaveAttribute('href', '/cards/new');
    expect(screen.getByRole('link', { name: '대시보드' })).toHaveAttribute('href', '/dashboard');
  });
});
