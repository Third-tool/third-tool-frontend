import { useId, useState, type KeyboardEvent } from 'react';
import { TagChip } from '@/components/TagChip';

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
  label: string;
  placeholder?: string;
}

export function KeywordInput({ value, onChange, label, placeholder }: Props) {
  const [draft, setDraft] = useState('');
  const id = useId();

  const commit = () => {
    const v = draft.trim();
    if (!v) return;
    if (value.includes(v)) {
      setDraft('');
      return;
    }
    onChange([...value, v]);
    setDraft('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    }
    if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm text-cream-mute">
        {label}
      </label>
      <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-glass px-3 py-2 ring-1 ring-edge focus-within:ring-amber">
        {value.map((v) => (
          <TagChip key={v} label={v} onRemove={() => onChange(value.filter((x) => x !== v))} />
        ))}
        <input
          id={id}
          aria-label={label}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder ?? '입력 후 Enter'}
          className="flex-1 min-w-[6rem] bg-transparent text-sm text-cream outline-none placeholder:text-cream-faint"
        />
      </div>
    </div>
  );
}
