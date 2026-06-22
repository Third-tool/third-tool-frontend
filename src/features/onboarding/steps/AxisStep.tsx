import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@/components/Icon';
import { ApiError } from '@/lib/api/client';
import { track } from '@/lib/analytics/track';
import { createAxis, suggestAxes } from '@/lib/api/endpoints/facade';
import { LEARNING_FACADE_KEY, useLearningFacade } from '@/features/auth/hooks/useLearningFacade';
import { useSuggestionRateLimit } from '@/features/map/hooks/useSuggestionRateLimit';

type Mode = 'ai' | 'direct';

interface Props {
  onComplete: () => void;
  onSkip: () => void;
}

export function AxisStep({ onComplete, onSkip }: Props) {
  const [mode, setMode] = useState<Mode>('ai');
  const [direct, setDirect] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [inline, setInline] = useState<string | null>(null);
  const facade = useLearningFacade();
  const qc = useQueryClient();

  const suggestions = useQuery({
    queryKey: ['axis-suggestions'],
    queryFn: () => suggestAxes(5),
    enabled: mode === 'ai',
    retry: false,
    staleTime: 0,
  });

  const requestedRef = useRef(false);
  useEffect(() => {
    if (mode === 'ai' && !requestedRef.current) {
      requestedRef.current = true;
      track('axis_suggestion_requested', { surface: 'onboarding' });
    }
    if (mode !== 'ai') requestedRef.current = false;
  }, [mode]);

  const rate = useSuggestionRateLimit('axis', suggestions.error);

  const add = useMutation({
    mutationFn: (name: string) => createAxis(name),
    onSuccess: (_data, name) => {
      track('first_axis_created', { method: mode, name });
      qc.invalidateQueries({ queryKey: LEARNING_FACADE_KEY });
      onComplete();
    },
    onError: (err) => {
      const code = err instanceof ApiError ? err.code : 'UNKNOWN';
      track('first_axis_failed', { method: mode, code });
      if (err instanceof ApiError) {
        if (err.code === 'LEARNING_AXIS_DUPLICATE_NAME')
          setInline('같은 이름의 축이 이미 있어요. 다른 이름으로 이어가볼까요?');
        else if (err.code === 'LEARNING_AXIS_NAME_BLANK') setInline('축 이름을 적어주세요');
        else if (err.code === 'AUTH_RATE_LIMIT' || err.status === 429)
          setInline('잠시 후 다시 이어가주세요 (분당 10회까지 가능)');
        else setInline('지금 추가가 어려워요. 잠시 후 다시 이어가주세요');
      } else {
        setInline('지금 추가가 어려워요. 잠시 후 다시 이어가주세요');
      }
    },
  });

  const conceptLabel = facade.data?.concept ?? '당신';

  const submitDirect = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setInline(null);
    add.mutate(direct.trim());
  };

  const submitAi = () => {
    if (!selected) return;
    setInline(null);
    track('axis_suggestion_selected', { surface: 'onboarding' });
    add.mutate(selected);
  };

  const aiAvailable = suggestions.data?.suggestionsAvailable === true;
  const canSubmit = mode === 'ai' ? selected !== null : direct.trim().length > 0;

  return (
    <div
      className="flex flex-col"
      style={{ animation: 'fadeInUp .4s var(--ease-spring) both' }}
    >
      <div className="mb-[22px] flex items-center gap-3">
        <span className="font-serif text-lg italic text-amber">02</span>
        <span className="text-xs uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
          First Axis
        </span>
      </div>

      <h1 className="m-0 mb-[18px] font-serif text-[42px] font-medium leading-[1.12] tracking-[-0.02em] text-cream break-keep">
        <span className="text-cream-faint">"{conceptLabel}"</span>을 위한{' '}
        <span className="italic text-amber">첫 영역.</span>
      </h1>

      <p className="m-0 mb-[30px] max-w-[52ch] text-[17px] leading-[1.7] text-cream-mute break-keep">
        학습을 어디서부터 풀어볼지 정해요. 나중에 얼마든 추가할 수 있어요.
      </p>

      <div className="mb-[26px] flex w-max gap-1 rounded-full border border-edge bg-paper-2 p-1">
        {(['ai', 'direct'] as Mode[]).map((m) => {
          const active = mode === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-full border-0 px-4 py-2 text-[13px] font-medium transition-all duration-[var(--dur-fast)] ease-[var(--ease-spring)] ${
                active
                  ? 'bg-surface text-cream shadow-[0_1px_3px_rgba(0,0,0,0.1)]'
                  : 'bg-transparent text-cream-faint hover:text-cream'
              }`}
            >
              {m === 'ai' ? 'AI 제안 받기' : '직접 입력'}
            </button>
          );
        })}
      </div>

      {mode === 'ai' && (
        <div className="flex flex-col gap-3">
          {suggestions.isLoading && (
            <p className="text-xs text-cream-faint">제안을 가져오는 중…</p>
          )}
          {rate.active && (
            <div className="rounded-[16px] border border-amber-line bg-amber-soft px-5 py-3 text-sm text-cream-mute">
              지금은 잠시 쉬어가요.{' '}
              {rate.canRetry ? (
                <button
                  type="button"
                  onClick={() => suggestions.refetch()}
                  className="font-semibold text-amber-deep hover:underline"
                >
                  다시 시도
                </button>
              ) : (
                <span className="font-medium text-amber-deep">
                  {rate.secondsLeft}s 후 다시 시도 가능
                </span>
              )}
            </div>
          )}
          {!suggestions.isLoading && !rate.active && !aiAvailable && (
            <div className="rounded-[16px] border border-edge bg-surface px-5 py-3 text-sm text-cream-mute">
              지금 제안을 가져올 수 없어요. 직접 입력으로 이어가주세요.
            </div>
          )}
          {aiAvailable &&
            suggestions.data!.suggestions.map((s) => {
              const isSel = selected === s.description;
              return (
                <button
                  key={s.description}
                  type="button"
                  onClick={() => setSelected(s.description)}
                  className={`rounded-[16px] border bg-surface p-5 text-left transition-all duration-[var(--dur-fast)] ease-[var(--ease-spring)] ${
                    isSel ? 'border-amber bg-amber-soft' : 'border-edge hover:border-amber-line'
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="m-0 font-serif text-[21px] font-medium text-cream">
                      {s.description}
                    </h3>
                    {isSel && (
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-amber text-white">
                        <Icon name="solar:check-bold" width={14} height={14} />
                      </span>
                    )}
                  </div>
                  <p className="m-0 text-sm leading-[1.6] text-cream-mute break-keep">
                    {s.rationale}
                  </p>
                </button>
              );
            })}
        </div>
      )}

      {mode === 'direct' && (
        <form onSubmit={submitDirect}>
          <input
            value={direct}
            onChange={(e) => setDirect(e.target.value)}
            placeholder="예: 결제·정산 도메인"
            aria-label="axis name"
            autoFocus
            className="w-full border-0 border-b-[1.5px] border-solid border-edge-strong bg-transparent pb-4 font-serif text-[26px] font-medium text-cream caret-amber outline-none placeholder:text-cream-faint focus:border-amber-line"
          />
        </form>
      )}

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
          onClick={mode === 'ai' ? submitAi : () => add.mutate(direct.trim())}
          disabled={!canSubmit || add.isPending}
          className="group inline-flex items-center gap-3 rounded-full border-0 bg-cream py-3.5 pl-7 pr-4 text-[15px] font-medium text-canvas transition-transform duration-[var(--dur-fast)] ease-[var(--ease-spring)] hover:translate-x-[3px] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {add.isPending ? '저장 중…' : '이 축으로'}
          <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-amber text-white">
            <Icon name="solar:arrow-right-linear" width={16} height={16} />
          </span>
        </button>
      </div>
    </div>
  );
}
