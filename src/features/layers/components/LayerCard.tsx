import type { Layer } from '@/lib/api/schemas/layer';

interface Props {
  layer: Layer;
  onEdit?: (layer: Layer) => void;
  onDelete?: (layer: Layer) => void;
}

const STATUS_LABEL: Record<NonNullable<Layer['progressStatus']>, string> = {
  NOT_STARTED: '미시작',
  IN_PROGRESS: '진행 중',
  COMPLETED: '완료',
};

export function LayerCard({ layer, onEdit, onDelete }: Props) {
  const status = layer.progressStatus;
  const statusText = status ? STATUS_LABEL[status] : null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-edge bg-surface px-4 py-4">
      {onEdit ? (
        <button
          type="button"
          onClick={() => onEdit(layer)}
          aria-label={`${layer.name} 편집`}
          className="flex flex-1 flex-col items-start gap-1 text-left transition-colors hover:opacity-80"
        >
          <span className="text-base font-semibold text-cream">{layer.name}</span>
          {statusText && <span className="text-xs text-cream-faint">{statusText}</span>}
        </button>
      ) : (
        <div className="flex flex-1 flex-col gap-1">
          <span className="text-base font-semibold text-cream">{layer.name}</span>
          {statusText && <span className="text-xs text-cream-faint">{statusText}</span>}
        </div>
      )}

      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="text-[11px] uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint"
        >
          #{layer.displayOrder + 1}
        </span>
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(layer)}
            aria-label={`${layer.name} 삭제`}
            className="rounded-full px-2 py-1 text-xs text-cream-faint transition-colors hover:bg-paper-2 hover:text-cream"
          >
            삭제
          </button>
        )}
      </div>
    </div>
  );
}
