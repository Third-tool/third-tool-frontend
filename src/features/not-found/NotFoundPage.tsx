import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main className="grid min-h-[100dvh] place-items-center px-6 text-center">
      <div className="flex flex-col gap-6">
        <p className="font-display text-7xl text-amber">404</p>
        <h1 className="text-2xl text-cream">잠시 길을 잃은 페이지예요.</h1>
        <p className="text-cream-mute">
          꿈으로 돌아가는 길은 아래에 있어요.
        </p>
        <Link
          to="/"
          className="mx-auto rounded-full bg-amber px-6 py-2 text-canvas transition-transform hover:scale-[1.03]"
        >
          처음으로
        </Link>
      </div>
    </main>
  );
}
