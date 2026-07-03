import { useState } from 'react';
import type { AxisSelection } from '@/lib/api/schemas/axisSelection';
import { AxisSelectionForm } from './AxisSelectionForm';
import { SelectionNodeList } from './SelectionNodeList';

// product-learning-tower Story 3-4/3-5/3-10 개정.
// 컨테이너 카드 — 헤더(이름 · created_at · [편집]/[삭제]) + 접힘/펼침 + 자식 노드 리스트 마운트.

interface Props {
  axisId: string;
  selection: AxisSelection;
  onEdit: () => void; // 편집 dialog 트리거 (부모)
  onDelete: () => void; // 삭제 confirm 트리거 (부모)
  editingId?: string | null; // 부모가 in-place edit 상태 결정 시
  onEditDone?: () => void;
  onEditCancel?: () => void;
  defaultExpanded?: boolean;
}

export function SelectionContainerCard({
  axisId,
  selection,
  onEdit,
  onDelete,
  editingId,
  onEditDone,
  onEditCancel,
  defaultExpanded = false,
}: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const isEditing = editingId === selection.id;

  if (isEditing) {
    return (
      <AxisSelectionForm
        axisId={axisId}
        mode="edit"
        selection={selection}
        onDone={() => onEditDone?.()}
        onCancel={() => onEditCancel?.()}
      />
    );
  }

  const created = new Date(selection.createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <article
      aria-label={`${selection.name} Selection`}
      className="flex flex-col gap-3 rounded-2xl border border-edge bg-surface px-4 py-4"
    >
      <header className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-controls={`selection-nodes-${selection.id}`}
          aria-label={`${selection.name} ${expanded ? '접기' : '펼치기'}`}
          className="flex flex-1 flex-col items-start gap-0.5 text-left transition-colors hover:opacity-80"
        >
          <span className="text-[11px] uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
            {created} · 노드 {selection.nodes.length}
          </span>
          <h3 className="text-base font-semibold text-cream">
            {expanded ? '▾' : '▸'} {selection.name}
          </h3>
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            aria-label={`${selection.name} 편집`}
            className="rounded-full px-2 py-1 text-xs text-cream-faint transition-colors hover:bg-paper-2 hover:text-cream"
          >
            편집
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`${selection.name} 삭제`}
            className="rounded-full px-2 py-1 text-xs text-cream-faint transition-colors hover:bg-paper-2 hover:text-cream"
          >
            삭제
          </button>
        </div>
      </header>

      {expanded && (
        <div id={`selection-nodes-${selection.id}`}>
          <SelectionNodeList
            axisId={axisId}
            selectionId={selection.id}
            nodes={selection.nodes}
          />
        </div>
      )}
    </article>
  );
}
