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
import { useAxisRoadmapNodes } from '../hooks/useAxisRoadmapNodes';
import { useCreateRoadmapNode } from '../hooks/useRoadmapNodeMutations';
import { useRoadmapNodeReorder } from '../hooks/useRoadmapNodeReorder';
import { RoadmapNodeCard } from './RoadmapNodeCard';
import { NodeBodyEditor } from './NodeBodyEditor';
import type { AxisRoadmapNode } from '@/lib/api/schemas/axisRoadmapNode';

// product-learning-tower Story 3-9 (신설 · 2026-07-02).
// Roadmap 챕터 노드 카드 리스트 · dnd-kit reorder · [+ 노드 추가] in-place 폼.
// Story 3-3 (`<AxisRoadmapEditor>` textarea 원안 SUPERSEDED) 대체.

interface Props {
  axisId: string;
}

export function RoadmapNodeList({ axisId }: Props) {
  const nodes = useAxisRoadmapNodes(axisId);
  const items = nodes.data ?? [];
  const [showCreate, setShowCreate] = useState(false);

  const reorder = useRoadmapNodeReorder(axisId);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((n) => n.id === active.id);
    const newIndex = items.findIndex((n) => n.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(items, oldIndex, newIndex);
    reorder.mutate(next.map((n) => n.id));
  };

  return (
    <section aria-label="Roadmap 노드 목록" className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-cream">챕터 노드</h2>
        <Button
          variant="primary"
          type="button"
          onClick={() => setShowCreate(true)}
          aria-label="노드 추가"
          disabled={showCreate}
        >
          + 노드 추가
        </Button>
      </div>

      {nodes.isLoading && (
        <p className="text-sm text-cream-faint">불러오는 중…</p>
      )}
      {nodes.isError && (
        <p role="alert" className="text-sm text-amber">
          노드 목록을 불러오지 못했어요.
        </p>
      )}

      {showCreate && (
        <RoadmapNodeCreateForm axisId={axisId} onDone={() => setShowCreate(false)} />
      )}

      {!nodes.isLoading && !nodes.isError && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={items.map((n) => n.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul aria-label="Roadmap 노드 리스트" className="flex flex-col gap-3">
              {items.map((node) => (
                <li key={node.id}>
                  <SortableRoadmapNodeRow node={node} />
                </li>
              ))}
              {items.length === 0 && !showCreate && (
                <li className="text-sm text-cream-faint">
                  아직 노드가 없어요. 챕터를 하나 추가해보세요.
                </li>
              )}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </section>
  );
}

function SortableRoadmapNodeRow({ node }: { node: AxisRoadmapNode }) {
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
      <RoadmapNodeCard node={node} dragHandle={dragHandle} />
    </div>
  );
}

interface CreateFormProps {
  axisId: string;
  onDone: () => void;
}

function RoadmapNodeCreateForm({ axisId, onDone }: CreateFormProps) {
  const [title, setTitle] = useState('');
  const [rationale, setRationale] = useState('');
  const [body, setBody] = useState('');
  const [inline, setInline] = useState<string | null>(null);
  const create = useCreateRoadmapNode(axisId);

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
          if (err instanceof ApiError && err.code === 'ROADMAP_NODE_BODY_BLANK') {
            setInline('노드 본문을 입력해주세요.');
          } else if (err instanceof ApiError && err.code === 'ROADMAP_NODE_TITLE_BLANK') {
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
      aria-label="새 노드 추가"
      className="flex flex-col gap-4 rounded-2xl border border-edge bg-surface px-4 py-4"
    >
      <label className="flex flex-col gap-2">
        <span className="text-sm text-cream-mute">제목</span>
        <input
          aria-label="새 노드 제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 1. 하네스 엔지니어링 기초"
          autoFocus
          className="rounded-2xl bg-glass px-3 py-2 text-sm text-cream outline-none ring-1 ring-edge focus:ring-cream"
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-sm text-cream-mute">근거 (선택)</span>
        <input
          aria-label="새 노드 근거"
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          placeholder="예: AI 에이전트의 기본 프레임 확립"
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
