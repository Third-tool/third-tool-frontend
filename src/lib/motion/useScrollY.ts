import { useEffect, useState } from 'react';

export function useScrollY() {
  const [y, setY] = useState(0);

  useEffect(() => {
    let rafId = 0;
    const update = () => setY(window.scrollY);
    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return y;
}

export function mapRange(value: number, inRange: [number, number], outRange: [number, number]) {
  const [a, b] = inRange;
  const [oa, ob] = outRange;
  if (b === a) return oa;
  const t = Math.max(0, Math.min(1, (value - a) / (b - a)));
  return oa + (ob - oa) * t;
}
