import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { track } from '@/lib/analytics/track';
import { Icon } from '@/components/Icon';
import { MarkdownView } from '@/components/MarkdownView';

type Phase = 'session' | 'done';

interface CornellCard {
  subject: string;
  goal: string;
  date: string;
  tag: string;
  day: 'DAY_1' | 'DAY_3' | 'DAY_7';
  view: number;
  note: string;
  keywords: string[];
  summary: string;
}

const DEMO_CARDS: CornellCard[] = [
  {
    subject: '분산 시스템 · 멱등성',
    goal: '재시도 안전성 이해',
    date: '2026.06',
    tag: '결제',
    day: 'DAY_1',
    view: 2,
    note: [
      '## 멱등성 (Idempotency)',
      '같은 요청을 **여러 번** 보내도 서버의 상태와 결과가 **한 번** 보낸 것과 같도록 보장하는 성질.',
      '> 결제·정산처럼 "두 번 일어나면 안 되는" 도메인의 핵심.',
      '### 어떻게 보장하나',
      '- 클라이언트가 **멱등 키**(Idempotency-Key)를 생성해 함께 전송',
      '- 서버는 키로 이전 처리 결과를 조회 → 있으면 그대로 반환',
      '- 없으면 처리하고 결과를 키와 함께 저장',
      '```\nPOST /payments\nIdempotency-Key: 9f8b-...-c21\n```',
      '![결제 흐름 메모](https://picsum.photos/seed/cornell-idem/640/340)',
    ].join('\n\n'),
    keywords: ['멱등성', '멱등 키', '재시도 안전'],
    summary: '멱등 키로 이전 결과를 조회·재사용해, 재시도해도 결제가 한 번만 일어나게 한다.',
  },
  {
    subject: '데이터 모델링 · 정규화',
    goal: '어디서 멈출지 판단',
    date: '2026.06',
    tag: '데이터',
    day: 'DAY_3',
    view: 3,
    note: [
      '## 정규화는 어디까지?',
      '정규화는 **중복과 이상(anomaly)** 을 줄이려 테이블을 쪼개는 과정. 무한정 쪼개는 게 목표가 아니다.',
      '### 신호로 판단한다',
      '- **삽입 이상**: 불필요한 NULL 없이는 행을 못 넣는다',
      '- **갱신 이상**: 같은 값을 여러 곳에서 고쳐야 한다',
      '- **삭제 이상**: 한 행을 지우면 다른 정보까지 사라진다',
      '> 대개 **3NF**에서 멈추고, 읽기 성능이 필요하면 의도적으로 역정규화한다.',
      '![정규화 단계 메모](https://picsum.photos/seed/cornell-norm/640/340)',
    ].join('\n\n'),
    keywords: ['이상 현상', '3NF', '의도적 역정규화'],
    summary: '삽입·갱신·삭제 이상이 사라지는 3NF까지가 기본, 읽기 성능이 필요할 때만 역정규화한다.',
  },
  {
    subject: '결제 · 복식부기',
    goal: '정합성의 근거',
    date: '2026.04',
    tag: '결제',
    day: 'DAY_7',
    view: 4,
    note: [
      '## 차변과 대변은 왜 같아야 하나',
      '모든 거래를 **두 계정에 동시에** 기록한다. 한쪽이 늘면 반드시 다른 쪽이 그만큼 줄거나 는다.',
      '### 결과',
      '- 전체 차변 합 = 전체 대변 합 — **항상** 성립',
      '- 이 등식이 깨지면 어딘가 기록이 빠졌다는 **자가 검증**',
      '> 정산 시스템에서 "돈이 사라지지 않음"을 보장하는 수학적 안전망.',
      '![원장 메모](https://picsum.photos/seed/cornell-ledger/640/340)',
    ].join('\n\n'),
    keywords: ['복식부기', '차변=대변', '자가 검증'],
    summary: '모든 거래를 두 계정에 기록해 차변 합과 대변 합이 늘 같고, 그 등식이 정합성을 스스로 증명한다.',
  },
];

const DAY_TONE: Record<CornellCard['day'], { bg: string; color: string; label: string }> = {
  DAY_1: { bg: 'bg-amber-soft', color: 'text-amber-deep', label: 'DAY 1' },
  DAY_3: { bg: 'bg-amber-soft', color: 'text-amber-deep', label: 'DAY 3' },
  DAY_7: { bg: 'bg-sage-soft', color: 'text-sage-ink', label: 'DAY 7' },
};

export function StudyPage() {
  const [phase, setPhase] = useState<Phase>('session');
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [clearCount, setClearCount] = useState(0);
  const [archivedCount, setArchivedCount] = useState(0);

  const total = DEMO_CARDS.length;
  const card = useMemo(() => DEMO_CARDS[Math.min(index, total - 1)]!, [index, total]);

  const openedRef = useRef(false);
  useEffect(() => {
    if (openedRef.current) return;
    openedRef.current = true;
    track('review_session_opened', { cardCount: total });
    track('review_session_started');
  }, [total]);

  useEffect(() => {
    if (phase === 'done') track('review_session_completed');
  }, [phase]);

  const advance = (deltaClear: number, deltaArchived: number) => {
    setClearCount((s) => s + deltaClear);
    setArchivedCount((s) => s + deltaArchived);
    if (index + 1 >= total) setPhase('done');
    else {
      setIndex((i) => i + 1);
      setRevealed(false);
    }
  };

  const rate = (level: 1 | 2 | 3) => {
    track('card_view_recorded', { cardId: card.subject, level });
    advance(level === 3 ? 1 : 0, 0);
  };

  const archiveNow = () => {
    track('card_archived', { cardId: card.subject });
    advance(0, 1);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase !== 'session') return;
      if (!revealed && (e.code === 'Space' || e.key === 'Enter')) {
        e.preventDefault();
        setRevealed(true);
        return;
      }
      if (revealed && (e.key === '1' || e.key === '2' || e.key === '3')) {
        e.preventDefault();
        rate(Number(e.key) as 1 | 2 | 3);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, revealed, index]);

  const restart = () => {
    setPhase('session');
    setIndex(0);
    setRevealed(false);
    setClearCount(0);
    setArchivedCount(0);
  };

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-canvas text-cream">
      <div className="relative z-10 mx-auto flex w-full max-w-[1000px] items-center gap-6 px-7 py-[22px]">
        <Link
          to="/home"
          className="inline-flex flex-shrink-0 items-center gap-2 text-[13px] text-cream-faint no-underline transition-colors hover:text-cream"
        >
          <Icon name="solar:close-circle-linear" width={16} height={16} />
          나가기
        </Link>
        <div className="flex flex-1 gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className="h-1 flex-1 rounded-full transition-colors duration-[var(--dur-base)] ease-[var(--ease-spring)]"
              style={{
                background: i <= index ? 'var(--color-amber)' : 'var(--color-edge-strong)',
              }}
            />
          ))}
        </div>
        <span className="flex-shrink-0 text-[12.5px] tabular-nums text-cream-faint">
          {Math.min(index + 1, total)} / {total}
        </span>
      </div>

      <div className="relative z-10 flex flex-1 items-start justify-center px-7 pb-20 pt-2">
        {phase === 'session' && (
          <CornellSheet
            card={card}
            revealed={revealed}
            onReveal={() => setRevealed(true)}
            onArchive={archiveNow}
            onRate={rate}
          />
        )}
        {phase === 'done' && (
          <DonePanel metCount={total} clearCount={clearCount} onRestart={restart} archivedCount={archivedCount} />
        )}
      </div>
    </div>
  );
}

function CornellSheet({
  card,
  revealed,
  onReveal,
  onArchive,
  onRate,
}: {
  card: CornellCard;
  revealed: boolean;
  onReveal: () => void;
  onArchive: () => void;
  onRate: (level: 1 | 2 | 3) => void;
}) {
  const tone = DAY_TONE[card.day];
  const lastExposure = card.view === 4;

  return (
    <div className="w-full max-w-[1000px]">
      <div
        className="overflow-hidden rounded-[22px] border border-edge bg-surface shadow-[0_34px_80px_-42px_rgba(33,31,26,0.4)]"
        style={{ animation: 'fadeInUp .4s var(--ease-spring) both' }}
      >
        {/* 1. 제목 */}
        <div className="flex items-center justify-between gap-4 border-b border-edge bg-paper-2 px-7 py-[22px]">
          <div className="min-w-0">
            <div className="mb-1.5 flex items-center gap-2.5">
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.04em] ${tone.bg} ${tone.color}`}
              >
                {tone.label}
              </span>
              <span className="text-xs text-cream-faint">{card.tag}</span>
              {lastExposure && (
                <span className="text-[11px] text-sage-ink">· 마지막 노출</span>
              )}
            </div>
            <h2 className="m-0 truncate font-serif text-[25px] font-semibold tracking-[-0.01em] text-cream">
              {card.subject}
            </h2>
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="text-xs text-cream-mute">{card.goal}</div>
            <div className="mt-0.5 text-[11.5px] tabular-nums text-cream-faint">
              {card.date} · 노출 {card.view}/5
            </div>
          </div>
        </div>

        {/* 3 + 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-[226px_1fr]">
          {/* 3. 단서영역 */}
          <div className="flex flex-col border-b border-edge bg-[rgba(243,239,230,0.5)] px-5 py-6 lg:border-b-0 lg:border-r">
            <div className="mb-4 flex items-center gap-[7px]">
              <span className="font-serif text-[15px] italic text-amber">단서</span>
              <span className="text-[10.5px] uppercase tracking-[0.06em] text-cream-faint">Cue</span>
            </div>

            {revealed ? (
              <div
                className="flex flex-col gap-2.5"
                style={{ animation: 'fadeInUp .35s var(--ease-spring) both' }}
              >
                {card.keywords.map((k) => (
                  <div
                    key={k}
                    className="flex items-center gap-2.5 rounded-[11px] border border-amber-line bg-surface px-3.5 py-2.5"
                  >
                    <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-amber" />
                    <span className="text-sm font-medium text-cream break-keep">{k}</span>
                  </div>
                ))}
              </div>
            ) : (
              <button
                type="button"
                onClick={onReveal}
                className="flex min-h-[140px] flex-1 flex-col items-center justify-center gap-3 rounded-[13px] border-[1.5px] border-dashed border-edge-strong bg-transparent p-5 transition-all duration-[var(--dur-fast)] ease-[var(--ease-spring)] hover:border-amber-line hover:bg-amber-soft"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-paper-2 text-cream-faint">
                  <Icon name="solar:eye-closed-linear" width={18} height={18} />
                </span>
                <span className="text-center text-[12.5px] leading-[1.5] text-cream-faint break-keep">
                  핵심 키워드를
                  <br />
                  먼저 떠올려보세요
                </span>
              </button>
            )}

            {revealed && (
              <span className="mt-3.5 text-[11px] leading-[1.5] text-cream-faint break-keep">
                자료를 보고 이 단서들이 떠올랐나요?
              </span>
            )}
          </div>

          {/* 2. 노트 필기 영역 */}
          <div className="max-h-[560px] overflow-y-auto px-[34px] py-[30px]">
            <div className="mb-[18px] flex items-center gap-[7px]">
              <span className="font-serif text-[15px] italic text-cream-faint">노트</span>
              <span className="text-[10.5px] uppercase tracking-[0.06em] text-cream-faint">
                Material
              </span>
              <span aria-hidden className="h-px flex-1 bg-edge" />
            </div>
            <MarkdownView source={card.note} />
          </div>
        </div>

        {/* 4. 요약 영역 */}
        <div className="border-t border-edge bg-[rgba(243,239,230,0.5)] px-7 py-[22px]">
          <div className="mb-3.5 flex items-center gap-[7px]">
            <span className="font-serif text-[15px] italic text-amber">요약</span>
            <span className="text-[10.5px] uppercase tracking-[0.06em] text-cream-faint">
              Summary · 내 언어로
            </span>
          </div>
          {revealed ? (
            <p
              className="m-0 font-serif text-[20px] font-medium leading-[1.5] text-cream break-keep"
              style={{ animation: 'fadeInUp .35s var(--ease-spring) .05s both' }}
            >
              {card.summary}
            </p>
          ) : (
            <button
              type="button"
              onClick={onReveal}
              className="flex w-full items-center justify-center gap-2.5 rounded-[13px] border-[1.5px] border-dashed border-edge-strong bg-transparent p-[18px] text-[13px] font-medium text-cream-faint transition-all duration-[var(--dur-fast)] ease-[var(--ease-spring)] hover:border-amber-line hover:bg-amber-soft hover:text-amber-deep"
            >
              <Icon name="solar:eye-linear" width={16} height={16} />
              자료의 핵심을 한 문장으로 떠올린 뒤 펼치기
            </button>
          )}
        </div>
      </div>

      {!revealed && (
        <div className="mt-[22px] flex items-center justify-between gap-3.5">
          <button
            type="button"
            onClick={onArchive}
            className="inline-flex items-center gap-2.5 rounded-full border border-edge bg-transparent px-[22px] py-3 text-sm font-medium text-cream-mute transition-all duration-[var(--dur-fast)] ease-[var(--ease-spring)] hover:border-edge-strong hover:bg-paper-2"
          >
            <Icon name="solar:archive-linear" width={16} height={16} />
            잠시 쉬러 보내기
          </button>
          <button
            type="button"
            onClick={onReveal}
            className="group inline-flex items-center gap-3 rounded-full bg-amber py-3.5 pl-[26px] pr-4 text-[15px] font-medium text-white shadow-[0_10px_24px_-12px_rgba(196,103,63,0.65)] transition-all duration-[var(--dur-base)] ease-[var(--ease-spring)] hover:-translate-y-px hover:bg-amber-deep"
          >
            단서 · 요약 펼쳐서 확인
            <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-white/20 text-[11px] font-semibold">
              Space
            </span>
          </button>
        </div>
      )}

      {revealed && (
        <div className="mt-[22px]" style={{ animation: 'fadeInUp .35s var(--ease-spring) .1s both' }}>
          <p className="m-0 mb-3.5 text-center text-sm text-cream-mute">
            자료만 보고 얼마나 떠올랐나요?
          </p>
          <div className="grid grid-cols-3 gap-3">
            <RateButton onClick={() => onRate(1)} kbd="1" label="막막" sub="거의 안 떠올랐어요" icon="solar:emoji-sad-circle-linear" tone="clay" />
            <RateButton onClick={() => onRate(2)} kbd="2" label="가물" sub="일부만 떠올랐어요" icon="solar:emoji-funny-circle-linear" tone="muted" />
            <RateButton onClick={() => onRate(3)} kbd="3" label="또렷" sub="내 언어로 떠올랐어요" icon="solar:emoji-smile-circle-linear" tone="sage" />
          </div>
        </div>
      )}
    </div>
  );
}

function RateButton({
  onClick,
  kbd,
  label,
  sub,
  icon,
  tone,
}: {
  onClick: () => void;
  kbd: string;
  label: string;
  sub: string;
  icon: string;
  tone: 'clay' | 'muted' | 'sage';
}) {
  const toneClass =
    tone === 'sage'
      ? 'bg-sage-soft text-sage-ink'
      : tone === 'clay'
        ? 'bg-amber-soft text-amber-deep'
        : 'bg-paper-2 text-cream-mute border border-edge';
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center gap-[7px] rounded-[16px] border border-edge bg-paper-2 p-[18px] transition-all duration-[var(--dur-fast)] ease-[var(--ease-spring)] hover:-translate-y-0.5 hover:border-amber-line hover:bg-surface"
    >
      <span className={`grid h-[34px] w-[34px] place-items-center rounded-full ${toneClass}`}>
        <Icon name={icon} width={17} height={17} />
      </span>
      <span className="font-serif text-lg font-medium text-cream">{label}</span>
      <span className="text-[11.5px] text-cream-faint">{sub}</span>
      <span className="text-[10.5px] tabular-nums text-cream-faint">{kbd}</span>
    </button>
  );
}

function DonePanel({
  metCount,
  clearCount,
  archivedCount,
  onRestart,
}: {
  metCount: number;
  clearCount: number;
  archivedCount: number;
  onRestart: () => void;
}) {
  return (
    <div
      className="w-full max-w-[520px] pt-12 text-center"
      style={{ animation: 'fadeInUp .45s var(--ease-spring) both' }}
    >
      <div className="mx-auto mb-7 grid h-[74px] w-[74px] place-items-center rounded-full bg-amber-soft text-amber-deep">
        <Icon name="solar:check-circle-linear" width={36} height={36} />
      </div>
      <h1 className="m-0 mb-4 font-serif text-[44px] font-medium leading-[1.1] tracking-[-0.02em] text-cream">
        오늘 순환을 <span className="italic text-amber">마쳤어요.</span>
      </h1>
      <p className="m-0 mx-auto mb-8 max-w-[42ch] text-base leading-[1.7] text-cream-mute break-keep">
        자료를 보고 떠올린 단서와 요약이 기억을 다시 단단하게 만들었어요. 또렷했던 카드는 배경에서 쉬어요.
      </p>
      <div className="mb-9 flex justify-center gap-3.5">
        <div className="w-[150px] rounded-[16px] border border-edge bg-surface p-5">
          <div className="font-serif text-[32px] font-medium leading-none text-cream">
            {metCount}
          </div>
          <div className="mt-[7px] text-xs text-cream-faint">오늘 만난 카드</div>
        </div>
        <div className="w-[150px] rounded-[16px] border border-edge bg-surface p-5">
          <div className="font-serif text-[32px] font-medium leading-none text-sage-ink">
            {clearCount}
          </div>
          <div className="mt-[7px] text-xs text-cream-faint">또렷했던 카드</div>
        </div>
      </div>
      {archivedCount > 0 && (
        <p className="mb-6 text-xs text-cream-faint">참조로 옮긴 카드 {archivedCount}장</p>
      )}
      <div className="flex justify-center gap-3">
        <Link
          to="/home"
          className="inline-flex items-center rounded-full border border-edge-strong bg-transparent px-6 py-3.5 text-[15px] font-medium text-cream no-underline transition-colors hover:bg-paper-2"
        >
          오늘은 여기까지
        </Link>
        <button
          type="button"
          onClick={onRestart}
          className="group inline-flex items-center gap-3 rounded-full bg-amber py-3.5 pl-6 pr-4 text-[15px] font-medium text-white shadow-[0_10px_24px_-12px_rgba(196,103,63,0.65)] transition-all duration-[var(--dur-base)] ease-[var(--ease-spring)] hover:-translate-y-px hover:bg-amber-deep"
        >
          다시 돌아보기
          <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-white/20">
            <Icon name="solar:refresh-linear" width={16} height={16} />
          </span>
        </button>
      </div>
    </div>
  );
}
