import { Link } from 'react-router-dom';
import { Icon } from '@/components/Icon';
import { useExtendSession } from '../hooks/useExtendSession';

interface Props {
  metCount: number;
  archivedCount: number;
  onRestart: () => void;
}

export function TodayEmptyView({ metCount, archivedCount, onRestart }: Props) {
  const extend = useExtendSession();

  const requestMore = () => {
    extend.mutate(10, {
      onSuccess: (res) => {
        if (!res.completedAll) onRestart();
      },
    });
  };

  return (
    <div
      className="w-full max-w-[520px] text-center"
      style={{ animation: 'fadeInUp .45s var(--ease-spring) both' }}
    >
      <div className="mx-auto mb-7 grid h-[74px] w-[74px] place-items-center rounded-full bg-amber-soft text-amber-deep">
        <Icon name="solar:check-circle-linear" width={36} height={36} />
      </div>
      <h1 className="m-0 mb-4 font-serif text-[44px] font-medium leading-[1.1] tracking-[-0.02em] text-cream">
        오늘 순환을 <span className="italic text-amber">마쳤어요.</span>
      </h1>
      <p className="m-0 mb-8 mx-auto max-w-[42ch] text-base leading-[1.7] text-cream-mute break-keep">
        충분히 만난 카드는 잠시 배경에서 쉬어요. 잊을 만하면 다시 곁으로 돌아옵니다.
      </p>

      <div className="mb-9 flex justify-center gap-3.5">
        <div className="w-40 rounded-[16px] border border-edge bg-surface p-5">
          <div className="font-serif text-[34px] font-medium leading-none text-cream">
            {metCount}
          </div>
          <div className="mt-[7px] text-xs text-cream-faint">오늘 만난 카드</div>
        </div>
        <div className="w-40 rounded-[16px] border border-edge bg-surface p-5">
          <div className="font-serif text-[34px] font-medium leading-none text-sage-ink">
            {archivedCount}
          </div>
          <div className="mt-[7px] text-xs text-cream-faint">배경으로 보낸 카드</div>
        </div>
      </div>

      <div className="flex justify-center gap-3">
        <Link
          to="/home"
          className="inline-flex items-center rounded-full border border-edge-strong bg-transparent px-6 py-3.5 text-[15px] font-medium text-cream no-underline transition-colors hover:bg-paper-2"
        >
          오늘은 여기까지
        </Link>
        <button
          type="button"
          onClick={requestMore}
          disabled={extend.isPending}
          className="group inline-flex items-center gap-3 rounded-full bg-amber py-3.5 pl-6 pr-4 text-[15px] font-medium text-white shadow-[0_10px_24px_-12px_rgba(196,103,63,0.65)] transition-all duration-[var(--dur-base)] ease-[var(--ease-spring)] hover:-translate-y-px hover:bg-amber-deep disabled:opacity-50"
        >
          {extend.isPending ? '이어가는 중…' : '조금 더 이어가기'}
          <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-white/20 transition-transform duration-[var(--dur-base)] ease-[var(--ease-spring)] group-hover:translate-x-0.5">
            <Icon name="solar:refresh-linear" width={16} height={16} />
          </span>
        </button>
      </div>
    </div>
  );
}
