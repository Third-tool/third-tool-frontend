import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { track } from '@/lib/analytics/track';
import { Icon } from '@/components/Icon';
import { MarkdownView } from '@/components/MarkdownView';
import { ApiError } from '@/lib/api/client';
import { useLearningFacade } from '@/features/auth/hooks/useLearningFacade';
import { useStartReview, reviewSessionKey } from './hooks/useStartReview';
import { useFlipToComparing } from './hooks/useFlipToComparing';
import { useMoveToNext } from './hooks/useMoveToNext';
import { bumpCompletedToday, useCompletedToday } from './hooks/useCompletedToday';
import { useMySchedule } from '@/features/schedule/hooks/useMySchedule';
import { toastStore } from '@/lib/toast/toastQueue';
import { useQuery } from '@tanstack/react-query';
import { getReviewSession } from '@/lib/api/endpoints/review';
import type { ReviewCard, ReviewSessionResponse } from '@/lib/api/schemas/review';

export function StudyPage() {
  // M5 재편(2026-07-22+): Deck 폐기 · Axis 기반 auto-start.
  // 정상 흐름은 /review [학습 시작] → useReviewSession (batch 참조) · sessionId 응답.
  // StudyPage 직접 진입 시 fallback: facade.axes[0]로 axis-scope 세션 시도.
  const facade = useLearningFacade();
  const defaultAxisId = facade.data?.axes[0]?.axisId ?? null;

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [completedCardCount, setCompletedCardCount] = useState(0);
  const [startError, setStartError] = useState<string | null>(null);
  const startedRef = useRef<string | null>(null);
  const targetToastFiredRef = useRef(false);

  const start = useStartReview();
  const flip = useFlipToComparing(sessionId);
  const advance = useMoveToNext(sessionId);
  const completedToday = useCompletedToday();
  const scheduleQuery = useMySchedule();
  const dailyTarget = scheduleQuery.data?.schedule.dailyTarget ?? null;

  const sessionQuery = useQuery({
    queryKey: sessionId ? reviewSessionKey(sessionId) : ['reviews', 'idle'],
    queryFn: () => getReviewSession(sessionId!),
    enabled: Boolean(sessionId),
    staleTime: Infinity,
  });
  const session = sessionQuery.data ?? null;

  useEffect(() => {
    if (!defaultAxisId) return;
    if (startedRef.current === defaultAxisId) return;
    startedRef.current = defaultAxisId;
    setStartError(null);
    setCompletedCardCount(0);
    start.mutate(defaultAxisId, {
      onSuccess: (res) => {
        setSessionId(res.sessionId);
        track('review_session_opened', { totalCardCount: res.totalCardCount });
      },
      onError: (err) => {
        startedRef.current = null;
        setStartError(err instanceof ApiError ? err.message : '세션을 시작할 수 없어요.');
      },
    });
  }, [defaultAxisId, start]);

  useEffect(() => {
    if (session?.isFinished) track('review_session_completed');
  }, [session?.isFinished]);

  const handleFlip = () => {
    if (!sessionId || flip.isPending) return;
    flip.mutate();
  };

  const handleNext = () => {
    if (!sessionId || advance.isPending) return;
    advance.mutate(undefined, {
      onSuccess: () => {
        setCompletedCardCount((s) => s + 1);
        const before = completedToday.count;
        const after = bumpCompletedToday();
        if (
          dailyTarget !== null &&
          !targetToastFiredRef.current &&
          before < dailyTarget &&
          after >= dailyTarget
        ) {
          targetToastFiredRef.current = true;
          toastStore.push({
            message: `오늘 목표 ${dailyTarget}장을 모두 마쳤어요. 더 이어가도 좋아요.`,
            tone: 'amber',
          });
        }
      },
    });
  };

  const restart = () => {
    if (!defaultAxisId) return;
    setSessionId(null);
    setCompletedCardCount(0);
    startedRef.current = null;
    targetToastFiredRef.current = false;
    setStartError(null);
  };

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-canvas text-cream">
      <TopBar session={session} />

      <div className="relative z-10 flex flex-1 items-start justify-center px-7 pb-20 pt-2">
        {!defaultAxisId && !facade.isLoading && <NoDeckPanel />}

        {start.isPending && !session && (
          <LoadingPanel message="복습 세션을 준비하는 중…" />
        )}

        {startError && !session && (
          <ErrorPanel message={startError} onRetry={restart} />
        )}

        {session && session.isFinished && (
          <DonePanel
            completedCardCount={completedCardCount}
            completedToday={completedToday.count}
            dailyTarget={dailyTarget}
            onRestart={restart}
          />
        )}

        {session && !session.isFinished && session.currentCard && (
          <CornellSheet
            card={session.currentCard}
            isFlipPending={flip.isPending}
            isAdvancePending={advance.isPending}
            onFlip={handleFlip}
            onNext={handleNext}
          />
        )}
      </div>
    </div>
  );
}

function TopBar({ session }: { session: ReviewSessionResponse | null }) {
  const total = session?.totalCardCount ?? 0;
  const index = session?.currentIndex ?? 0;
  return (
    <div className="relative z-10 mx-auto flex w-full max-w-[1000px] items-center gap-6 px-7 py-[22px]">
      <Link
        to="/home"
        className="inline-flex flex-shrink-0 items-center gap-2 text-[13px] text-cream-faint no-underline transition-colors hover:text-cream"
      >
        <Icon name="solar:close-circle-linear" width={16} height={16} />
        나가기
      </Link>
      <div className="flex flex-1 gap-1.5">
        {Array.from({ length: Math.max(total, 1) }).map((_, i) => (
          <span
            key={i}
            className="h-1 flex-1 rounded-full transition-colors duration-[var(--dur-base)] ease-[var(--ease-spring)]"
            style={{
              background: i < index ? 'var(--color-amber)' : 'var(--color-edge-strong)',
            }}
          />
        ))}
      </div>
      <span className="flex-shrink-0 text-[12.5px] tabular-nums text-cream-faint">
        {total === 0 ? '0 / 0' : `${Math.min(index + 1, total)} / ${total}`}
      </span>
    </div>
  );
}

function CornellSheet({
  card,
  isFlipPending,
  isAdvancePending,
  onFlip,
  onNext,
}: {
  card: ReviewCard;
  isFlipPending: boolean;
  isAdvancePending: boolean;
  onFlip: () => void;
  onNext: () => void;
}) {
  const isComparing = card.reviewStep === 'COMPARING';
  const cues = card.keywordCues ?? [];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return;
      if (!isComparing && (e.code === 'Space' || e.key === 'Enter')) {
        e.preventDefault();
        onFlip();
        return;
      }
      if (isComparing && e.key === 'Enter') {
        e.preventDefault();
        onNext();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isComparing, onFlip, onNext]);

  return (
    <div className="w-full max-w-[1000px]">
      <div
        className="overflow-hidden rounded-[22px] border border-edge bg-surface shadow-[0_34px_80px_-42px_rgba(33,31,26,0.4)]"
        style={{ animation: 'fadeInUp .4s var(--ease-spring) both' }}
      >
        <div className="flex items-center justify-between gap-4 border-b border-edge bg-paper-2 px-7 py-[22px]">
          <div className="min-w-0">
            <div className="mb-1.5 flex items-center gap-2.5">
              <span className="rounded-full bg-amber-soft px-2.5 py-1 text-[11px] font-semibold tracking-[0.04em] text-amber-deep">
                {isComparing ? 'COMPARING' : 'RECALLING'}
              </span>
              {card.isLastView && (
                <span className="text-[11px] text-sage-ink">· 마지막 노출</span>
              )}
            </div>
            <h2 className="m-0 truncate font-serif text-[25px] font-semibold tracking-[-0.01em] text-cream">
              {isComparing ? '내가 떠올린 것과 자료를 비교' : '자료만 보고 단서를 떠올려보기'}
            </h2>
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="text-xs text-cream-mute">카드 #{card.cardOrder}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[226px_1fr]">
          <div className="flex flex-col border-b border-edge bg-[rgba(243,239,230,0.5)] px-5 py-6 lg:border-b-0 lg:border-r">
            <div className="mb-4 flex items-center gap-[7px]">
              <span className="font-serif text-[15px] italic text-amber">단서</span>
              <span className="text-[10.5px] uppercase tracking-[0.06em] text-cream-faint">
                Cue
              </span>
            </div>

            {isComparing ? (
              <div
                className="flex flex-col gap-2.5"
                style={{ animation: 'fadeInUp .35s var(--ease-spring) both' }}
              >
                {cues.length === 0 ? (
                  <span className="text-[12px] text-cream-faint">단서가 없어요.</span>
                ) : (
                  cues.map((k, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 rounded-[11px] border border-amber-line bg-surface px-3.5 py-2.5"
                    >
                      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-amber" />
                      <span className="text-sm font-medium text-cream break-keep">{k.value}</span>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={onFlip}
                disabled={isFlipPending}
                className="flex min-h-[140px] flex-1 flex-col items-center justify-center gap-3 rounded-[13px] border-[1.5px] border-dashed border-edge-strong bg-transparent p-5 transition-all duration-[var(--dur-fast)] ease-[var(--ease-spring)] hover:border-amber-line hover:bg-amber-soft disabled:opacity-50"
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

            {isComparing && (
              <span className="mt-3.5 text-[11px] leading-[1.5] text-cream-faint break-keep">
                자료를 보고 이 단서들이 떠올랐나요?
              </span>
            )}
          </div>

          <div className="max-h-[560px] overflow-y-auto px-[34px] py-[30px]">
            <div className="mb-[18px] flex items-center gap-[7px]">
              <span className="font-serif text-[15px] italic text-cream-faint">노트</span>
              <span className="text-[10.5px] uppercase tracking-[0.06em] text-cream-faint">
                Material
              </span>
              <span aria-hidden className="h-px flex-1 bg-edge" />
            </div>
            <MarkdownView source={card.mainNote.text} />
          </div>
        </div>

        <div className="border-t border-edge bg-[rgba(243,239,230,0.5)] px-7 py-[22px]">
          <div className="mb-3.5 flex items-center gap-[7px]">
            <span className="font-serif text-[15px] italic text-amber">요약</span>
            <span className="text-[10.5px] uppercase tracking-[0.06em] text-cream-faint">
              Summary · 내 언어로
            </span>
          </div>
          {isComparing ? (
            <p
              className="m-0 font-serif text-[20px] font-medium leading-[1.5] text-cream break-keep"
              style={{ animation: 'fadeInUp .35s var(--ease-spring) .05s both' }}
            >
              {card.summary || '요약이 없어요.'}
            </p>
          ) : (
            <button
              type="button"
              onClick={onFlip}
              disabled={isFlipPending}
              className="flex w-full items-center justify-center gap-2.5 rounded-[13px] border-[1.5px] border-dashed border-edge-strong bg-transparent p-[18px] text-[13px] font-medium text-cream-faint transition-all duration-[var(--dur-fast)] ease-[var(--ease-spring)] hover:border-amber-line hover:bg-amber-soft hover:text-amber-deep disabled:opacity-50"
            >
              <Icon name="solar:eye-linear" width={16} height={16} />
              자료의 핵심을 한 문장으로 떠올린 뒤 펼치기
            </button>
          )}
        </div>
      </div>

      <div className="mt-[22px] flex items-center justify-end gap-3.5">
        {isComparing ? (
          <button
            type="button"
            onClick={onNext}
            disabled={isAdvancePending}
            className="group inline-flex items-center gap-3 rounded-full bg-amber py-3.5 pl-[26px] pr-4 text-[15px] font-medium text-white shadow-[0_10px_24px_-12px_rgba(196,103,63,0.65)] transition-all duration-[var(--dur-base)] ease-[var(--ease-spring)] hover:-translate-y-px hover:bg-amber-deep disabled:opacity-50"
          >
            {isAdvancePending ? '다음 카드…' : card.isLastView ? '복습 마무리' : '다음 카드'}
            <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-white/20 text-[11px] font-semibold">
              Enter
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onFlip}
            disabled={isFlipPending}
            className="group inline-flex items-center gap-3 rounded-full bg-amber py-3.5 pl-[26px] pr-4 text-[15px] font-medium text-white shadow-[0_10px_24px_-12px_rgba(196,103,63,0.65)] transition-all duration-[var(--dur-base)] ease-[var(--ease-spring)] hover:-translate-y-px hover:bg-amber-deep disabled:opacity-50"
          >
            {isFlipPending ? '펼치는 중…' : '단서 · 요약 펼쳐서 확인'}
            <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-white/20 text-[11px] font-semibold">
              Space
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

function DonePanel({
  completedCardCount,
  completedToday,
  dailyTarget,
  onRestart,
}: {
  completedCardCount: number;
  completedToday: number;
  dailyTarget: number | null;
  onRestart: () => void;
}) {
  const targetReached = dailyTarget !== null && completedToday >= dailyTarget;
  const remaining =
    dailyTarget !== null ? Math.max(0, dailyTarget - completedToday) : 0;
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
      <div className="mb-7 flex justify-center gap-3.5">
        <div className="w-[200px] rounded-[16px] border border-edge bg-surface p-5">
          <div className="font-serif text-[32px] font-medium leading-none text-cream">
            {completedCardCount}
          </div>
          <div className="mt-[7px] text-xs text-cream-faint">오늘 만난 카드</div>
        </div>
        {dailyTarget !== null && (
          <div
            className={`w-[200px] rounded-[16px] border p-5 ${
              targetReached
                ? 'border-sage-soft bg-sage-soft/40'
                : 'border-edge bg-surface'
            }`}
          >
            <div
              className={`font-serif text-[32px] font-medium leading-none ${
                targetReached ? 'text-sage-ink' : 'text-cream'
              }`}
            >
              {completedToday}
              <span className="text-[18px] text-cream-faint"> / {dailyTarget}</span>
            </div>
            <div className="mt-[7px] text-xs text-cream-faint">오늘 누적</div>
          </div>
        )}
      </div>
      {dailyTarget !== null && targetReached && (
        <div className="mx-auto mb-9 inline-flex items-center gap-2 rounded-full bg-sage-soft px-4 py-2 text-[12.5px] font-semibold text-sage-ink">
          <Icon name="solar:check-circle-linear" width={14} height={14} />
          오늘 목표 달성
        </div>
      )}
      {dailyTarget !== null && !targetReached && remaining > 0 && (
        <p className="m-0 mb-9 text-[12.5px] text-cream-faint">
          목표까지 <span className="font-semibold text-cream-mute">{remaining}장</span> 남았어요.
        </p>
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

function NoDeckPanel() {
  return (
    <div
      className="w-full max-w-[480px] pt-12 text-center"
      style={{ animation: 'fadeInUp .4s var(--ease-spring) both' }}
    >
      <div className="mx-auto mb-6 grid h-[68px] w-[68px] place-items-center rounded-full bg-paper-2 text-cream-faint">
        <Icon name="solar:folder-linear" width={30} height={30} />
      </div>
      <h1 className="m-0 mb-3 font-serif text-[32px] font-medium leading-[1.15] tracking-[-0.02em] text-cream break-keep">
        먼저 축을 만들어주세요
      </h1>
      <p className="m-0 mb-7 text-[14px] leading-[1.7] text-cream-mute break-keep">
        복습 세션은 축에 연결된 카드로 시작돼요.
      </p>
      <div className="flex justify-center gap-3">
        <Link
          to="/map"
          className="inline-flex items-center gap-2 rounded-full bg-amber px-6 py-3 text-[14px] font-medium text-white no-underline shadow-[0_10px_24px_-12px_rgba(196,103,63,0.65)] hover:bg-amber-deep"
        >
          <Icon name="solar:map-linear" width={15} height={15} />
          지도로 이동
        </Link>
        <Link
          to="/home"
          className="inline-flex items-center rounded-full border border-edge-strong bg-transparent px-6 py-3 text-[14px] font-medium text-cream-mute no-underline transition-colors hover:bg-paper-2"
        >
          홈으로
        </Link>
      </div>
    </div>
  );
}

function LoadingPanel({ message }: { message: string }) {
  return (
    <div className="w-full max-w-[480px] pt-16 text-center">
      <p className="m-0 text-[14px] text-cream-faint">{message}</p>
    </div>
  );
}

function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="w-full max-w-[480px] pt-16 text-center">
      <p className="m-0 mb-5 text-[14px] text-amber-deep">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-full border border-edge-strong bg-transparent px-5 py-2.5 text-[13px] font-medium text-cream-mute transition-colors hover:bg-paper-2 hover:text-cream"
      >
        <Icon name="solar:refresh-linear" width={14} height={14} />
        다시 시도
      </button>
    </div>
  );
}
