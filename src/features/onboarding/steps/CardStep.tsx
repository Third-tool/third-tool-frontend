import { useState } from 'react';
import { Icon } from '@/components/Icon';
import { ApiError } from '@/lib/api/client';
import { useCreateCard } from '@/features/cards/hooks/useCreateCard';
import { useSelectedDeck } from '@/features/decks/DeckContext';
import { useDecks } from '@/features/decks/hooks/useDecks';
import { useCreateDeck } from '@/features/decks/hooks/useCreateDeck';

const KEYWORD_CHIPS = ['멱등성', '정산', '원장'];
const TAG_CHIPS = ['결제', '분산', '데이터'];

interface Props {
  onComplete: () => void;
  onSkip: () => void;
}

export function CardStep({ onComplete, onSkip }: Props) {
  const [summary, setSummary] = useState('');
  const [keyword, setKeyword] = useState('');
  const [tag, setTag] = useState<string | null>(null);
  const [inline, setInline] = useState<string | null>(null);
  const create = useCreateCard();
  const decks = useDecks();
  const createDeck = useCreateDeck();
  const { selectedDeckId, setSelectedDeckId } = useSelectedDeck();

  const ensureDeck = async (): Promise<string | null> => {
    const existing = selectedDeckId ?? decks.data?.content[0]?.deckId ?? null;
    if (existing) return existing;
    try {
      const created = await createDeck.mutateAsync({ name: '기본 노트' });
      setSelectedDeckId(created.deckId);
      return created.deckId;
    } catch {
      return null;
    }
  };

  const submit = async () => {
    if (!summary.trim() || !keyword.trim()) return;
    setInline(null);
    const deckId = await ensureDeck();
    if (!deckId) {
      setInline('덱을 준비하지 못했어요. 잠시 후 다시 시도해주세요.');
      return;
    }
    create.mutate(
      {
        deckId,
        summary: summary.trim(),
        mainText: summary.trim(),
        keywords: [keyword.trim()],
        tags: tag ? [tag] : [],
      },
      {
        onSuccess: () => onComplete(),
        onError: (err) => {
          if (err instanceof ApiError) {
            setInline(err.message);
          } else {
            setInline('지금 카드를 펴기 어려워요. 잠시 후 다시 이어가주세요');
          }
        },
      },
    );
  };

  const canSubmit = summary.trim().length > 0 && keyword.trim().length > 0 && !create.isPending;
  const previewSummary = summary.trim() || '여기에 한 문장이 들어와요';

  return (
    <div
      className="flex flex-col"
      style={{ animation: 'fadeInUp .4s var(--ease-spring) both' }}
    >
      <div className="mb-[22px] flex items-center gap-3">
        <span className="font-serif text-lg italic text-amber">03</span>
        <span className="text-xs uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
          First Card
        </span>
      </div>

      <h1 className="m-0 mb-[30px] font-serif text-[42px] font-medium leading-[1.12] tracking-[-0.02em] text-cream break-keep">
        첫 카드를 <span className="italic text-amber">적어볼까요.</span>
      </h1>

      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-6">
          <div>
            <label className="mb-2.5 block text-[11px] uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
              한 문장
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="오늘 만난 한 문장을 적어요"
              rows={2}
              className="w-full resize-none rounded-[12px] border border-edge-strong bg-surface px-4 py-3.5 font-serif text-[18px] leading-[1.4] text-cream caret-amber outline-none placeholder:text-cream-faint focus:border-amber-line focus:shadow-[0_0_0_3px_var(--color-amber-soft)]"
            />
          </div>

          <div>
            <label className="mb-2.5 block text-[11px] uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
              키워드
            </label>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="핵심 키워드 한 개"
              className="mb-2.5 w-full rounded-[12px] border border-edge-strong bg-surface px-4 py-3 text-[15px] text-cream caret-amber outline-none placeholder:text-cream-faint focus:border-amber-line focus:shadow-[0_0_0_3px_var(--color-amber-soft)]"
            />
            <div className="flex flex-wrap gap-2">
              {KEYWORD_CHIPS.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKeyword(k)}
                  className="rounded-full border border-edge-strong bg-transparent px-3.5 py-1.5 text-[12.5px] text-cream-mute transition-all duration-[var(--dur-fast)] ease-[var(--ease-spring)] hover:border-amber-line hover:text-amber"
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2.5 block text-[11px] uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
              태그
            </label>
            <div className="flex flex-wrap gap-2">
              {TAG_CHIPS.map((g) => {
                const active = tag === g;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setTag(active ? null : g)}
                    className={`rounded-full border px-4 py-1.5 text-[12.5px] font-medium transition-all duration-[var(--dur-fast)] ease-[var(--ease-spring)] ${
                      active
                        ? 'border-amber bg-amber-soft text-amber-deep'
                        : 'border-edge-strong bg-transparent text-cream-mute hover:border-amber-line'
                    }`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-[18px] border border-edge bg-surface p-[26px] shadow-[0_20px_44px_-28px_rgba(33,31,26,0.4)]">
          <div className="mb-[18px] flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
              미리보기 · ON FIELD
            </span>
            <span className="rounded-full bg-amber-soft px-2.5 py-0.5 text-[10px] font-semibold text-amber-deep">
              DAY 1
            </span>
          </div>
          <p
            className={`m-0 mb-[18px] min-h-[62px] font-serif text-[23px] font-medium leading-[1.35] break-keep ${
              summary.trim() ? 'text-cream' : 'text-cream-faint'
            }`}
          >
            {previewSummary}
          </p>
          <div className="flex flex-wrap gap-[7px]">
            {keyword.trim() && (
              <span className="rounded-full bg-paper-2 px-2.5 py-1 text-xs text-cream-mute">
                {keyword.trim()}
              </span>
            )}
            {tag && (
              <span className="rounded-full bg-amber-soft px-2.5 py-1 text-xs font-medium text-amber-deep">
                {tag}
              </span>
            )}
          </div>
          <p className="mt-[18px] m-0 text-[11px] text-cream-faint">노출 1 / 3</p>
        </div>
      </div>

      <div className="mt-12 flex items-center justify-between gap-4 border-t border-edge pt-7">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSkip}
            className="text-[13px] text-cream-faint transition-colors hover:text-cream"
          >
            지금은 건너뛰기
          </button>
          {inline && (
            <span role="alert" className="text-[13px] text-amber-deep">
              · {inline}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="group inline-flex items-center gap-3 rounded-full border-0 bg-cream py-3.5 pl-7 pr-4 text-[15px] font-medium text-canvas transition-transform duration-[var(--dur-fast)] ease-[var(--ease-spring)] hover:translate-x-[3px] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {create.isPending ? '카드 펴는 중…' : '카드 펴기'}
          <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-amber text-white">
            <Icon name="solar:arrow-right-linear" width={16} height={16} />
          </span>
        </button>
      </div>
    </div>
  );
}
