import type { Layer } from '@/lib/api/schemas/layer';

interface Props {
  layer: Layer;
  onEdit?: (layer: Layer) => void;
}

const STATUS_LABEL: Record<NonNullable<Layer['progressStatus']>, string> = {
  NOT_STARTED: '미시작',
  IN_PROGRESS: '진행 중',
  COMPLETED: '완료',
};

export function LayerCard({ layer, onEdit }: Props) {
  const status = layer.progressStatus;
  const statusText = status ? STATUS_LABEL[status] : null;

  const inner = (
    <div className="flex items-center justify-between gap-3">
      <div className="flex flex-col gap-1">
        <span className="text-base font-semibold text-cream">{layer.name}</span>
        {statusText && (
          <span className="text-xs text-cream-faint">{statusText}</span>
        )}
      </div>
      <span
        aria-hidden
        className="text-[11px] uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint"
      >
        #{layer.displayOrder + 1}
      </span>
    </div>
  );

  if (onEdit) {
    return (
      <button
        type="button"
        onClick={() => onEdit(layer)}
        aria-label={`${layer.name} 편집`}
        className="w-full rounded-2xl border border-edge bg-surface px-4 py-4 text-left transition-colors hover:bg-paper-2"
      >
        {inner}
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-edge bg-surface px-4 py-4">{inner}</div>
  );
}
