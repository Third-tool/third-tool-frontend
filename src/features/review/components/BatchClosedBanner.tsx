import { useEffect, useState } from 'react';
import { Icon } from '@/components/Icon';

// product-review (FE) Epic 1 Story 1-5 · M5 신설 (2026-07-22+).
// 자정 close 이후 진입 시 상단 안내 · sessionStorage 저장 · [닫기] 후 재표시 안 함 (DF-17).
// closedAt이 null이면 렌더 안 함.
interface Props {
  closedAt: string | null | undefined;
  missedCount?: number;
}

const STORAGE_KEY_PREFIX = 'batch-closed-banner-dismissed-';

function isDismissed(closedAt: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.sessionStorage.getItem(STORAGE_KEY_PREFIX + closedAt) === '1';
  } catch {
    return false;
  }
}

function markDismissed(closedAt: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY_PREFIX + closedAt, '1');
  } catch {
    // sessionStorage 접근 실패 무시.
  }
}

export function BatchClosedBanner({ closedAt, missedCount }: Props) {
  const [visible, setVisible] = useState<boolean>(() => {
    if (!closedAt) return false;
    return !isDismissed(closedAt);
  });

  useEffect(() => {
    if (!closedAt) {
      setVisible(false);
      return;
    }
    setVisible(!isDismissed(closedAt));
  }, [closedAt]);

  if (!closedAt || !visible) return null;

  const onClose = () => {
    markDismissed(closedAt);
    setVisible(false);
  };

  return (
    <div
      role="alert"
      aria-label="이전 batch 종료 안내"
      className="mb-4 flex items-start gap-3 rounded-[14px] border border-amber-line bg-amber-soft px-5 py-4"
    >
      <Icon
        name="solar:moon-linear"
        width={20}
        height={20}
        className="mt-0.5 shrink-0 text-amber-deep"
      />
      <div className="flex-1">
        <p className="m-0 text-sm font-semibold text-amber-deep">
          어제 학습이 종료됐어요
        </p>
        <p className="m-0 mt-1 text-xs text-cream-mute break-keep">
          {typeof missedCount === 'number' && missedCount > 0
            ? `${missedCount}장을 다 못 봤지만 오늘 새 batch가 준비됐어요. 지나간 카드는 다음 노출 때 다시 만나요.`
            : '오늘 새로운 카드가 준비됐어요. 지나간 카드는 다음 노출 때 다시 만나요.'}
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="배너 닫기"
        className="shrink-0 rounded-full border border-edge-strong bg-transparent px-3 py-1 text-[11px] font-medium text-cream-mute hover:bg-paper-2 hover:text-cream"
      >
        닫기
      </button>
    </div>
  );
}
