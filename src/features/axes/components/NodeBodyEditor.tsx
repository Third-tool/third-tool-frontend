import { useId, type ChangeEvent, type KeyboardEvent } from 'react';

// product-learning-tower Story 3-11 (신설 · 2026-07-02).
// Roadmap 노드 · Selection 노드 body(ASCII 트리) 편집기 공용 컴포넌트.
// - monospace font (트리 문자 정렬 유지)
// - Tab 키 4-space indent 삽입 (기본 focus 이동 방지)
// - maxLength 2000 + 문자 카운터

export const MAX_NODE_BODY = 2000;
const INDENT = '    ';

interface Props {
  value: string;
  onChange: (next: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
  maxLength?: number;
}

export function NodeBodyEditor({
  value,
  onChange,
  label = '본문 (ASCII 트리)',
  placeholder = '├── 1-1. 정의와 본질\n│       모델 + 하네스 — ...\n├── 1-2. 파라다임 전환\n│       ...',
  disabled = false,
  rows = 10,
  maxLength = MAX_NODE_BODY,
}: Props) {
  const id = useId();

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) return; // Shift+Tab 은 focus 이동 유지 (접근성)
    e.preventDefault();
    const el = e.currentTarget;
    const { selectionStart, selectionEnd } = el;
    const next = value.slice(0, selectionStart) + INDENT + value.slice(selectionEnd);
    if (next.length > maxLength) return;
    onChange(next);
    // 커서 위치 유지 (React state 반영 후 브라우저 rendering 뒤 caret 재설정)
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = selectionStart + INDENT.length;
    });
  };

  const onTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const isNearMax = value.length >= maxLength - 100;
  const isAtMax = value.length >= maxLength;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm text-cream-mute">
        {label}
      </label>
      <textarea
        id={id}
        aria-label={label}
        value={value}
        onChange={onTextChange}
        onKeyDown={onKeyDown}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        placeholder={placeholder}
        spellCheck={false}
        className="rounded-2xl bg-glass px-3 py-2 font-mono text-sm text-cream outline-none ring-1 ring-edge focus:ring-cream placeholder:text-cream-faint"
        style={{ fontFamily: "'Menlo', 'Consolas', 'monospace'" }}
      />
      <p
        role="status"
        aria-live="polite"
        className={`text-xs ${isAtMax ? 'text-amber' : isNearMax ? 'text-amber/70' : 'text-cream-faint'}`}
      >
        <span aria-label={`본문 ${value.length}자 · 최대 ${maxLength}`}>
          {value.length} / {maxLength}
        </span>
        <span className="ml-2 text-cream-faint">Tab 키로 들여쓰기</span>
      </p>
    </div>
  );
}
