import { useEffect, useRef } from 'react';
import { track } from '@/lib/analytics/track';

export function MaintenancePage() {
  const reportedRef = useRef(false);
  useEffect(() => {
    if (reportedRef.current) return;
    reportedRef.current = true;
    track('maintenance_page_seen');
  }, []);

  return (
    <main className="grid min-h-[100dvh] place-items-center bg-canvas px-4 text-center">
      <div className="flex max-w-[44ch] flex-col items-center gap-5">
        <span className="font-mono text-[11px] uppercase tracking-[var(--tracking-mono)] text-cream-faint">
          Quiet Hours
        </span>
        <h1 className="font-display text-3xl text-cream">시스템이 잠시 숨을 고르고 있어요</h1>
        <p className="text-cream-mute">
          학습 지도는 안전하게 보관되어 있어요. 잠시 후 다시 이어가주세요.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 rounded-full bg-cream px-6 py-3 font-mono text-xs uppercase tracking-[var(--tracking-mono)] text-canvas transition-transform duration-[var(--dur-fast)] ease-[var(--ease-spring)] hover:scale-[1.02]"
        >
          다시 확인
        </button>
      </div>
    </main>
  );
}
