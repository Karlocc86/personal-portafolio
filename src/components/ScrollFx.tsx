'use client';

import { useEffect } from 'react';
import type { ScrollFx as Scene } from './scroll-fx';

/**
 * Monta scroll-fx.js después de hidratar: salida del hero hacia el engrane, pila de Herramientas
 * y galería del Portfolio. Sin él, las secciones quedan estáticas y legibles.
 */
export function ScrollFx() {
  useEffect(() => {
    let scene: Scene | null = null;
    let cancelled = false;

    import('./scroll-fx')
      .then(({ mountScrollFx }) => {
        const root = document.getElementById('main');
        if (cancelled || !root) return;
        scene = mountScrollFx({
          root,
          hero: document.getElementById('top'),
          heroContent: document.querySelector<HTMLElement>('[data-hero-content]'),
          reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        });
      })
      .catch(() => {
        // Sin el módulo, el contenido estático ya es legible.
      });

    return () => {
      cancelled = true;
      scene?.destroy();
    };
  }, []);

  return null;
}
