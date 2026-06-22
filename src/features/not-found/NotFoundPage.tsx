import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main className="grid min-h-[100dvh] place-items-center bg-canvas px-6 text-center text-cream">
      <div className="flex max-w-[44ch] flex-col items-center gap-5">
        <span className="text-xs uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
          잠시 길을 잃었어요
        </span>
        <h1 className="m-0 font-serif text-[56px] font-medium leading-none tracking-[-0.02em] text-cream">
          404
        </h1>
        <p className="m-0 text-base leading-[1.7] text-cream-mute break-keep">
          찾으시는 페이지가 보이지 않아요. 오늘의 곁자리로 돌아가볼까요?
        </p>
        <Link
          to="/"
          className="mt-2 inline-flex items-center gap-2.5 rounded-full bg-amber px-6 py-3 text-[15px] font-medium text-white no-underline shadow-[0_10px_24px_-12px_rgba(196,103,63,0.65)] transition-all duration-[var(--dur-base)] ease-[var(--ease-spring)] hover:-translate-y-px hover:bg-amber-deep"
        >
          처음으로
        </Link>
      </div>
    </main>
  );
}
