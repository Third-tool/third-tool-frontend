import { useEffect, useRef } from 'react';

interface UseFadeUpOptions {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}

export function useFadeUp<T extends HTMLElement>(options: UseFadeUpOptions = {}) {
  const { threshold = 0.15, rootMargin = '0px 0px -80px 0px', once = true } = options;
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.style.opacity = '0';
    node.style.transform = 'translateY(2rem)';
    node.style.filter = 'blur(4px)';
    node.style.transition =
      'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), filter 0.6s cubic-bezier(0.16, 1, 0.3, 1)';

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            node.style.opacity = '1';
            node.style.transform = 'translateY(0)';
            node.style.filter = 'blur(0)';
            if (once) observer.unobserve(node);
          }
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return ref;
}
