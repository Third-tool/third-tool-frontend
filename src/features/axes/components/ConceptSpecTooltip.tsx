import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { Button } from '@/components/Button';

// product-learning-tower Story 3-12 (신설 · 2026-07-02).
// Roadmap/Selection 편집 진입 시 개념 안내 툴팁 (이슈 #19 · ADR023 어휘 정합).
// - 자동 open: sessionStorage 미기록 시 첫 마운트에서 open
// - 수동 open: 정보 아이콘 클릭 → sessionStorage 무시하고 재open
// - 닫기: [이해했어요] · Esc

export type ConceptSpecMode = 'roadmap' | 'selection';

interface CopyEntry {
  title: string;
  body: string;
}

const COPY: Record<ConceptSpecMode, CopyEntry> = {
  roadmap: {
    title: '로드맵 = 수렴 (헌법)',
    body: '축이 다루는 개념의 오래가는 원리·판단 프레임. 새 사례에도 흔들리지 않는 뼈대.',
  },
  selection: {
    title: 'Selection = 발산 (판례)',
    body: '축의 원리를 특정 상황·시대에 적용한 사례. 시점별로 여러 버전을 두고 관리.',
  },
};

const STORAGE_PREFIX = 'concept-spec-shown-';

interface Props {
  mode: ConceptSpecMode;
  // 테스트/스토리북 편의 · 강제 open (autoOpen 로직 우회)
  defaultOpen?: boolean;
}

export function ConceptSpecTooltip({ mode, defaultOpen = false }: Props) {
  const [open, setOpen] = useState<boolean>(() => {
    if (defaultOpen) return true;
    if (typeof window === 'undefined') return false;
    try {
      return window.sessionStorage.getItem(STORAGE_PREFIX + mode) === null;
    } catch {
      return true;
    }
  });
  const dialogRef = useRef<HTMLDivElement>(null);
  const headingId = useId();
  const bodyId = useId();

  useEffect(() => {
    if (open && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [open]);

  const closeAndPersist = () => {
    setOpen(false);
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.setItem(STORAGE_PREFIX + mode, '1');
      } catch {
        // sessionStorage 접근 실패 (SSR · private mode) — 무시.
      }
    }
  };

  const reopen = () => {
    setOpen(true);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape' || e.key === 'Enter') {
      e.preventDefault();
      closeAndPersist();
    }
  };

  const copy = COPY[mode];

  return (
    <>
      <button
        type="button"
        onClick={reopen}
        aria-label={`${copy.title} 안내 열기`}
        className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-glass text-xs text-cream-mute ring-1 ring-edge transition-colors hover:bg-paper-2 hover:text-cream"
      >
        ?
      </button>

      {open && (
        <div
          ref={dialogRef}
          role="tooltip"
          aria-labelledby={headingId}
          aria-describedby={bodyId}
          tabIndex={-1}
          onKeyDown={onKeyDown}
          className="mt-3 flex flex-col gap-3 rounded-2xl border border-edge bg-surface px-4 py-4 outline-none"
        >
          <h3 id={headingId} className="text-sm font-semibold text-cream">
            {copy.title}
          </h3>
          <p id={bodyId} className="text-sm text-cream-mute">
            {copy.body}
          </p>
          <div className="flex justify-end">
            <Button variant="primary" type="button" onClick={closeAndPersist}>
              이해했어요
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
