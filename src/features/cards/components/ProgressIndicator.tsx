interface Props {
  current: number; // 1-based
  total: number;
  stateLabel: 'DAY_1' | 'DAY_3' | 'DAY_7';
}

const labelKo: Record<Props['stateLabel'], string> = {
  DAY_1: '오늘 처음 만나는 카드',
  DAY_3: '3일 만의 재회',
  DAY_7: '7일 만의 재회',
};

export function ProgressIndicator({ current, total, stateLabel }: Props) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm text-cream-mute">
      <span className="font-display tracking-wide">
        <span className="text-cream">{current}</span> / {total}
      </span>
      <span className="rounded-full bg-amber-soft px-3 py-1 text-xs uppercase tracking-[var(--tracking-eyebrow)] text-amber">
        {stateLabel} · {labelKo[stateLabel]}
      </span>
    </div>
  );
}
