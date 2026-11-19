'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Barra transparente sobre el hero; al hacer scroll gana fondo translúcido y una línea fina.
 * También marca con aria-current el enlace (a[data-nav]) de la sección que se está viendo.
 */
export function HeaderShell({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const links = Array.from(el.querySelectorAll<HTMLAnchorElement>('a[data-nav]'));

    const update = () => {
      let active = '';
      for (const link of links) {
        const target = document.getElementById(link.dataset.nav ?? '');
        if (target && target.getBoundingClientRect().top <= window.innerHeight * 0.4) active = link.dataset.nav ?? '';
      }
      el.dataset.scrolled = String(window.scrollY > 8);
      for (const link of links) {
        if (link.dataset.nav === active) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      }
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <header ref={ref} data-scrolled="false" className="site-header header-in sticky top-0 z-50 border-b border-transparent">
      {children}
    </header>
  );
}
