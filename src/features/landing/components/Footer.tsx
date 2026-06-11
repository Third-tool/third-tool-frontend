export function Footer() {
  return (
    <footer className="border-t border-edge px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[var(--container-max)] flex-col gap-3 text-sm text-cream-faint">
        <p className="font-display text-cream">third.</p>
        <p>꿈을 찾기 전까지 곁에 있어주는 학습 카페.</p>
        <p>© {new Date().getFullYear()} third-tool</p>
      </div>
    </footer>
  );
}
