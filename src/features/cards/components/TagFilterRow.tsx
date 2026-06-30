import { TagChip } from '@/components/TagChip';
import type { Card } from '@/lib/api/schemas/card';

interface Props {
  cards: Card[];
  selected: string | null;
  onSelect: (tagId: string | null) => void;
}

export function TagFilterRow({ cards, selected, onSelect }: Props) {
  const counts = new Map<string, { name: string; count: number }>();
  cards.forEach((c) =>
    c.tags.forEach((t) => {
      const prev = counts.get(t.tagId);
      counts.set(t.tagId, { name: t.name, count: (prev?.count ?? 0) + 1 });
    }),
  );
  const ordered = [...counts.entries()].sort((a, b) => b[1].count - a[1].count);

  return (
    <div className="flex flex-wrap gap-2">
      <TagChip label="전체" selected={selected === null} onClick={() => onSelect(null)} />
      {ordered.map(([tagId, { name }]) => (
        <TagChip
          key={tagId}
          label={name}
          selected={selected === tagId}
          onClick={() => onSelect(tagId)}
        />
      ))}
    </div>
  );
}
