import { useId, useState, type KeyboardEvent } from 'react';
import { TagChip } from '@/components/TagChip';

export const MAX_CONCEPTS = 5;
export const MAX_CONCEPT_LENGTH = 100;

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
  label?: string;
  placeholder?: string;
}

export function ConceptsInput({
  value,
  onChange,
  label = '컨셉',
  placeholder = '입력 후 Enter (최대 5개)',
}: Props) {
  const [draft, setDraft] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const id = useId();
  const isAtMax = value.length >= MAX_CONCEPTS;

  const commit = () => {
    const v = draft.trim();
    if (!v) return;
    if (v.length > MAX_CONCEPT_LENGTH) {
      setNotice(`컨셉은 ${MAX_CONCEPT_LENGTH}자를 넘을 수 없어요`);
      return;
    }
    if (value.includes(v)) {
      setNotice('이미 추가된 컨셉이에요');
      setDraft('');
      return;
    }
    if (isAtMax) {
      setNotice(`컨셉은 최대 ${MAX_CONCEPTS}개까지 추가할 수 있어요`);
      return;
    }
    setNotice(null);
    onChange([...value, v]);
    setDraft('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    }
    if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      setNotice(null);
      onChange(value.slice(0, -1));
    }
  };

  const remove = (v: string) => {
    setNotice(null);
    onChange(value.filter((x) => x !== v));
  };

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm text-cream-mute">
        {label}
      </label>
      <div
        role="list"
        aria-label={`${label} 목록`}
        className="flex flex-wrap items-center gap-2 rounded-2xl bg-glass px-3 py-2 ring-1 ring-edge focus-within:ring-cream"
      >
        {value.map((v) => (
          <span key={v} role="listitem">
            <TagChip label={v} onRemove={() => remove(v)} />
          </span>
        ))}
        {!isAtMax && (
          <input
            id={id}
            aria-label={label}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            maxLength={MAX_CONCEPT_LENGTH}
            className="flex-1 min-w-[6rem] bg-transparent text-sm text-cream outline-none placeholder:text-cream-faint"
          />
        )}
      </div>
      <p
        role="status"
        aria-live="polite"
        className={`text-xs ${notice ? 'text-amber' : 'text-cream-faint'}`}
      >
        {notice ?? `${value.length} / ${MAX_CONCEPTS}`}
      </p>
    </div>
  );
}
