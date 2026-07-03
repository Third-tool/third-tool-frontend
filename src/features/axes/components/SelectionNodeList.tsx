import { useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/Button';
import { ApiError } from '@/lib/api/client';
import {
  useCreateSelectionNode,
  useSelectionNodeReorder,
} from '../hooks/useSelectionNodeMutations';
import { SelectionNodeCard } from './SelectionNodeCard';
import { NodeBodyEditor } from './NodeBodyEditor';
import type { AxisSelectionNode } from '@/lib/api/schemas/axisSelectionNode';

// product-learning-tower Story 3-10 (신설 · 2026-07-02).
// Selection 컨테이너 하위 노드 리스트 · dnd-kit reorder · [+ 노드 추가] in-place 폼.

interface Props {
  axisId: string;
  selectionId: string;
  nodes: AxisSelectionNode[];
}

export function SelectionNodeList({ axisId, selectionId, nodes }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const reorder = useSelectionNodeReorder(axisId, selectionId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = nodes.findIndex((n) => n.id === active.id);
    const newIndex = nodes.findIndex((n) => n.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(nodes, oldIndex, newIndex);
    reorder.mutate(next.map((n) => n.id));
  };

  return (
    <section aria-label="Selection 노드 목록" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
          챕터 노드
        </h4>
        <Button
          variant="ghost"
          type="button"
          onClick={() => setShowCreate(true)}
          aria-label="Selection 노드 추가"
          disabled={showCreate}
        >
          + 노드 추가
        </Button>
      </div>

      {showCreate && (
        <SelectionNodeCreateForm
          axisId={axisId}
          selectionId={selectionId}
          onDone={() => setShowCreate(false)}
        />
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={nodes.map((n) => n.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul aria-label="Selection 노드 리스트" className="flex flex-col gap-3">
            {nodes.map((node) => (
              <li key={node.id}>
                <SortableSelectionNodeRow axisId={axisId} node={node} />
              </li>
            ))}
            {nodes.length === 0 && !showCreate && (
              <li className="text-xs text-cream-faint">
                아직 노드가 없어요. 챕터를 하나 추가해보세요.
              </li>
            )}
          </ul>
        </SortableContext>
      </DndContext>
    </section>
  );
}

function SortableSelectionNodeRow({
  axisId,
  node,
}: {
  axisId: string;
  node: AxisSelectionNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: node.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  } as const;

  const dragHandle = (
    <button
      type="button"
      aria-label={`${node.title} 순서 이동 핸들`}
      {...attributes}
      {...listeners}
      className="cursor-grab rounded-lg px-2 py-1 text-cream-faint transition-colors hover:bg-paper-2 hover:text-cream active:cursor-grabbing"
    >
      ⋮⋮
    </button>
  );

  return (
    <div ref={setNodeRef} style={style}>
      <SelectionNodeCard axisId={axisId} node={node} dragHandle={dragHandle} />
    </div>
  );
}

interface CreateFormProps {
  axisId: string;
  selectionId: string;
  onDone: () => void;
}

function SelectionNodeCreateForm({ axisId, selectionId, onDone }: CreateFormProps) {
  const [title, setTitle] = useState('');
  const [rationale, setRationale] = useState('');
  const [body, setBody] = useState('');
  const [inline, setInline] = useState<string | null>(null);
  const create = useCreateSelectionNode(axisId, selectionId);

  const canSave =
    title.trim().length > 0 && body.trim().length > 0 && !create.isPending;

  const onSave = () => {
    if (!canSave) return;
    setInline(null);
    create.mutate(
      {
        title: title.trim(),
        rationale: rationale.trim() === '' ? null : rationale.trim(),
        body,
      },
      {
        onSuccess: onDone,
        onError: (err) => {
          if (err instanceof ApiError && err.code === 'SELECTION_NODE_BODY_BLANK') {
            setInline('노드 본문을 입력해주세요.');
          } else if (err instanceof ApiError && err.code === 'SELECTION_NODE_TITLE_BLANK') {
            setInline('노드 제목을 입력해주세요.');
          } else {
            setInline('저장에 실패했어요. 잠시 후 다시 시도해주세요.');
          }
        },
      },
    );
  };

  return (
    <article
      aria-label="새 Selection 노드 추가"
      className="flex flex-col gap-4 rounded-2xl border border-edge bg-surface px-4 py-4"
    >
      <label className="flex flex-col gap-2">
        <span className="text-sm text-cream-mute">제목</span>
        <input
          aria-label="새 Selection 노드 제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 1. 사이드 프로젝트 구성"
          autoFocus
          className="rounded-2xl bg-glass px-3 py-2 text-sm text-cream outline-none ring-1 ring-edge focus:ring-cream"
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-sm text-cream-mute">근거 (선택)</span>
        <input
          aria-label="새 Selection 노드 근거"
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          className="rounded-2xl bg-glass px-3 py-2 text-sm text-cream outline-none ring-1 ring-edge focus:ring-cream"
        />
      </label>
      <NodeBodyEditor value={body} onChange={setBody} />
      {inline && (
        <p role="alert" className="text-sm text-amber">
          {inline}
        </p>
      )}
      <div className="flex items-center justify-end gap-3">
        <Button variant="ghost" type="button" onClick={onDone} disabled={create.isPending}>
          취소
        </Button>
        <Button variant="primary" type="button" onClick={onSave} disabled={!canSave}>
          {create.isPending ? '저장 중…' : '추가'}
        </Button>
      </div>
    </article>
  );
}
