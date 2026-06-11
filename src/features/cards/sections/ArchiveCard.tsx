import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { TagChip } from '@/components/TagChip';
import { useReturnToField } from '../hooks/useReturnToField';
import type { Card as CardModel } from '@/lib/api/schemas/card';

interface Props {
  card: CardModel;
  expanded: boolean;
  onToggle: () => void;
}

export function ArchiveCard({ card, expanded, onToggle }: Props) {
  const ret = useReturnToField();

  return (
    <Card interactive>
      <button type="button" onClick={onToggle} className="w-full text-left">
        <p className="text-base leading-relaxed text-cream break-keep">{card.summary}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {card.tags.map((t) => (
            <TagChip key={t.tagId} label={t.name} />
          ))}
        </div>
      </button>
      {expanded && (
        <div className="mt-5 border-t border-edge pt-5">
          <div className="flex flex-wrap gap-2">
            {card.keywords.map((k) => (
              <span key={k} className="rounded-full bg-glass px-3 py-1 text-xs text-cream-mute">
                {k}
              </span>
            ))}
          </div>
          <div className="mt-5 flex justify-end">
            <Button
              size="md"
              onClick={() => ret.mutate(card.cardId)}
              disabled={ret.isPending}
              rightIcon={<Icon name="solar:undo-left-linear" />}
            >
              다시 만나러 보내기
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
