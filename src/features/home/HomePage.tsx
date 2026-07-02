import { Link } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { Icon } from '@/components/Icon';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { useLearningFacade } from '@/features/auth/hooks/useLearningFacade';
import { useTodayReview } from '@/features/cards/hooks/useTodayReview';
import { useCompletedToday } from '@/features/cards/hooks/useCompletedToday';
import { useMySchedule } from '@/features/schedule/hooks/useMySchedule';

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
const WEEK_BARS = [
  { day: '월', height: 46, fill: 60 },
  { day: '화', height: 72, fill: 85 },
  { day: '수', height: 58, fill: 70 },
  { day: '목', height: 84, fill: 95 },
  { day: '금', height: 64, fill: 76 },
  { day: '토', height: 40, fill: 50 },
];

function greeting(hour: number) {
  if (hour < 5) return '늦은 밤이에요';
  if (hour < 12) return '좋은 아침이에요';
  if (hour < 18) return '좋은 오후예요';
  return '좋은 저녁이에요';
}

export function HomePage() {
  const user = useCurrentUser();
  const facade = useLearningFacade();
  const today = useTodayReview();
  const completedToday = useCompletedToday();
  const schedule = useMySchedule();
  const dailyTarget = schedule.data?.schedule.dailyTarget ?? null;
  const targetReached = dailyTarget !== null && completedToday.count >= dailyTarget;
  const targetPct =
    dailyTarget !== null
      ? Math.min(100, Math.round((completedToday.count / dailyTarget) * 100))
      : 0;

  const now = new Date();
  const nickname = user.data?.nickname ?? '도연';
  const dateLong = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일 ${DAYS[now.getDay()]}요일`;
  const dateLabel = `${now.getMonth() + 1}월 ${now.getDate()}일 (${DAYS[now.getDay()]})`;

  const sessionCards = today.data?.cards ?? [];
  const cardCount = sessionCards.length;
  const day1 = today.data?.stateBreakdown.DAY_1 ?? 0;
  const day3 = today.data?.stateBreakdown.DAY_3 ?? 0;
  const day7 = today.data?.stateBreakdown.DAY_7 ?? 0;
  const totalCards = day1 + day3 + day7;
  const preview = sessionCards.slice(0, 3);

  const axisCount = facade.data?.axes.length ?? 0;
  const topicCount = facade.data?.coverageSummary.totalTopics ?? 0;
  const concept = facade.data?.concepts?.[0] ?? '학습 지도';

  const sidebarContext = (
    <div className="flex flex-col gap-2.5">
      <div className="rounded-[14px] border border-edge bg-surface px-4 py-[15px]">
        <div className="mb-2.5 text-[11px] uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
          연속 학습
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-serif text-[28px] font-medium leading-none text-cream">12</span>
          <span className="text-xs text-cream-mute">일째 곁에 앉았어요</span>
        </div>
      </div>
      {dailyTarget !== null && (
        <div
          className={`rounded-[14px] border px-4 py-[15px] ${
            targetReached ? 'border-sage-soft bg-sage-soft/40' : 'border-edge bg-surface'
          }`}
        >
          <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
            <span>오늘 목표</span>
            {targetReached && (
              <span className="font-semibold normal-case tracking-normal text-sage-ink">
                달성 ✓
              </span>
            )}
          </div>
          <div className="mb-2 flex items-baseline gap-1.5">
            <span
              className={`font-serif text-[24px] font-medium leading-none tabular-nums ${
                targetReached ? 'text-sage-ink' : 'text-cream'
              }`}
            >
              {completedToday.count}
            </span>
            <span className="text-xs text-cream-mute">/ {dailyTarget}장</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-paper-2">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${targetPct}%`,
                background: targetReached
                  ? 'var(--color-sage)'
                  : 'linear-gradient(90deg, var(--color-amber), var(--color-amber-deep))',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );

  const topbar = (
    <>
      <div className="text-[13px] font-medium text-cream-mute">오늘</div>
      <div className="flex items-center gap-3">
        <span className="text-[13px] text-cream-faint">{dateLabel}</span>
        <Link
          to="/cards/new"
          className="inline-flex items-center gap-2 rounded-full border border-edge-strong bg-transparent px-4 py-2.5 text-[13px] font-medium text-cream-mute no-underline transition-all duration-[var(--dur-fast)] ease-[var(--ease-spring)] hover:bg-paper-2 hover:text-cream"
        >
          <Icon name="solar:add-square-linear" width={15} height={15} />
          새 카드
        </Link>
      </div>
    </>
  );

  return (
    <AppShell topbar={topbar} sidebarContext={sidebarContext}>
      <div className="mb-[34px]" style={{ animation: 'fadeInUp .5s var(--ease-spring) both' }}>
        <div className="mb-2.5 text-[13px] text-cream-faint">{dateLong}</div>
        <h1 className="m-0 mb-3 font-serif text-[42px] font-medium leading-[1.12] tracking-[-0.02em] text-cream break-keep">
          {greeting(now.getHours())}, {nickname}님.
          <br />
          <span className="text-cream-faint">오늘도 </span>
          <span className="italic text-amber">{cardCount}장</span>
          <span className="text-cream-faint">의 카드가 기다려요.</span>
        </h1>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-[1.55fr_1fr]">
        <div
          className="flex flex-col rounded-[20px] border border-edge bg-surface p-[30px]"
          style={{ animation: 'fadeInUp .5s var(--ease-spring) .05s both' }}
        >
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber" aria-hidden />
              <span className="text-[11px] uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
                오늘의 순환
              </span>
            </div>
            <span className="text-xs text-cream-faint">
              전체 {totalCards || cardCount}장 중 균형 잡힌 {cardCount}장
            </span>
          </div>

          <div className="mb-6 flex items-end gap-3.5">
            <span className="font-serif text-[60px] font-medium leading-[0.9] text-cream">
              {cardCount}
            </span>
            <div className="flex gap-2 pb-2">
              <DayChip label={`DAY 1 · ${day1}`} tone="clay" />
              <DayChip label={`DAY 3 · ${day3}`} tone="clay" />
              <DayChip label={`DAY 7 · ${day7}`} tone="sage" />
            </div>
          </div>

          <div className="mb-[26px] flex gap-3 overflow-hidden">
            {preview.map((card) => (
              <div
                key={card.cardId}
                className="flex-1 rounded-[14px] border border-edge bg-canvas p-4 transition-all duration-[var(--dur-fast)] ease-[var(--ease-spring)] hover:-translate-y-[3px] hover:border-amber-line"
              >
                <div className="mb-3 flex justify-between">
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-[0.06em] ${
                      card.state === 'DAY_7' ? 'text-sage-ink' : 'text-amber-deep'
                    }`}
                  >
                    {card.state.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-cream-faint">1/3</span>
                </div>
                <div className="mb-3 line-clamp-2 font-serif text-base font-medium leading-[1.35] text-cream break-keep">
                  {card.summary}
                </div>
                <span className="inline-block rounded-md bg-paper-2 px-2 py-0.5 text-[10px] text-cream-mute">
                  카드
                </span>
              </div>
            ))}
            {cardCount > preview.length && (
              <div className="grid w-16 flex-shrink-0 place-items-center rounded-[14px] border border-dashed border-edge-strong bg-paper-2 text-center text-[11px] leading-tight text-cream-faint">
                외
                <br />
                {cardCount - preview.length}장
              </div>
            )}
          </div>

          <div className="mt-auto flex items-center justify-between gap-4 border-t border-edge pt-[22px]">
            <span className="text-[13px] text-cream-mute">천천히 한 장씩 만나봐요</span>
            <Link
              to="/study"
              className="group inline-flex items-center gap-3 rounded-full bg-cream py-3.5 pl-7 pr-4 text-[15px] font-medium text-canvas no-underline transition-transform duration-[var(--dur-fast)] ease-[var(--ease-spring)] hover:translate-x-[3px]"
            >
              학습 시작하기
              <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-amber text-white">
                <Icon name="solar:arrow-right-linear" width={16} height={16} />
              </span>
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div
            className="rounded-[20px] border border-edge bg-surface p-[26px]"
            style={{ animation: 'fadeInUp .5s var(--ease-spring) .1s both' }}
          >
            <div className="mb-[18px] flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
                되어가는 나
              </span>
              <Link
                to="/map"
                className="text-xs text-cream-faint no-underline transition-colors hover:text-amber"
              >
                지도에서 보기 →
              </Link>
            </div>
            <div className="mb-2 flex items-baseline gap-1.5">
              <span className="font-serif text-[38px] font-medium leading-none text-cream">40</span>
              <span className="font-serif text-lg text-cream-faint">%</span>
              <span className="ml-2 text-[12.5px] text-cream-mute">선언한 나에 가까워지는 중</span>
            </div>
            <div className="mb-[18px] h-[7px] overflow-hidden rounded-full bg-paper-2">
              <div
                className="h-full rounded-full"
                style={{
                  width: '40%',
                  background: 'linear-gradient(90deg, var(--color-amber), var(--color-amber-deep))',
                  animation: 'scaleIn .8s var(--ease-spring) .3s both',
                  transformOrigin: 'left',
                }}
              />
            </div>
            <div className="text-[13px] leading-[1.6] text-cream-mute break-keep">
              강한 노드가 <span className="font-medium text-cream">{concept}</span> 쪽으로 쏠려 있어요. 오늘 단련하면 그 형태가 더 또렷해집니다.
            </div>
          </div>

          <div
            className="flex-1 rounded-[20px] border border-edge bg-surface p-[26px]"
            style={{ animation: 'fadeInUp .5s var(--ease-spring) .15s both' }}
          >
            <div className="mb-[22px] flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
                이번 주 흐름
              </span>
              <span className="text-xs text-cream-mute">68장 만남</span>
            </div>
            <div className="flex h-24 items-end justify-between gap-2.5">
              {WEEK_BARS.map((bar) => (
                <div key={bar.day} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="flex w-full max-w-[26px] items-end overflow-hidden rounded-[7px] bg-paper-2"
                    style={{ height: `${bar.height}px` }}
                  >
                    <div className="w-full bg-amber-soft" style={{ height: `${bar.fill}%` }} />
                  </div>
                  <span className="text-[11px] text-cream-faint">{bar.day}</span>
                </div>
              ))}
              <div className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="flex w-full max-w-[26px] items-end overflow-hidden rounded-[7px] bg-amber-soft"
                  style={{ height: '80px' }}
                >
                  <div className="w-full bg-amber" style={{ height: '34%' }} />
                </div>
                <span className="text-[11px] font-semibold text-amber-deep">오늘</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="grid grid-cols-1 gap-5 sm:grid-cols-3"
        style={{ animation: 'fadeInUp .5s var(--ease-spring) .2s both' }}
      >
        <JumpCard
          to="/map"
          icon="solar:book-2-linear"
          title="학습 지도"
          subtitle={`${axisCount}개 축 · ${topicCount}개 주제`}
        />
        <JumpCard
          to="/archive"
          icon="solar:archive-linear"
          title="보관함"
          subtitle="배경으로 쉬는 카드"
        />
        <JumpCard
          to="/tags"
          icon="solar:tag-linear"
          title="태그"
          subtitle="자료를 묶는 결"
        />
      </div>

    </AppShell>
  );
}

function DayChip({ label, tone }: { label: string; tone: 'clay' | 'sage' }) {
  return (
    <span
      className={`rounded-full px-3 py-[5px] text-xs font-semibold ${
        tone === 'sage'
          ? 'bg-sage-soft text-sage-ink'
          : 'bg-amber-soft text-amber-deep'
      }`}
    >
      {label}
    </span>
  );
}

function JumpCard({
  to,
  icon,
  title,
  subtitle,
}: {
  to: string;
  icon: string;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-[18px] rounded-[18px] border border-edge bg-paper-2 p-6 no-underline transition-all duration-[var(--dur-fast)] ease-[var(--ease-spring)] hover:border-amber-line hover:bg-surface"
    >
      <span className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-[13px] border border-edge bg-surface text-cream transition-all duration-[var(--dur-fast)] ease-[var(--ease-spring)] group-hover:bg-amber group-hover:text-white">
        <Icon name={icon} width={22} height={22} />
      </span>
      <div>
        <div className="mb-[3px] font-serif text-lg font-medium text-cream">{title}</div>
        <div className="text-[12.5px] text-cream-faint">{subtitle}</div>
      </div>
    </Link>
  );
}
