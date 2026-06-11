import { Card } from '@/components/Card';
import { TagChip } from '@/components/TagChip';

interface Tag { tagId: string; name: string }

interface Props {
  summary: string;
  keywords: string[];
  tags?: Tag[];
  viewCount: number;
  maxView: number;
}

export function OnFieldCardFace({ summary, keywords, tags = [], viewCount, maxView }: Props) {
  const lastExposure = viewCount === maxView - 1;
  return (
    <Card>
      {lastExposure && (
        <div className="mb-4 rounded-full bg-amber-soft px-3 py-1 text-xs text-amber">
          이번이 마지막 노출입니다.
        </div>
      )}
      <p className="font-display text-3xl leading-snug text-cream break-keep md:text-4xl">
        {summary}
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        {keywords.map((k) => (
          <span key={k} className="rounded-full bg-glass px-3 py-1 text-xs text-cream-mute">
            {k}
          </span>
        ))}
      </div>
      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((t) => (
            <TagChip key={t.tagId} label={t.name} />
          ))}
        </div>
      )}
      <p className="mt-6 text-xs text-cream-faint">
        노출 {viewCount + 1} / {maxView}
      </p>
    </Card>
  );
}
