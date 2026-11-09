'use client';

import { useEffect } from 'react';

/** Añade `.is-visible` a cada [data-reveal] cuando entra en pantalla. */
export function RevealObserver() {
  useEffect(() => {
    (window as Window & { __reveal?: boolean }).__reveal = true;

    const root = document.documentElement;
    if (!root.classList.contains('js')) return;

    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      elements.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return null;
}
