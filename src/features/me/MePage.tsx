import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { Icon } from '@/components/Icon';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { useLearningFacade } from '@/features/auth/hooks/useLearningFacade';
import { useArchive } from '@/features/cards/hooks/useArchive';
import { useAuth } from '@/features/auth/hooks/useAuth';

type Plan = 'free' | 'pro';

const STATS_DELAYS = ['0ms', '40ms', '80ms', '120ms'];

const LIBRARY = [
  { kind: '책', detail: 'Effective Java · DDD · DDIA', count: 3, icon: 'solar:book-linear', tone: 'amber' },
  { kind: '강의', detail: '인프런 · 유데미', count: 2, icon: 'solar:videocamera-record-linear', tone: 'paper' },
  { kind: 'AI 대화', detail: '정리한 학습 대화', count: 12, icon: 'solar:magic-stick-3-linear', tone: 'sage' },
  { kind: '웹 · 아티클', detail: '북마크한 글', count: 7, icon: 'solar:link-linear', tone: 'paper' },
] as const;

const QUICK_LINKS = [
  { label: '알림', sub: '순환 리마인더', icon: 'solar:bell-linear' },
  { label: '계정', sub: '이메일 · 비밀번호', icon: 'solar:user-id-linear' },
  { label: '데이터 내보내기', sub: '카드·지도 백업', icon: 'solar:cloud-download-linear' },
  { label: '로그아웃', sub: '안전하게 나가기', icon: 'solar:logout-2-linear' },
] as const;

const TONE_CLASS: Record<'amber' | 'paper' | 'sage', { bg: string; color: string }> = {
  amber: { bg: 'bg-amber-soft', color: 'text-amber-deep' },
  paper: { bg: 'bg-paper-2', color: 'text-cream-mute' },
  sage: { bg: 'bg-sage-soft', color: 'text-sage-ink' },
};

export function MePage() {
  const user = useCurrentUser();
  const facade = useLearningFacade();
  const archive = useArchive(null);
  const auth = useAuth();
  const [plan, setPlan] = useState<Plan>('free');

  const nickname = user.data?.nickname ?? '도연';
  const initial = nickname.slice(0, 1);
  const identity = facade.data?.concept ?? '결제·정산 도메인을 스스로 저술할 수 있는 백엔드 엔지니어';
  const archiveCount = archive.data?.length ?? 0;
  const masteredCount = Math.max(0, Math.floor(archiveCount / 2));
  const fieldCount = 47; // demo until backend exposes on-field count

  const topbar = (
    <>
      <div className="flex items-center gap-2.5 text-[13px] text-cream-faint">
        <span>나</span>
        <span className="opacity-50">/</span>
        <span className="font-medium text-cream-mute">프로필</span>
      </div>
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-full border border-edge-strong bg-transparent px-4 py-2.5 text-[13px] font-medium text-cream-mute transition-colors hover:bg-paper-2 hover:text-cream"
      >
        <Icon name="solar:pen-2-linear" width={15} height={15} />
        프로필 수정
      </button>
    </>
  );

  const pro = plan === 'pro';
  const invoices = pro
    ? [
        { date: '2026.06.01', plan: '프로 · 월간', amount: '₩9,900' },
        { date: '2026.05.01', plan: '프로 · 월간', amount: '₩9,900' },
        { date: '2026.04.01', plan: '프로 · 월간', amount: '₩9,900' },
      ]
    : [];

  const stats = [
    { value: fieldCount, unit: '장', label: '필드의 카드', color: 'text-cream', icon: 'solar:notebook-square-linear' },
    { value: archiveCount, unit: '장', label: '보관함', color: 'text-cream', icon: 'solar:archive-linear' },
    { value: masteredCount, unit: '장', label: '마스터', color: 'text-sage-ink', icon: 'solar:medal-ribbon-linear' },
    { value: 128, unit: '회', label: '순환 완료', color: 'text-amber-deep', icon: 'solar:refresh-linear' },
  ];

  const libCount = LIBRARY.reduce((a, l) => a + l.count, 0);

  const handleLogout = () => {
    auth.clear();
    window.location.href = '/';
  };

  return (
    <AppShell topbar={topbar}>
      <div
        className="mb-9 flex items-center gap-[26px]"
        style={{ animation: 'fadeInUp .5s var(--ease-spring) both' }}
      >
        <span
          className="grid h-[88px] w-[88px] flex-shrink-0 place-items-center rounded-full border border-amber-line bg-amber-soft font-serif text-[40px] font-medium text-amber-deep"
          aria-hidden
        >
          {initial}
        </span>
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <h1 className="m-0 font-serif text-[38px] font-medium leading-none tracking-[-0.02em] text-cream">
              {nickname}
            </h1>
            <span className="rounded-full bg-sage-soft px-2.5 py-1 text-[11.5px] font-semibold text-sage-ink">
              연속 12일
            </span>
          </div>
          <p className="m-0 mb-1.5 font-serif text-lg italic text-cream-mute break-keep">
            "{identity}"
          </p>
          <span className="text-[12.5px] text-cream-faint">
            주니어 백엔드 · 2025년 11월부터 곁에 앉는 중
          </span>
        </div>
      </div>

      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className="rounded-[18px] border border-edge bg-surface p-[22px] transition-colors hover:border-amber-line"
            style={{ animation: `fadeInUp .5s var(--ease-spring) ${STATS_DELAYS[i]} both` }}
          >
            <div className="mb-3.5 flex items-center gap-2 text-cream-faint">
              <Icon name={s.icon} width={18} height={18} />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className={`font-serif text-[34px] font-medium leading-none ${s.color}`}>
                {s.value}
              </span>
              <span className="text-[13px] text-cream-faint">{s.unit}</span>
            </div>
            <div className="mt-2 text-[12.5px] text-cream-faint">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* LEFT: Library + quick links */}
        <div className="flex flex-col gap-5">
          <div
            className="rounded-[20px] border border-edge bg-surface p-[26px]"
            style={{ animation: 'fadeInUp .5s var(--ease-spring) .1s both' }}
          >
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="font-serif text-[19px] font-medium text-cream">내 라이브러리</span>
                <span className="rounded-full bg-paper-2 px-2.5 py-0.5 text-[11px] tabular-nums text-cream-faint">
                  {libCount}
                </span>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full border border-edge-strong bg-transparent px-3 py-1.5 text-xs font-medium text-cream-mute transition-colors hover:bg-paper-2 hover:text-cream"
              >
                ＋ 자료 연결
              </button>
            </div>
            <div className="flex flex-col">
              {LIBRARY.map((l) => {
                const tone = TONE_CLASS[l.tone];
                return (
                  <div
                    key={l.kind}
                    className="-mx-3 flex items-center gap-3.5 border-b border-edge px-3 py-3.5 last:border-b-0 hover:bg-paper-2"
                  >
                    <span
                      className={`grid h-[38px] w-[38px] flex-shrink-0 place-items-center rounded-[11px] ${tone.bg} ${tone.color}`}
                    >
                      <Icon name={l.icon} width={18} height={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-cream">{l.kind}</div>
                      <div className="text-xs text-cream-faint">{l.detail}</div>
                    </div>
                    <span className="flex-shrink-0 font-serif text-xl font-medium text-cream">
                      {l.count}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-[13px] border border-dashed border-edge-strong bg-paper-2 p-4">
              <span className="grid h-[34px] w-[34px] flex-shrink-0 place-items-center rounded-full bg-surface text-amber-deep">
                <Icon name="solar:magic-stick-3-linear" width={17} height={17} />
              </span>
              <div className="text-[12.5px] leading-[1.5] text-cream-mute break-keep">
                <span className="font-semibold text-cream">라이브러리 확장 예정</span> — 노션·PDF·유튜브 강의를 곧 한곳에서 카드로 묶을 수 있어요.
              </div>
            </div>
          </div>

          <div
            className="rounded-[20px] border border-edge bg-surface p-[26px]"
            style={{ animation: 'fadeInUp .5s var(--ease-spring) .15s both' }}
          >
            <span className="mb-4 block font-serif text-[19px] font-medium text-cream">계정 · 데이터</span>
            <div className="grid grid-cols-2 gap-3">
              {QUICK_LINKS.map((q) => {
                const isLogout = q.label === '로그아웃';
                return (
                  <button
                    key={q.label}
                    type="button"
                    onClick={isLogout ? handleLogout : undefined}
                    className="group flex items-center gap-3 rounded-[14px] border border-edge bg-paper-2 p-4 text-left transition-all duration-[var(--dur-fast)] ease-[var(--ease-spring)] hover:border-amber-line hover:bg-surface"
                  >
                    <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-[10px] border border-edge bg-surface text-cream transition-colors group-hover:bg-amber group-hover:text-white">
                      <Icon name={q.icon} width={17} height={17} />
                    </span>
                    <div>
                      <div className="text-sm font-medium text-cream">{q.label}</div>
                      <div className="text-[11.5px] text-cream-faint">{q.sub}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: Billing */}
        <div className="flex flex-col gap-5">
          <div
            className="rounded-[20px] border border-edge bg-surface p-[26px]"
            style={{ animation: 'fadeInUp .5s var(--ease-spring) .12s both' }}
          >
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-[0.08em] text-cream-faint">
                현재 멤버십
              </span>
              <span className="rounded-full bg-sage-soft px-2.5 py-1 text-[11px] font-semibold text-sage-ink">
                활성
              </span>
            </div>
            <div className="mb-[18px] flex items-baseline gap-2.5">
              <span className="font-serif text-[30px] font-medium text-cream">
                {pro ? '프로' : '무료'}
              </span>
              <span className="text-[13px] text-cream-faint">
                {pro ? '₩9,900 / 월' : '₩0'}
              </span>
            </div>

            <div className="mb-[18px]">
              <div className="mb-2 flex justify-between text-[12.5px] text-cream-mute">
                <span>이번 달 카드</span>
                <span className="tabular-nums">47 / {pro ? '무제한' : 60}</span>
              </div>
              <div className="h-[7px] overflow-hidden rounded-full bg-paper-2">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: pro ? '24%' : '78%',
                    background: 'linear-gradient(90deg, var(--color-amber), var(--color-amber-deep))',
                  }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setPlan(pro ? 'free' : 'pro')}
              className={`inline-flex w-full items-center justify-center gap-2.5 rounded-[12px] border-0 px-5 py-3.5 text-sm font-medium transition-all duration-[var(--dur-base)] ease-[var(--ease-spring)] hover:-translate-y-px ${
                pro
                  ? 'bg-paper-2 text-cream'
                  : 'bg-amber text-white shadow-[0_10px_24px_-12px_rgba(196,103,63,0.65)] hover:bg-amber-deep'
              }`}
            >
              {pro ? '무료로 전환' : '프로로 올리기'}
              <Icon name="solar:arrow-right-linear" width={15} height={15} />
            </button>
            {pro && (
              <p className="m-0 mt-3 text-center text-[11.5px] text-cream-faint">
                다음 결제 2026.07.01 · 언제든 해지 가능
              </p>
            )}
          </div>

          <div
            className="rounded-[20px] border border-edge bg-surface p-[26px]"
            style={{ animation: 'fadeInUp .5s var(--ease-spring) .17s both' }}
          >
            <div className="mb-[18px] flex items-center justify-between">
              <span className="font-serif text-[19px] font-medium text-cream">결제</span>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full border border-edge-strong bg-transparent px-3 py-1.5 text-xs font-medium text-cream-mute transition-colors hover:bg-paper-2 hover:text-cream"
              >
                관리
              </button>
            </div>

            <div className="mb-[18px] flex items-center gap-3.5 rounded-[13px] border border-edge bg-paper-2 p-3.5">
              <span
                className="grid h-[30px] w-[44px] flex-shrink-0 place-items-center rounded-md bg-cream font-serif text-xs font-semibold text-canvas"
                aria-hidden
              >
                VISA
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-medium tabular-nums text-cream">•••• 4242</div>
                <div className="text-[11.5px] text-cream-faint">
                  {pro ? '다음 결제일 2026.07.01' : '등록됨 · 결제 없음'}
                </div>
              </div>
              <span className="text-[11.5px] text-sage-ink">기본</span>
            </div>

            <span className="mb-2.5 block text-[11px] uppercase tracking-[0.06em] text-cream-faint">
              최근 결제 내역
            </span>
            {invoices.length > 0 ? (
              <div className="flex flex-col">
                {invoices.map((iv) => (
                  <div
                    key={iv.date}
                    className="flex items-center justify-between gap-3 border-b border-edge py-2.5 last:border-b-0"
                  >
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-medium text-cream">{iv.date}</div>
                      <div className="text-[11.5px] text-cream-faint">{iv.plan}</div>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-3">
                      <span className="text-[13.5px] tabular-nums text-cream-mute">{iv.amount}</span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-sage-ink">
                        <span aria-hidden className="h-1 w-1 rounded-full bg-sage" />
                        완료
                      </span>
                      <Link
                        to="#"
                        title="영수증"
                        className="grid h-7 w-7 place-items-center rounded-lg border border-edge text-cream-faint no-underline hover:border-amber-line hover:text-amber"
                      >
                        <Icon name="solar:download-linear" width={14} height={14} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="m-0 mt-3.5 text-xs leading-[1.55] text-cream-faint break-keep">
                무료 플랜은 결제 내역이 없어요. 프로로 올리면 영수증이 여기에 쌓입니다.
              </p>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
