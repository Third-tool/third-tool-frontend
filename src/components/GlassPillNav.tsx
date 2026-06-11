import { Link } from 'react-router-dom';

export function GlassPillNav() {
  return (
    <nav className="sticky top-4 z-50 mx-auto mt-4 flex w-max items-center gap-6 rounded-full border border-edge bg-glass px-5 py-2 backdrop-blur-xl">
      <Link to="/" className="font-display text-base font-bold text-cream">
        third<span className="text-amber">.</span>
      </Link>
      <Link
        to="/study"
        className="rounded-full bg-amber px-4 py-1.5 text-xs font-medium text-canvas transition-transform duration-[var(--dur-fast)] ease-[var(--ease-spring)] hover:scale-[1.04]"
      >
        시작하기
      </Link>
    </nav>
  );
}
