import { useState, type ReactNode } from 'react';
import { KeywordInput } from './KeywordInput';
import { TagInput } from './TagInput';
import { useCreateCard } from '../hooks/useCreateCard';
import { useSelectedDeck } from '@/features/decks/DeckContext';
import { useDecks } from '@/features/decks/hooks/useDecks';
import { ApiError } from '@/lib/api/client';

const FIELD_ERROR: Record<string, string> = {
  CARD020: '한 줄 요약을 채워주세요.',
  CARD021: '한 줄 요약은 1~3문장 범위여야 해요.',
  CARD031: '키워드 1개 이상이 필요해요.',
  CARD030: '키워드는 비어 있을 수 없어요.',
  CARD010: '본문을 입력해주세요.',
  TAG002: '태그는 최대 3개까지만 달 수 있어요.',
};

interface Props {
  onSuccess?: () => void;
  submitLabel?: string;
  footerSlot?: (ctx: { canSubmit: boolean; isPending: boolean; submit: () => void }) => ReactNode;
}

export function CreateCardForm({ onSuccess, footerSlot }: Props) {
  const [summary, setSummary] = useState('');
  const [mainText, setMainText] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [inline, setInline] = useState<string | null>(null);
  const create = useCreateCard();
  const { selectedDeckId, setSelectedDeckId } = useSelectedDeck();
  const decks = useDecks();

  const deckList = decks.data?.content ?? [];
  const activeDeckId = selectedDeckId ?? deckList[0]?.deckId ?? null;

  const canSubmit =
    summary.trim().length > 0 &&
    mainText.trim().length > 0 &&
    keywords.length > 0 &&
    activeDeckId !== null;

  const submit = () => {
    if (!canSubmit || !activeDeckId) return;
    setInline(null);
    create.mutate(
      {
        deckId: activeDeckId,
        summary: summary.trim(),
        mainText: mainText.trim(),
        keywords,
        tags,
      },
      {
        onSuccess: () => {
          setSummary('');
          setMainText('');
          setKeywords([]);
          setTags([]);
          onSuccess?.();
        },
        onError: (err) => {
          if (err instanceof ApiError && FIELD_ERROR[err.code]) {
            setInline(FIELD_ERROR[err.code]!);
          } else {
            setInline('지금 카드를 펼치기 어려워요. 잠시 후 다시 시도해주세요.');
          }
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {inline && (
        <div className="rounded-sm border border-red-400/40 bg-red-500/10 px-4 py-2 font-mono text-xs uppercase tracking-[var(--tracking-mono)] text-red-200">
          {inline}
        </div>
      )}

      <label className="flex flex-col gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[var(--tracking-mono)] text-cream-faint">
          Deck
        </span>
        {deckList.length === 0 ? (
          <div className="rounded-[8px] border border-dashed border-edge bg-paper-2 px-3 py-2 text-[12.5px] text-cream-faint">
            먼저 사이드바에서 덱을 만들어주세요.
          </div>
        ) : (
          <select
            value={activeDeckId ?? ''}
            onChange={(e) => setSelectedDeckId(e.target.value || null)}
            className="rounded-[8px] border border-edge bg-surface px-3 py-2 text-sm text-cream outline-none focus:border-amber-line"
          >
            {deckList.map((d) => (
              <option key={d.deckId} value={d.deckId}>
                {d.name}
              </option>
            ))}
          </select>
        )}
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[var(--tracking-mono)] text-cream-faint">
          Summary
        </span>
        <textarea
          aria-label="summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="이 카드에 무엇을 담을까요?"
          className="resize-none border-b border-edge bg-transparent py-3 text-lg font-light text-cream outline-none transition-colors placeholder:text-cream-faint focus:border-cream"
        />
        <span className="text-right font-mono text-[10px] text-cream-faint">
          {summary.length} / 500
        </span>
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[var(--tracking-mono)] text-cream-faint">
          본문
        </span>
        <textarea
          aria-label="mainText"
          value={mainText}
          onChange={(e) => setMainText(e.target.value)}
          rows={6}
          placeholder="자료의 핵심을 자유롭게 적어두세요."
          className="resize-none rounded-[8px] border border-edge bg-surface px-3 py-2 text-sm text-cream outline-none focus:border-amber-line"
        />
      </label>

      <KeywordInput value={keywords} onChange={setKeywords} label="키워드" />
      <TagInput value={tags} onChange={setTags} />

      {footerSlot?.({ canSubmit, isPending: create.isPending, submit })}
    </div>
  );
}
