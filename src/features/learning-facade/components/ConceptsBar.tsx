import { Link } from 'react-router-dom';
import { TagChip } from '@/components/TagChip';

interface Props {
  concepts: string[];
  editHref?: string;
  emptyLabel?: string;
}

export function ConceptsBar({
  concepts,
  editHref = '/learning-facade/concepts',
  emptyLabel = '학습 컨셉이 아직 없어요',
}: Props) {
  const hasConcepts = concepts.length > 0;

  return (
    <div
      role="group"
      aria-label="학습 컨셉"
      className="flex flex-wrap items-center gap-2 rounded-2xl bg-glass px-3 py-2 ring-1 ring-edge"
    >
      {hasConcepts ? (
        <ul aria-label="학습 컨셉 목록" className="flex flex-wrap items-center gap-2">
          {concepts.map((c) => (
            <li key={c}>
              <TagChip label={c} />
            </li>
          ))}
        </ul>
      ) : (
        <span className="text-sm text-cream-faint">{emptyLabel}</span>
      )}
      <Link
        to={editHref}
        aria-label="학습 컨셉 편집"
        className="ml-auto text-xs text-amber underline-offset-4 hover:underline"
      >
        편집
      </Link>
    </div>
  );
}
