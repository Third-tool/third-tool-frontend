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
import type { Layer } from '@/lib/api/schemas/layer';
import { useLayerReorder } from '../hooks/useLayerReorder';

interface Props {
  layers: Layer[];
}

export function LayerReorderList({ layers }: Props) {
  const reorder = useLayerReorder();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = layers.findIndex((l) => l.layerId === active.id);
    const newIndex = layers.findIndex((l) => l.layerId === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(layers, oldIndex, newIndex);
    reorder.mutate(next.map((l) => l.layerId));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={layers.map((l) => l.layerId)} strategy={verticalListSortingStrategy}>
        <ul aria-label="Layer 순서 변경 목록" className="flex flex-col gap-3">
          {layers.map((layer) => (
            <SortableLayerRow key={layer.layerId} layer={layer} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableLayerRow({ layer }: { layer: Layer }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: layer.layerId,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  } as const;

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-2xl border border-edge bg-surface px-4 py-4"
    >
      <button
        type="button"
        aria-label={`${layer.name} 순서 이동 핸들`}
        {...attributes}
        {...listeners}
        className="cursor-grab rounded-lg px-2 py-1 text-cream-faint transition-colors hover:bg-paper-2 hover:text-cream active:cursor-grabbing"
      >
        ⋮⋮
      </button>
      <div className="flex flex-1 flex-col gap-1">
        <span className="text-base font-semibold text-cream">{layer.name}</span>
        <span className="text-xs text-cream-faint">순서 {layer.displayOrder + 1}</span>
      </div>
    </li>
  );
}
