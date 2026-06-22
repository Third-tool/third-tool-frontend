import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog } from '@/components/Dialog';
import { UnderlineInput } from '@/components/UnderlineInput';
import { InvertButton } from '@/components/InvertButton';
import { Icon } from '@/components/Icon';
import { ApiError } from '@/lib/api/client';
import { track } from '@/lib/analytics/track';
import { suggestAxes } from '@/lib/api/endpoints/facade';
import { useAddAxis } from '../hooks/useAddAxis';
import { useSuggestionRateLimit } from '../hooks/useSuggestionRateLimit';

interface Props {
  open: boolean;
  onClose: () => void;
}

type Mode = 'ai' | 'direct';

export function AddAxisDialog({ open, onClose }: Props) {
  const [mode, setMode] = useState<Mode>('ai');
  const [direct, setDirect] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [inline, setInline] = useState<string | null>(null);
  const add = useAddAxis();

  const suggestions = useQuery({
    queryKey: ['axis-suggestions', 'map'],
    queryFn: () => suggestAxes(5),
    enabled: open && mode === 'ai',
    retry: false,
    staleTime: 0,
  });

  const requestedRef = useRef(false);
  useEffect(() => {
    if (open && mode === 'ai' && !requestedRef.current) {
      requestedRef.current = true;
      track('axis_suggestion_requested');
    }
    if (!open) requestedRef.current = false;
  }, [open, mode]);

  const rate = useSuggestionRateLimit('axis', suggestions.error);

  const reset = () => {
    setMode('ai');
    setDirect('');
    setSelected(null);
    setInline(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const onSuccess = () => {
    close();
  };

  const onError = (err: unknown) => {
    if (err instanceof ApiError) {
      if (err.code === 'LEARNING_AXIS_DUPLICATE_NAME')
        setInline('같은 이름의 축이 이미 있어요. 다른 이름으로 이어가볼까요?');
      else if (err.code === 'LEARNING_AXIS_NAME_BLANK') setInline('축 이름을 적어주세요');
      else setInline('지금 추가가 어려워요. 잠시 후 다시 이어가주세요');
    } else {
      setInline('지금 추가가 어려워요. 잠시 후 다시 이어가주세요');
    }
  };

  const submitDirect = () => {
    setInline(null);
    add.mutate(direct.trim(), { onSuccess, onError });
  };
  const submitAi = () => {
    if (!selected) return;
    setInline(null);
    track('axis_suggestion_selected');
    add.mutate(selected, { onSuccess, onError });
  };

  const aiAvailable = suggestions.data?.suggestionsAvailable === true;
  const isGapAware = suggestions.data?.provider_context === 'gap_aware';

  return (
    <Dialog open={open} onClose={close} title="새 축 추가">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2 border-b border-edge">
          {(['ai', 'direct'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`-mb-px border-b-2 px-3 py-2 font-mono text-[11px] uppercase tracking-[var(--tracking-mono)] transition-colors ${
                mode === m
                  ? 'border-cream text-cream'
                  : 'border-transparent text-cream-faint hover:text-cream-mute'
              }`}
            >
              {m === 'ai' ? 'AI 제안' : '직접 입력'}
            </button>
          ))}
        </div>

        {mode === 'ai' && (
          <div className="flex flex-col gap-3">
            {suggestions.isLoading && (
              <p className="font-mono text-[11px] uppercase tracking-[var(--tracking-mono)] text-cream-faint">
                제안을 가져오는 중…
              </p>
            )}
            {rate.active && (
              <div className="rounded-sm border border-cream/30 bg-glass px-3 py-2 text-xs text-cream-mute">
                지금은 잠시 쉬어가요.{' '}
                {rate.canRetry ? (
                  <button
                    type="button"
                    onClick={() => suggestions.refetch()}
                    className="font-mono uppercase tracking-[var(--tracking-mono)] text-cream underline-offset-2 hover:underline"
                  >
                    다시 시도
                  </button>
                ) : (
                  <span className="font-mono tracking-[var(--tracking-mono)] text-cream">
                    {rate.secondsLeft}s 후 다시 시도 가능
                  </span>
                )}
              </div>
            )}
            {!suggestions.isLoading && !rate.active && !aiAvailable && (
              <div className="rounded-sm border border-edge bg-glass px-3 py-2 font-mono text-xs text-cream-mute">
                지금 제안을 가져올 수 없어요. 직접 입력으로 이어가주세요.
              </div>
            )}
            {aiAvailable && isGapAware && (
              <span className="font-mono text-[10px] uppercase tracking-[var(--tracking-mono)] text-cream-mute">
                · 맞춤 제안
              </span>
            )}
            {aiAvailable &&
              suggestions.data!.suggestions.map((s, i) => {
                const isSel = selected === s.description;
                return (
                  <button
                    key={s.description}
                    type="button"
                    onClick={() => setSelected(s.description)}
                    className={`flex flex-col gap-1 rounded-sm border px-4 py-3 text-left transition-all ${
                      isSel ? 'border-cream bg-glass' : 'border-edge hover:border-cream/40 hover:bg-glass'
                    }`}
                  >
                    <span className="font-mono text-[10px] uppercase tracking-[var(--tracking-mono)] text-cream-faint">
                      0{i + 1}
                    </span>
                    <span className="font-display text-lg text-cream">{s.description}</span>
                    <span className="text-sm text-cream-mute">{s.rationale}</span>
                  </button>
                );
              })}
          </div>
        )}

        {mode === 'direct' && (
          <UnderlineInput
            value={direct}
            onChange={(e) => setDirect(e.target.value)}
            placeholder="예: 데이터 모델링"
            aria-label="axis name"
            autoFocus
          />
        )}

        <div className="flex items-center justify-between gap-3 border-t border-edge pt-4">
          <p
            role="alert"
            className="font-mono text-[11px] uppercase tracking-[var(--tracking-mono)] text-red-300"
          >
            {inline ?? ' '}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={close}
              className="font-mono text-[11px] uppercase tracking-[var(--tracking-mono)] text-cream-mute transition-colors hover:text-cream"
            >
              취소
            </button>
            <InvertButton
              size="md"
              onClick={mode === 'ai' ? submitAi : submitDirect}
              disabled={
                add.isPending ||
                (mode === 'ai' ? !selected : direct.trim().length === 0)
              }
              rightIcon={<Icon name="solar:arrow-right-linear" width={16} height={16} />}
            >
              {add.isPending ? 'Saving…' : '추가'}
            </InvertButton>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
