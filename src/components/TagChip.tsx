interface Props {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
}

export function TagChip({ label, selected, onClick, onRemove }: Props) {
  const baseChip = 'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition-colors';
  const tone = selected
    ? 'bg-amber text-canvas'
    : 'bg-glass text-cream-mute hover:bg-[rgba(255,248,235,0.08)]';
  return (
    <span className={`${baseChip} ${tone}`}>
      {onClick ? (
        <button type="button" onClick={onClick} className="font-medium">
          {label}
        </button>
      ) : (
        <span className="font-medium">{label}</span>
      )}
      {onRemove && (
        <button
          type="button"
          aria-label={`remove ${label}`}
          onClick={onRemove}
          className="rounded-full px-1 text-cream-faint hover:text-cream"
        >
          ×
        </button>
      )}
    </span>
  );
}
