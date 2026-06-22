import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@/components/Icon';
import { ApiError } from '@/lib/api/client';
import { track } from '@/lib/analytics/track';
import { createConcept } from '@/lib/api/endpoints/facade';
import { LEARNING_FACADE_KEY } from '@/features/auth/hooks/useLearningFacade';

const SUGGESTIONS = [
  '백엔드 개발자',
  '프로덕트 디자이너',
  '데이터 분석가',
  '결제·정산 도메인을 저술하는 백엔드 엔지니어',
];

interface Props {
  onComplete: () => void;
}

export function ConceptStep({ onComplete }: Props) {
  const [value, setValue] = useState('');
  const [inline, setInline] = useState<string | null>(null);
  const qc = useQueryClient();

  const save = useMutation({
    mutationFn: (concept: string) => createConcept(concept),
    onSuccess: () => {
      track('concept_saved');
      qc.invalidateQueries({ queryKey: LEARNING_FACADE_KEY });
      onComplete();
    },
    onError: (err) => {
      if (err instanceof ApiError && err.code === 'LF_CONCEPT_REQUIRED') {
        setInline('한 줄로 적어주세요');
      } else {
        setInline('지금 저장이 어려워요. 잠시 후 다시 이어가주세요');
      }
    },
  });

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setInline(null);
    track('concept_submitted');
    save.mutate(value.trim());
  };

  const canSubmit = value.trim().length > 0 && !save.isPending;

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col"
      style={{ animation: 'fadeInUp .4s var(--ease-spring) both' }}
    >
      <div className="mb-[22px] flex items-center gap-3">
        <span className="font-serif text-lg italic text-amber">01</span>
        <span className="text-xs uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
          Your Concept
        </span>
      </div>

      <h1 className="m-0 mb-[18px] font-serif text-[46px] font-medium leading-[1.1] tracking-[-0.02em] text-cream break-keep">
        당신을 한 줄로 <span className="italic text-amber">적어주세요.</span>
      </h1>

      <p className="m-0 mb-10 max-w-[52ch] text-[17px] leading-[1.7] text-cream-mute break-keep">
        정체성이 아니라 지금의 방향이에요. 마음이 바뀌면 언제든 다시 적어도 괜찮습니다.
      </p>

      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="예: 결제·정산 도메인을 저술하는 백엔드 엔지니어"
        autoFocus
        aria-label="concept"
        className="mb-8 w-full border-0 border-b-[1.5px] border-solid border-edge-strong bg-transparent pb-4 font-serif text-[28px] font-medium tracking-[-0.01em] text-cream caret-amber outline-none placeholder:text-cream-faint focus:border-amber-line"
      />

      <div className="mb-12">
        <span className="mb-3.5 block text-[11px] uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
          이런 방향은 어때요
        </span>
        <div className="flex flex-wrap gap-2.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setValue(s)}
              className="rounded-full border border-edge-strong bg-transparent px-4 py-2.5 text-[13.5px] text-cream-mute transition-all duration-[var(--dur-fast)] ease-[var(--ease-spring)] hover:border-amber-line hover:text-amber"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-edge pt-7">
        <p
          role="alert"
          className={`text-[13px] ${inline ? 'text-amber-deep' : 'text-cream-faint'}`}
        >
          {inline ?? '먼저 방향부터'}
        </p>
        <button
          type="submit"
          disabled={!canSubmit}
          className="group inline-flex items-center gap-3 rounded-full border-0 bg-cream py-3.5 pl-7 pr-4 text-[15px] font-medium text-canvas transition-transform duration-[var(--dur-fast)] ease-[var(--ease-spring)] hover:translate-x-[3px] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {save.isPending ? '저장 중…' : '다음'}
          <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-amber text-white">
            <Icon name="solar:arrow-right-linear" width={16} height={16} />
          </span>
        </button>
      </div>
    </form>
  );
}
