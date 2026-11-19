'use client';

import { useEffect } from 'react';
import type { ScrollFx as Scene } from './scroll-fx';

/**
 * Monta scroll-fx.js después de hidratar: salida del hero hacia el engrane, pila de Herramientas,
 * galería del Portfolio y entrada del pie. Sin él, las secciones quedan estáticas y legibles.
 */
export function ScrollFx() {
  useEffect(() => {
    // Igual que la vista previa: con movimiento reducido no se monta y todo queda estático.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let scene: Scene | null = null;
    let cancelled = false;

    import('./scroll-fx')
      .then(({ mountScrollFx }) => {
        if (cancelled) return;
        // La raíz es body y no #main: el pie ([data-enter]) va fuera de <main>.
        scene = mountScrollFx({
          root: document.body,
          hero: document.getElementById('top'),
          heroContent: document.querySelector<HTMLElement>('[data-hero-content]'),
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
