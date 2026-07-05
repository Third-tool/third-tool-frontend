import { useEffect } from 'react';
import { toastStore } from '@/lib/toast/toastQueue';

// product-review Epic 2 Story 2-2 · M5 신설 (2026-07-22+).
// 이전 진행 중 세션이 자동 finish 처리된 경우 안내 toast.
// 대부분 `useReviewSession`이 toast를 발행하지만 · 직접 임베드 방식도 지원 (컨트롤러 컴포넌트).
interface Props {
  show: boolean;
}

const MESSAGE = '이전 세션이 정리되어 새 세션을 시작합니다.';

export function AutoFinishNoticeToast({ show }: Props) {
  useEffect(() => {
    if (!show) return;
    toastStore.push({ message: MESSAGE, tone: 'amber' });
  }, [show]);
  return null;
}
