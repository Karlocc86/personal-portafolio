'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/** Barra transparente sobre el hero; al hacer scroll gana fondo translúcido y una línea fina. */
export function HeaderShell({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      el.dataset.scrolled = String(window.scrollY > 8);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <header ref={ref} data-scrolled="false" className="site-header header-in sticky top-0 z-50 border-b border-transparent">
      {children}
    </header>
  );
}
