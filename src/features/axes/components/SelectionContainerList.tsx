import { useState } from 'react';
import { Button } from '@/components/Button';
import type { AxisSelection } from '@/lib/api/schemas/axisSelection';
import { useAxisSelections } from '../hooks/useAxisSelections';
import { AxisSelectionForm } from './AxisSelectionForm';
import { AxisSelectionDeleteConfirm } from './AxisSelectionDeleteConfirm';
import { SelectionContainerCard } from './SelectionContainerCard';

// product-learning-tower Story 3-4 · 3-10 (신설 · 2026-07-02).
// Selection 컨테이너 리스트 (created_at DESC) + [+ Selection 추가] in-place 폼.
// 각 컨테이너 카드 안에 접힘/펼침 + 노드 리스트 마운트.

interface Props {
  axisId: string;
}

type DialogMode = 'closed' | 'delete' | 'create-form';

export function SelectionContainerList({ axisId }: Props) {
  const selections = useAxisSelections(axisId);
  const items = selections.data ?? [];
  const [dialog, setDialog] = useState<DialogMode>('closed');
  const [targetDelete, setTargetDelete] = useState<AxisSelection | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <section aria-label="Selection 컨테이너 목록" className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-cream">Selection 컨테이너</h2>
        <Button
          variant="primary"
          type="button"
          onClick={() => setDialog('create-form')}
          aria-label="Selection 추가"
          disabled={dialog === 'create-form'}
        >
          + Selection 추가
        </Button>
      </div>

      {selections.isLoading && (
        <p className="text-sm text-cream-faint">불러오는 중…</p>
      )}
      {selections.isError && (
        <p role="alert" className="text-sm text-amber">
          Selection 목록을 불러오지 못했어요.
        </p>
      )}

      {dialog === 'create-form' && (
        <AxisSelectionForm
          axisId={axisId}
          mode="create"
          onDone={() => setDialog('closed')}
          onCancel={() => setDialog('closed')}
        />
      )}

      {!selections.isLoading && !selections.isError && (
        <ul aria-label="Selection 리스트" className="flex flex-col gap-3">
          {items.map((selection) => (
            <li key={selection.id}>
              <SelectionContainerCard
                axisId={axisId}
                selection={selection}
                editingId={editingId}
                onEdit={() => setEditingId(selection.id)}
                onEditDone={() => setEditingId(null)}
                onEditCancel={() => setEditingId(null)}
                onDelete={() => {
                  setTargetDelete(selection);
                  setDialog('delete');
                }}
              />
            </li>
          ))}
          {items.length === 0 && dialog !== 'create-form' && (
            <li className="text-sm text-cream-faint">
              아직 Selection 이 없어요. 사례/응용 컨테이너를 하나 추가해보세요.
            </li>
          )}
        </ul>
      )}

      <AxisSelectionDeleteConfirm
        open={dialog === 'delete'}
        onClose={() => setDialog('closed')}
        onDeleted={() => setTargetDelete(null)}
        axisId={axisId}
        selection={dialog === 'delete' ? targetDelete : null}
      />
    </section>
  );
}
