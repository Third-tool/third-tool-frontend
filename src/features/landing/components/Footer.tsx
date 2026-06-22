import { Link } from 'react-router-dom';

const SITEMAP = [
  { label: 'Study', to: '/study' },
  { label: 'Map', to: '/map' },
  { label: 'Archive', to: '/archive' },
];

const SOURCES = ['Effective Java', 'DDD', 'SRE Book'];

export function Footer() {
  return (
    <footer className="border-t border-edge bg-paper-2 px-7 py-14">
      <div className="mx-auto flex w-full max-w-[1180px] flex-wrap items-start justify-between gap-10">
        <div>
          <div className="mb-3.5 flex items-center gap-2.5">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-amber font-serif text-sm font-semibold text-white">
              t
            </span>
            <span className="font-serif text-[19px] font-semibold text-cream">third</span>
          </div>
          <p className="m-0 max-w-[30ch] text-[13.5px] leading-[1.6] text-cream-faint">
            꿈을 찾기 전까지 곁에서 도와주는 도구.
          </p>
        </div>
        <div className="flex gap-16">
          <div>
            <div className="mb-4 text-[11px] uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
              Sitemap
            </div>
            <div className="flex flex-col gap-2.5">
              {SITEMAP.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className="text-sm text-cream-mute no-underline transition-colors hover:text-cream"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-4 text-[11px] uppercase tracking-[var(--tracking-eyebrow)] text-cream-faint">
              Sources
            </div>
            <div className="flex flex-col gap-2.5">
              {SOURCES.map((src) => (
                <span key={src} className="text-sm text-cream-mute">
                  {src}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-11 flex w-full max-w-[1180px] flex-wrap items-center justify-between gap-4 border-t border-edge pt-6">
        <span className="text-[12.5px] text-cream-faint">© {new Date().getFullYear()} third tool</span>
        <span className="text-[12.5px] text-cream-faint">A place to study, slowly</span>
      </div>
    </footer>
  );
}
