import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog } from '@/components/Dialog';
import { UnderlineInput } from '@/components/UnderlineInput';
import { InvertButton } from '@/components/InvertButton';
import { Icon } from '@/components/Icon';
import { ApiError } from '@/lib/api/client';
import { track } from '@/lib/analytics/track';
import { suggestTopics } from '@/lib/api/endpoints/facade';
import { useAddTopics } from '../hooks/useAddTopics';
import { useSuggestionRateLimit } from '../hooks/useSuggestionRateLimit';

interface Props {
  open: boolean;
  axisId: string;
  axisName: string;
  onClose: () => void;
}

type Mode = 'ai' | 'direct';

export function AddTopicDialog({ open, axisId, axisName, onClose }: Props) {
  const [mode, setMode] = useState<Mode>('ai');
  const [direct, setDirect] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [inline, setInline] = useState<string | null>(null);
  const add = useAddTopics();

  const suggestions = useQuery({
    queryKey: ['topic-suggestions', axisId],
    queryFn: () => suggestTopics(axisId, 5),
    enabled: open && mode === 'ai',
    retry: false,
    staleTime: 0,
  });

  const requestedRef = useRef(false);
  useEffect(() => {
    if (open && mode === 'ai' && !requestedRef.current) {
      requestedRef.current = true;
      track('topic_suggestion_requested', { axisId });
    }
    if (!open) requestedRef.current = false;
  }, [open, mode, axisId]);

  const rate = useSuggestionRateLimit('topic', suggestions.error);

  const reset = () => {
    setMode('ai');
    setDirect('');
    setPicked(new Set());
    setInline(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const toggle = (name: string) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const onError = (err: unknown) => {
    if (err instanceof ApiError) {
      if (err.code === 'AXIS_TOPIC_DUPLICATE_NAME') setInline(err.message);
      else if (err.code === 'AXIS_TOPIC_NAME_BLANK') setInline('주제 이름을 적어주세요');
      else setInline('지금 추가가 어려워요. 잠시 후 다시 이어가주세요');
    } else {
      setInline('지금 추가가 어려워요. 잠시 후 다시 이어가주세요');
    }
  };

  const submit = () => {
    setInline(null);
    const names = mode === 'ai' ? [...picked] : [direct.trim()].filter(Boolean);
    if (names.length === 0) return;
    if (mode === 'ai') {
      track('topic_suggestion_selected_count', { axisId, count: names.length });
    }
    add.mutate({ axisId, names }, { onSuccess: close, onError });
  };

  const aiAvailable = suggestions.data?.suggestionsAvailable === true;
  const isGapAware = suggestions.data?.provider_context === 'gap_aware';
  const canSubmit = mode === 'ai' ? picked.size > 0 : direct.trim().length > 0;

  return (
    <Dialog open={open} onClose={close} title={`${axisName} · 주제 추가`}>
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
              {m === 'ai' ? 'AI 제안 (다중 선택)' : '직접 입력'}
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
                const checked = picked.has(s.description);
                return (
                  <button
                    key={s.description}
                    type="button"
                    onClick={() => toggle(s.description)}
                    className={`flex items-start gap-3 rounded-sm border px-4 py-3 text-left transition-all ${
                      checked ? 'border-cream bg-glass' : 'border-edge hover:border-cream/40 hover:bg-glass'
                    }`}
                  >
                    <span
                      className={`mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-sm border ${
                        checked ? 'border-cream bg-cream text-canvas' : 'border-edge'
                      }`}
                    >
                      {checked && <Icon name="solar:check-bold" width={12} height={12} />}
                    </span>
                    <span className="flex flex-col gap-1">
                      <span className="font-mono text-[10px] uppercase tracking-[var(--tracking-mono)] text-cream-faint">
                        0{i + 1}
                      </span>
                      <span className="font-display text-lg text-cream">{s.description}</span>
                      <span className="text-sm text-cream-mute">{s.rationale}</span>
                    </span>
                  </button>
                );
              })}
          </div>
        )}

        {mode === 'direct' && (
          <UnderlineInput
            value={direct}
            onChange={(e) => setDirect(e.target.value)}
            placeholder="예: 도메인 중심 설계"
            aria-label="topic name"
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
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={close}
              className="font-mono text-[11px] uppercase tracking-[var(--tracking-mono)] text-cream-mute transition-colors hover:text-cream"
            >
              취소
            </button>
            <InvertButton
              size="md"
              onClick={submit}
              disabled={add.isPending || !canSubmit}
              rightIcon={<Icon name="solar:arrow-right-linear" width={16} height={16} />}
            >
              {add.isPending
                ? 'Saving…'
                : mode === 'ai'
                  ? `선택한 주제 추가 (${picked.size})`
                  : '주제 추가'}
            </InvertButton>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
