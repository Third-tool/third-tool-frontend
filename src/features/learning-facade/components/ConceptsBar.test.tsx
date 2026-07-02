import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ConceptsBar } from './ConceptsBar';

function renderAt(concepts: string[]) {
  return render(
    <MemoryRouter>
      <ConceptsBar concepts={concepts} />
    </MemoryRouter>,
  );
}

describe('ConceptsBar', () => {
  it('renders each concept as a chip', () => {
    renderAt(['백엔드', '시스템 설계', '데이터']);
    const list = screen.getByRole('list', { name: /학습 컨셉 목록/ });
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(list).toHaveTextContent('백엔드');
    expect(list).toHaveTextContent('시스템 설계');
    expect(list).toHaveTextContent('데이터');
  });

  it('shows an edit link pointing to /learning-facade/concepts by default', () => {
    renderAt(['백엔드']);
    const link = screen.getByRole('link', { name: /학습 컨셉 편집/ });
    expect(link).toHaveAttribute('href', '/learning-facade/concepts');
  });

  it('shows empty label when no concepts', () => {
    renderAt([]);
    expect(screen.getByText(/학습 컨셉이 아직 없어요/)).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: /학습 컨셉 목록/ })).not.toBeInTheDocument();
  });
});
