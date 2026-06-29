import { useState } from 'react';
import { Icon } from '@/components/Icon';
import type { DeckSummary } from '@/lib/api/schemas/deck';
import { useSubDecks } from '../hooks/useSubDecks';

interface Props {
  deck: DeckSummary;
  parentDeckId: string | null;
  depth: number;
  onRename: (deck: DeckSummary) => void;
  onAddSub: (deck: DeckSummary) => void;
  onMove: (deck: DeckSummary, parentDeckId: string | null) => void;
  onDelete: (deck: DeckSummary) => void;
}

export function DeckItem({ deck, parentDeckId, depth, onRename, onAddSub, onMove, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false);
  const subs = useSubDecks(deck.deckId, expanded);

  const canExpand = deck.subDeckCount > 0;

  return (
    <div className="rounded-[14px] border border-edge bg-surface">
      <div
        className="group flex items-center gap-3 px-4 py-3.5"
        style={{ paddingLeft: 16 + depth * 18 }}
      >
        <button
          type="button"
          onClick={() => canExpand && setExpanded((v) => !v)}
          disabled={!canExpand}
          aria-label={expanded ? '하위 덱 접기' : '하위 덱 펼치기'}
          className={`grid h-7 w-7 flex-shrink-0 place-items-center rounded-md transition-colors ${
            canExpand
              ? 'text-cream-mute hover:bg-paper-2 hover:text-cream'
              : 'text-cream-faint opacity-40'
          }`}
        >
          <Icon
            name={expanded ? 'solar:alt-arrow-down-linear' : 'solar:alt-arrow-right-linear'}
            width={14}
            height={14}
          />
        </button>

        <Icon
          name="solar:folder-linear"
          width={17}
          height={17}
          className="flex-shrink-0 text-amber-deep"
        />

        <div className="min-w-0 flex-1">
          <div className="truncate font-serif text-[16px] font-medium text-cream">
            {deck.name}
          </div>
          <div className="mt-0.5 flex items-center gap-3 text-[11.5px] text-cream-faint">
            <span className="tabular-nums">카드 {deck.cardCount}</span>
            {deck.subDeckCount > 0 && (
              <span className="tabular-nums">하위 덱 {deck.subDeckCount}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-60 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onRename(deck)}
            title="이름 변경"
            aria-label="이름 변경"
            className="grid h-8 w-8 place-items-center rounded-md text-cream-mute transition-colors hover:bg-paper-2 hover:text-cream"
          >
            <Icon name="solar:pen-2-linear" width={14} height={14} />
          </button>
          <button
            type="button"
            onClick={() => onAddSub(deck)}
            title="하위 덱 추가"
            aria-label="하위 덱 추가"
            className="grid h-8 w-8 place-items-center rounded-md text-cream-mute transition-colors hover:bg-paper-2 hover:text-cream"
          >
            <Icon name="solar:add-folder-linear" width={14} height={14} />
          </button>
          <button
            type="button"
            onClick={() => onMove(deck, parentDeckId)}
            title="이동"
            aria-label="이동"
            className="grid h-8 w-8 place-items-center rounded-md text-cream-mute transition-colors hover:bg-paper-2 hover:text-cream"
          >
            <Icon name="solar:transfer-horizontal-linear" width={14} height={14} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(deck)}
            title="삭제"
            aria-label="삭제"
            className="grid h-8 w-8 place-items-center rounded-md text-cream-mute transition-colors hover:bg-paper-2 hover:text-amber-deep"
          >
            <Icon name="solar:trash-bin-2-linear" width={14} height={14} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-edge px-2 py-2">
          {subs.isLoading ? (
            <div className="px-3 py-2 text-[12.5px] text-cream-faint">불러오는 중…</div>
          ) : subs.isError ? (
            <div className="px-3 py-2 text-[12.5px] text-amber-deep">하위 덱을 불러오지 못했어요.</div>
          ) : subs.data && subs.data.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {subs.data.map((child) => (
                <DeckItem
                  key={child.deckId}
                  deck={child}
                  parentDeckId={deck.deckId}
                  depth={depth + 1}
                  onRename={onRename}
                  onAddSub={onAddSub}
                  onMove={onMove}
                  onDelete={onDelete}
                />
              ))}
            </div>
          ) : (
            <div className="px-3 py-2 text-[12.5px] text-cream-faint">
              아직 하위 덱이 없어요.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
