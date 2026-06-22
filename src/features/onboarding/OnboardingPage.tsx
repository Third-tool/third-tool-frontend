import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@/components/Icon';
import { ApiError } from '@/lib/api/client';
import { track } from '@/lib/analytics/track';
import { createAxis, createConcept } from '@/lib/api/endpoints/facade';
import { LEARNING_FACADE_KEY } from '@/features/auth/hooks/useLearningFacade';

type Step = 0 | 1 | 2 | 3 | 4 | 5;

const CONCEPT_OPTIONS: Array<{ label: string; sub: string }> = [
  { label: '문제를 해결하는 백엔드 개발자', sub: '구현으로 끝까지 밀어붙이는 힘' },
  { label: '문제를 구조화하는 기획자', sub: '무엇을 왜 만들지 정의하는 힘' },
  { label: 'story를 드러내는 시나리오 작가', sub: '흐름과 설득을 설계하는 힘' },
  { label: '데이터로 말하는 분석가', sub: '근거로 방향을 잡는 힘' },
  { label: '시스템을 지키는 운영 엔지니어', sub: '무너지지 않게 떠받치는 힘' },
  { label: '사용자를 읽는 디자이너', sub: '쓰는 사람의 맥락을 보는 힘' },
];

const BRIDGE_POOL = [
  '문제 정의',
  '사용자 시나리오 설계',
  '도메인 모델링',
  '정보 구조',
  '메시지·문서화',
  '시스템 설계',
  '관측성',
  '실험·검증',
  '프로토타이핑',
];

const REASON_SEEDS = [
  '구현만 되는 게 아니라, 문제를 정확히 정의하고 싶어서',
  '사용자가 이해하는 흐름까지 만들고 싶어서',
  '기술·기획·설명이 끊기지 않는 사람이 되고 싶어서',
];

const OUTCOME_SEEDS = [
  '더 설득력 있고 실행력 있는 제품',
  '기술과 사용자 맥락이 연결된 시스템',
  '오래 살아남는 제품 경험',
];

function buildStatement(concepts: string[], outcome: string): string {
  const out = outcome.trim() || '만들고 싶은 결과물';
  let lead: string;
  if (concepts.length === 0) lead = '나는 내 능력으로,';
  else if (concepts.length === 1) lead = `나는 ${concepts[0]}로서,`;
  else lead = `나는 ${concepts.join(', ')}를 함께 가져가며, 그 조합으로`;
  return `${lead} ${out} — 그런 결과물을 만들어가는 사람.`;
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [step, setStep] = useState<Step>(0);
  const [concepts, setConcepts] = useState<string[]>([]);
  const [conceptDraft, setConceptDraft] = useState('');
  const [reason, setReason] = useState('');
  const [outcome, setOutcome] = useState('');
  const [bridge, setBridge] = useState('');
  const [bridgeDraft, setBridgeDraft] = useState('');
  const [statementOverride, setStatementOverride] = useState<string | null>(null);
  const [inline, setInline] = useState<string | null>(null);

  const openedRef = useRef(false);
  useEffect(() => {
    if (openedRef.current) return;
    openedRef.current = true;
    track('onboarding_opened');
  }, []);

  const multi = concepts.length >= 2;
  const assembled = buildStatement(concepts, outcome);
  const statementText = statementOverride ?? assembled;

  const go = (next: Step) => {
    setInline(null);
    setStep(next);
  };

  const toggleConcept = (label: string) => {
    setConcepts((s) => {
      if (s.includes(label)) return s.filter((c) => c !== label);
      if (s.length >= 3) return s;
      return [...s, label];
    });
  };

  const addCustomConcept = () => {
    const v = conceptDraft.trim();
    if (!v) return;
    setConcepts((s) =>
      s.includes(v) || s.length >= 3 ? s : [...s, v],
    );
    setConceptDraft('');
  };

  const pickBridge = (value: string) => {
    setBridge(value);
    setBridgeDraft('');
  };

  const save = useMutation({
    mutationFn: async (payload: { statement: string; bridge: string; method: 'declare' | 'skip' }) => {
      await createConcept(payload.statement);
      if (payload.bridge.trim()) await createAxis(payload.bridge.trim());
      return payload;
    },
    onSuccess: (payload) => {
      qc.invalidateQueries({ queryKey: LEARNING_FACADE_KEY });
      track('onboarding_completed', { method: payload.method, conceptCount: concepts.length });
      navigate('/home', { replace: true });
    },
    onError: (err) => {
      const code = err instanceof ApiError ? err.code : 'UNKNOWN';
      track('onboarding_failed', { code });
      setInline(
        err instanceof ApiError
          ? err.message
          : '지금 저장이 어려워요. 잠시 후 다시 이어가주세요',
      );
    },
  });

  const submit = (method: 'declare' | 'skip') => {
    setInline(null);
    save.mutate({
      statement: statementText.trim(),
      bridge: bridge || bridgeDraft.trim(),
      method,
    });
  };

  const onSkipTop = () => {
    if (concepts.length === 0 && !outcome.trim()) {
      // user hasn't entered anything → jump to declare; on declare submit they can write directly
      go(5);
      return;
    }
    go(5);
  };

  const nextDisabled =
    (step === 1 && concepts.length === 0) ||
    (step === 3 && !outcome.trim()) ||
    (step === 4 && !bridge.trim() && !bridgeDraft.trim());

  const goNext = () => {
    if (nextDisabled) return;
    if (step === 4) {
      if (!bridge.trim() && bridgeDraft.trim()) pickBridge(bridgeDraft.trim());
      go(5);
      return;
    }
    go((step + 1) as Step);
  };

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-canvas text-cream">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(var(--color-edge) 1px, transparent 1px)',
          backgroundSize: '34px 34px',
          WebkitMaskImage:
            'radial-gradient(ellipse 64% 56% at 50% 32%, #000 48%, transparent 100%)',
          maskImage:
            'radial-gradient(ellipse 64% 56% at 50% 32%, #000 48%, transparent 100%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[640px] w-[640px] -translate-x-1/2 rounded-full bg-amber-soft"
        style={{ filter: 'blur(150px)', animation: 'obBreath 11s ease-in-out infinite' }}
      />
      <style>{`
        @keyframes obBreath { 0%,100% { transform: translateX(-50%) scale(1); opacity: 0.55; } 50% { transform: translateX(-50%) scale(1.12); opacity: 0.78; } }
        @keyframes obStep { from { opacity: 0; transform: translateY(16px); filter: blur(3px); } to { opacity: 1; transform: none; filter: none; } }
        @keyframes obPulse { 0%,100% { opacity: 0.4; } 50% { opacity: 0.9; } }
        @keyframes obChip { from { opacity: 0; transform: translateY(6px) scale(0.96); } to { opacity: 1; transform: none; } }
      `}</style>

      {/* top bar */}
      <div className="relative z-[3] mx-auto flex w-full max-w-[1100px] items-center justify-between px-7 py-6">
        <Link to="/" className="flex items-center gap-2.5 no-underline">
          <span className="grid h-[26px] w-[26px] place-items-center rounded-md bg-amber font-serif text-base font-semibold text-white">
            t
          </span>
          <span className="font-serif text-xl font-semibold text-cream">third</span>
        </Link>
        {step < 5 && (
          <button
            type="button"
            onClick={onSkipTop}
            className="border-0 bg-transparent text-[13px] text-cream-faint transition-colors hover:text-cream"
          >
            지금은 건너뛰기 →
          </button>
        )}
      </div>

      {/* journey indicator */}
      {step >= 1 && step <= 4 && (
        <div className="relative z-[3] mx-auto mt-1.5 flex w-full max-w-[600px] items-center px-7">
          <JourneyIndicator step={step} />
        </div>
      )}

      {/* body */}
      <div className="relative z-[3] flex flex-1 items-center justify-center px-7 pb-16 pt-6">
        <div className="w-full max-w-[700px]">
          {step === 0 && <IntroStep onBegin={() => go(1)} />}
          {step === 1 && (
            <ConceptStep
              concepts={concepts}
              draft={conceptDraft}
              onDraft={setConceptDraft}
              onToggle={toggleConcept}
              onAdd={addCustomConcept}
            />
          )}
          {step === 2 && (
            <ReasonStep
              multi={multi}
              reason={reason}
              onReason={setReason}
            />
          )}
          {step === 3 && (
            <OutcomeStep outcome={outcome} onOutcome={setOutcome} />
          )}
          {step === 4 && (
            <BridgeStep
              multi={multi}
              bridge={bridge}
              draft={bridgeDraft}
              onPick={pickBridge}
              onDraft={setBridgeDraft}
            />
          )}
          {step === 5 && (
            <DeclareStep
              concepts={concepts}
              statement={statementText}
              assembled={assembled}
              onStatement={(v) => setStatementOverride(v)}
              onReset={() => setStatementOverride(null)}
              bridge={bridge || bridgeDraft.trim() || '도메인 모델링'}
              inline={inline}
              pending={save.isPending}
              onSubmit={() => submit('declare')}
            />
          )}

          {/* composition ribbon */}
          {step >= 1 && step <= 4 && (
            <CompositionRibbon
              concepts={concepts}
              outcome={outcome}
              bridge={bridge}
            />
          )}

          {/* footer nav */}
          {step >= 1 && step <= 4 && (
            <div className="mt-7 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => go(Math.max(0, step - 1) as Step)}
                className="inline-flex items-center gap-2 border-0 bg-transparent text-sm font-medium text-cream-faint transition-colors hover:text-cream"
              >
                <Icon name="solar:alt-arrow-left-linear" width={16} height={16} />
                이전
              </button>
              <div className="flex items-center gap-3.5">
                {step === 2 && (
                  <button
                    type="button"
                    onClick={goNext}
                    className="border-0 bg-transparent text-[13.5px] text-cream-faint transition-colors hover:text-cream"
                  >
                    건너뛰기
                  </button>
                )}
                <button
                  type="button"
                  onClick={goNext}
                  disabled={nextDisabled}
                  className={`inline-flex items-center gap-3 rounded-full border-0 py-3 pl-6 pr-4 text-[15px] font-medium transition-all duration-[var(--dur-base)] ease-[var(--ease-spring)] ${
                    nextDisabled
                      ? 'cursor-not-allowed bg-paper-2 text-cream-faint'
                      : 'bg-amber text-white shadow-[0_10px_24px_-12px_rgba(196,103,63,0.65)] hover:-translate-y-px hover:bg-amber-deep'
                  }`}
                >
                  {step === 4 ? '문장 완성하기' : '다음'}
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-white/20">
                    <Icon name="solar:arrow-right-linear" width={15} height={15} />
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function JourneyIndicator({ step }: { step: Step }) {
  const phases = ['컨셉', '이유', '결과물', '축'];
  const active = Math.min(3, Math.max(0, step - 1));
  return (
    <div className="flex w-full items-center gap-0">
      {phases.map((label, i) => {
        const isActive = i === active;
        const isPast = i < active;
        return (
          <div key={label} className="flex flex-1 items-center gap-[11px]">
            <div
              className={`flex items-center gap-2.5 ${
                isActive ? 'text-cream' : isPast ? 'text-cream-mute' : 'text-cream-faint'
              }`}
            >
              <span
                className={`grid h-6 w-6 place-items-center rounded-full border font-serif text-[13px] italic transition-all ${
                  isActive
                    ? 'border-amber bg-amber-soft text-amber-deep'
                    : isPast
                      ? 'border-amber-line bg-transparent text-amber-deep'
                      : 'border-edge-strong bg-transparent text-cream-faint'
                }`}
              >
                {(i + 1).toString().padStart(2, '0')}
              </span>
              <span className={`whitespace-nowrap text-xs ${isActive ? 'font-semibold' : 'font-normal'}`}>
                {label}
              </span>
            </div>
            {i < phases.length - 1 && (
              <span
                aria-hidden
                className={`h-px flex-1 ${isPast ? 'bg-amber-line' : 'bg-edge'}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function IntroStep({ onBegin }: { onBegin: () => void }) {
  return (
    <div
      className="text-center"
      style={{ animation: 'obStep .5s var(--ease-spring) both' }}
    >
      <span className="mb-[26px] inline-block text-xs uppercase tracking-[0.12em] text-cream-faint">
        Before we begin
      </span>
      <h1 className="m-0 mb-6 font-serif text-[52px] font-medium leading-[1.14] tracking-[-0.025em] text-cream break-keep">
        당신은 하나의 직군으로만
        <br />
        설명되지 <span className="italic text-amber">않잖아요.</span>
      </h1>
      <p className="m-0 mx-auto mb-10 max-w-[44ch] text-lg leading-[1.75] text-cream-mute break-keep">
        한 가지든, 여러 가지든 — 당신이 엮어가고 싶은 능력과, 그 조합으로 만들고 싶은 결과물을 한 문장으로 그려볼게요. 능력이 하나여도 충분해요.
      </p>
      <button
        type="button"
        onClick={onBegin}
        className="group inline-flex items-center gap-3 rounded-full border-0 bg-amber py-4 pl-[30px] pr-[18px] text-[17px] font-medium text-white shadow-[0_10px_24px_-12px_rgba(196,103,63,0.65)] transition-all duration-[var(--dur-base)] ease-[var(--ease-spring)] hover:-translate-y-px hover:bg-amber-deep"
      >
        천천히 시작하기
        <span className="grid h-8 w-8 place-items-center rounded-full bg-white/20">
          <Icon name="solar:arrow-right-linear" width={17} height={17} />
        </span>
      </button>
      <p className="m-0 mt-[22px] text-[12.5px] text-cream-faint">
        3분이면 충분해요 · 언제든 다시 쓸 수 있어요
      </p>
    </div>
  );
}

function ConceptStep({
  concepts,
  draft,
  onDraft,
  onToggle,
  onAdd,
}: {
  concepts: string[];
  draft: string;
  onDraft: (v: string) => void;
  onToggle: (label: string) => void;
  onAdd: () => void;
}) {
  const full = concepts.length >= 3;
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onAdd();
    }
  };
  return (
    <div style={{ animation: 'obStep .45s var(--ease-spring) both' }}>
      <div className="mb-[18px] flex items-center justify-between gap-3">
        <div className="flex items-center gap-[11px]">
          <span className="font-serif text-lg italic text-amber">컨셉</span>
          <span className="text-xs uppercase tracking-[0.1em] text-cream-faint">
            Your Capabilities
          </span>
        </div>
        <span
          className={`tabular-nums text-[12.5px] ${
            concepts.length ? 'text-amber-deep' : 'text-cream-faint'
          }`}
        >
          {concepts.length} / 3
        </span>
      </div>
      <h2 className="m-0 mb-2.5 font-serif text-[36px] font-medium leading-[1.16] tracking-[-0.02em] text-cream break-keep">
        함께 가져가고 싶은 능력은?
      </h2>
      <p className="m-0 mb-7 text-base leading-[1.7] text-cream-mute break-keep">
        하나여도 좋고, 서로 다른 강점이면 더 좋아요. 섞는 건 산만함이 아니라 전략이니까요.{' '}
        <span className="text-cream-faint">최대 3개.</span>
      </p>

      <div className="flex flex-col gap-2.5">
        {CONCEPT_OPTIONS.map((c) => {
          const sel = concepts.includes(c.label);
          const disabled = full && !sel;
          return (
            <button
              key={c.label}
              type="button"
              onClick={() => onToggle(c.label)}
              disabled={disabled}
              className={`flex items-center gap-4 rounded-[16px] border px-[22px] py-[17px] text-left transition-all duration-[var(--dur-fast)] ease-[var(--ease-spring)] ${
                sel
                  ? 'border-amber bg-amber-soft'
                  : 'border-edge bg-surface hover:-translate-y-0.5 hover:border-amber-line'
              } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            >
              <span
                className={`grid h-6 w-6 flex-shrink-0 place-items-center rounded-[7px] border-[1.5px] text-white transition-all ${
                  sel ? 'border-amber bg-amber' : 'border-edge-strong bg-transparent'
                }`}
              >
                {sel && <Icon name="solar:check-bold" width={14} height={14} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-serif text-[20px] font-medium leading-[1.25] text-cream break-keep">
                  {c.label}
                </span>
                <span className="mt-0.5 block text-[13px] text-cream-faint break-keep">
                  {c.sub}
                </span>
              </span>
            </button>
          );
        })}

        <div className="flex items-center gap-3 rounded-[16px] border border-dashed border-edge-strong bg-transparent px-[22px] py-[15px]">
          <Icon name="solar:add-square-linear" width={17} height={17} className="flex-shrink-0 text-cream-faint" />
          <input
            value={draft}
            onChange={(e) => onDraft(e.target.value)}
            onKeyDown={onKey}
            placeholder="직접 적기 · Enter"
            className="w-full border-0 bg-transparent font-serif text-[17px] text-cream caret-amber outline-none placeholder:text-cream-faint"
          />
        </div>
      </div>
    </div>
  );
}

function ReasonStep({
  multi,
  reason,
  onReason,
}: {
  multi: boolean;
  reason: string;
  onReason: (v: string) => void;
}) {
  const question = multi ? '왜 이 능력들을 함께?' : '왜 이 방향인가요?';
  const hint = multi
    ? '조합엔 이유가 있어요. 한 줄이면 충분해요. (건너뛰어도 좋아요)'
    : '지금 이 길을 택한 이유. (건너뛰어도 좋아요)';
  const placeholder = multi
    ? '예: 구현만 되는 게 아니라, 문제를 정확히 잡고 싶어서'
    : '예: 흔들리지 않는 백엔드를 스스로 저술하고 싶어서';
  return (
    <div style={{ animation: 'obStep .45s var(--ease-spring) both' }}>
      <div className="mb-[18px] flex items-center gap-[11px]">
        <span className="font-serif text-lg italic text-amber">이유</span>
        <span className="text-xs uppercase tracking-[0.1em] text-cream-faint">Why together</span>
      </div>
      <h2 className="m-0 mb-2.5 font-serif text-[34px] font-medium leading-[1.18] tracking-[-0.02em] text-cream break-keep">
        {question}
      </h2>
      <p className="m-0 mb-6 text-base leading-[1.7] text-cream-mute break-keep">{hint}</p>

      <textarea
        value={reason}
        onChange={(e) => onReason(e.target.value)}
        rows={3}
        placeholder={placeholder}
        className="w-full resize-none rounded-[16px] border border-edge-strong bg-surface px-5 py-[18px] font-serif text-[19px] leading-[1.5] text-cream caret-amber outline-none focus:border-amber-line focus:shadow-[0_0_0_3px_var(--color-amber-soft)]"
      />
      <div className="mt-3.5 flex flex-wrap gap-2">
        {REASON_SEEDS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onReason(s)}
            className="rounded-full border border-edge-strong bg-transparent px-3.5 py-2 text-left text-[12.5px] text-cream-mute transition-all duration-[var(--dur-fast)] ease-[var(--ease-spring)] hover:border-amber-line hover:text-amber-deep break-keep"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function OutcomeStep({
  outcome,
  onOutcome,
}: {
  outcome: string;
  onOutcome: (v: string) => void;
}) {
  return (
    <div style={{ animation: 'obStep .45s var(--ease-spring) both' }}>
      <div className="mb-[18px] flex items-center gap-[11px]">
        <span className="font-serif text-lg italic text-amber">결과물</span>
        <span className="text-xs uppercase tracking-[0.1em] text-cream-faint">
          What you build
        </span>
      </div>
      <h2 className="m-0 mb-2.5 font-serif text-[34px] font-medium leading-[1.18] tracking-[-0.02em] text-cream break-keep">
        이 능력으로, 무엇을 <span className="italic text-amber">만들고</span> 싶나요?
      </h2>
      <p className="m-0 mb-6 text-base leading-[1.7] text-cream-mute break-keep">
        지식을 쌓는 게 아니라, 결과물을 만드는 사람으로. 학습 축은 이 결과물을 향해 정렬돼요.
      </p>

      <textarea
        value={outcome}
        onChange={(e) => onOutcome(e.target.value)}
        rows={3}
        placeholder="예: 기술과 사용자 맥락이 끊기지 않고 연결된 제품"
        className="w-full resize-none rounded-[16px] border border-edge-strong bg-surface px-5 py-[18px] font-serif text-[21px] leading-[1.5] text-cream caret-amber outline-none focus:border-amber-line focus:shadow-[0_0_0_3px_var(--color-amber-soft)]"
      />
      <div className="mt-3.5 flex flex-wrap gap-2">
        {OUTCOME_SEEDS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onOutcome(s)}
            className="rounded-full border border-edge-strong bg-transparent px-3.5 py-2 text-[12.5px] text-cream-mute transition-all duration-[var(--dur-fast)] ease-[var(--ease-spring)] hover:border-amber-line hover:text-amber-deep break-keep"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function BridgeStep({
  multi,
  bridge,
  draft,
  onPick,
  onDraft,
}: {
  multi: boolean;
  bridge: string;
  draft: string;
  onPick: (v: string) => void;
  onDraft: (v: string) => void;
}) {
  const question = multi ? '조합에서, 먼저 강화할 축은?' : '첫 걸음은, 어디서부터요?';
  const hint = multi
    ? '여러 능력이 만나며 새로 중요해진 연결 축. 하나만 골라요.'
    : '학습을 풀어갈 첫 영역. 나중에 얼마든 추가할 수 있어요.';
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && draft.trim()) {
      e.preventDefault();
      onPick(draft.trim());
    }
  };
  return (
    <div style={{ animation: 'obStep .45s var(--ease-spring) both' }}>
      <div className="mb-[18px] flex items-center gap-[11px]">
        <span className="font-serif text-lg italic text-amber">축</span>
        <span className="text-xs uppercase tracking-[0.1em] text-cream-faint">Bridge Axis</span>
      </div>
      <h2 className="m-0 mb-2.5 font-serif text-[34px] font-medium leading-[1.18] tracking-[-0.02em] text-cream break-keep">
        {question}
      </h2>
      <p className="m-0 mb-[26px] text-base leading-[1.7] text-cream-mute break-keep">{hint}</p>

      <div className="flex flex-wrap gap-2.5">
        {BRIDGE_POOL.map((b) => {
          const sel = bridge === b;
          return (
            <button
              key={b}
              type="button"
              onClick={() => onPick(b)}
              className={`inline-flex items-center gap-2.5 rounded-[14px] border px-[18px] py-3 transition-all duration-[var(--dur-fast)] ease-[var(--ease-spring)] ${
                sel
                  ? 'border-amber bg-amber-soft'
                  : 'border-edge bg-surface hover:-translate-y-0.5 hover:border-amber-line'
              }`}
            >
              <span
                aria-hidden
                className="h-[7px] w-[7px] rounded-full"
                style={{ background: sel ? 'var(--color-amber)' : 'var(--color-edge-strong)' }}
              />
              <span className="font-serif text-[17px] font-medium text-cream break-keep">{b}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex max-w-[340px] items-center gap-3 rounded-[14px] border border-dashed border-edge-strong bg-transparent px-[18px] py-3">
        <Icon name="solar:pen-2-linear" width={16} height={16} className="flex-shrink-0 text-cream-faint" />
        <input
          value={draft}
          onChange={(e) => onDraft(e.target.value)}
          onKeyDown={onKey}
          placeholder="직접 적기 · Enter"
          className="w-full border-0 bg-transparent font-serif text-base text-cream caret-amber outline-none placeholder:text-cream-faint"
        />
      </div>
    </div>
  );
}

function CompositionRibbon({
  concepts,
  outcome,
  bridge,
}: {
  concepts: string[];
  outcome: string;
  bridge: string;
}) {
  const connector =
    concepts.length >= 2 ? '이 능력들을 엮어,' : concepts.length === 1 ? '이 힘으로,' : '엮어서,';
  const outVal = outcome.trim();
  return (
    <div className="mt-9 rounded-[18px] border border-edge bg-surface px-[26px] py-[22px]">
      <div className="mb-[15px] flex items-center gap-2">
        <span
          aria-hidden
          className="h-1.5 w-1.5 rounded-full bg-amber"
          style={{ animation: 'obPulse 2.4s ease-in-out infinite' }}
        />
        <span className="text-[11px] uppercase tracking-[0.08em] text-cream-faint">
          만들어지는 중 · 나의 조합
        </span>
      </div>

      {concepts.length > 0 ? (
        <div className="mb-3.5 flex flex-wrap gap-[7px]">
          {concepts.map((c) => (
            <span
              key={c}
              className="rounded-full bg-amber-soft px-3 py-1.5 text-[13.5px] font-medium text-amber-deep break-keep"
              style={{ animation: 'obChip 0.3s var(--ease-spring) both' }}
            >
              {c}
            </span>
          ))}
        </div>
      ) : (
        <div className="mb-3.5">
          <span className="inline-block rounded-full border border-dashed border-edge-strong px-4 py-1.5 text-[13.5px] text-cream-faint">
            고른 능력이 여기 모여요
          </span>
        </div>
      )}

      <p className="m-0 font-serif text-[23px] font-medium leading-[1.5] tracking-[-0.01em] break-keep">
        <span className="text-cream-faint">{connector} </span>
        <span
          className={outVal ? 'text-amber-deep' : 'text-cream-faint'}
          style={{
            borderBottom: outVal ? 'none' : '1px dashed var(--color-edge-strong)',
            paddingBottom: 1,
          }}
        >
          {outVal || '어떤 결과물'}
        </span>
        <span className="text-cream-faint">.</span>
      </p>
      {bridge && (
        <p className="m-0 mt-3 text-[13.5px] text-cream-mute">
          지금은 <span className="font-semibold text-amber-deep">{bridge}</span>부터 단련해요.
        </p>
      )}
    </div>
  );
}

function DeclareStep({
  concepts,
  statement,
  assembled,
  onStatement,
  onReset,
  bridge,
  inline,
  pending,
  onSubmit,
}: {
  concepts: string[];
  statement: string;
  assembled: string;
  onStatement: (v: string) => void;
  onReset: () => void;
  bridge: string;
  inline: string | null;
  pending: boolean;
  onSubmit: () => void;
}) {
  const finalConcepts = concepts.length > 0 ? concepts : ['나의 능력'];
  const isOverridden = statement !== assembled;
  return (
    <div
      className="text-center"
      style={{ animation: 'obStep .55s var(--ease-spring) both' }}
    >
      <div className="mx-auto mb-6 grid h-[60px] w-[60px] place-items-center rounded-full bg-amber-soft text-amber-deep">
        <Icon name="solar:moon-stars-linear" width={28} height={28} />
      </div>
      <span className="mb-[18px] inline-block text-xs uppercase tracking-[0.12em] text-cream-faint">
        오늘부터, 당신의 북극성
      </span>

      <div className="mb-5 flex flex-wrap justify-center gap-2">
        {finalConcepts.map((c) => (
          <span
            key={c}
            className="rounded-full bg-amber-soft px-3.5 py-1.5 text-[13px] font-medium text-amber-deep"
          >
            {c}
          </span>
        ))}
      </div>

      <div className="mx-auto mb-7 max-w-[560px] rounded-[20px] border border-edge bg-surface px-[30px] py-7 shadow-[0_20px_50px_-32px_rgba(33,31,26,0.4)]">
        <textarea
          value={statement}
          onChange={(e) => onStatement(e.target.value)}
          rows={4}
          className="w-full resize-none border-0 bg-transparent text-center font-serif text-[25px] font-medium leading-[1.5] tracking-[-0.01em] text-cream caret-amber outline-none"
        />
        {isOverridden && (
          <button
            type="button"
            onClick={onReset}
            className="mt-1.5 border-0 bg-transparent text-xs text-cream-faint transition-colors hover:text-cream"
          >
            ↺ 조립된 문장으로 되돌리기
          </button>
        )}
      </div>

      <div className="mb-[34px] inline-flex items-center gap-2.5 rounded-full border border-edge bg-paper-2 px-4 py-2.5">
        <span className="text-xs text-cream-faint">먼저 강화할 축</span>
        <span aria-hidden className="h-1 w-1 rounded-full bg-amber" />
        <span className="text-[13px] font-medium text-cream">{bridge}</span>
      </div>

      {inline && (
        <p role="alert" className="m-0 mb-4 text-sm text-amber-deep">
          {inline}
        </p>
      )}

      <div>
        <button
          type="button"
          onClick={onSubmit}
          disabled={pending}
          className="group inline-flex items-center gap-3 rounded-full border-0 bg-amber py-4 pl-[30px] pr-[18px] text-[17px] font-medium text-white shadow-[0_10px_24px_-12px_rgba(196,103,63,0.65)] transition-all duration-[var(--dur-base)] ease-[var(--ease-spring)] hover:-translate-y-px hover:bg-amber-deep disabled:opacity-60"
        >
          {pending ? '지도 펼치는 중…' : '이 조합으로, 지도 펼치기'}
          <span className="grid h-8 w-8 place-items-center rounded-full bg-white/20">
            <Icon name="solar:arrow-right-linear" width={17} height={17} />
          </span>
        </button>
      </div>
    </div>
  );
}
