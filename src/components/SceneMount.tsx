'use client';

import { useEffect, useRef } from 'react';

type Scene = { refresh(): void; destroy(): void };

/**
 * Monta una escena de scroll sobre el [data-scene-root] que lo envuelve:
 * 'orbit' → órbitas de herramientas, 'projects' → progreso de las escenas de proyectos.
 */
export function SceneMount({ kind }: { kind: 'orbit' | 'projects' }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = ref.current?.closest<HTMLElement>('[data-scene-root]');
    if (!root) return;

    let scene: Scene | null = null;
    let cancelled = false;
    const isDark = () => document.documentElement.classList.contains('dark');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const themeObserver = new MutationObserver(() => scene?.refresh());

    const load: Promise<Scene | null> =
      kind === 'orbit'
        ? import('./orbit-scene').then((m) => m.mountOrbit({ root, isDark, reducedMotion }))
        : import('./project-scenes').then((m) => m.mountProjects({ root }));

    load
      .then((mounted) => {
        if (cancelled) {
          mounted?.destroy();
          return;
        }
        scene = mounted;
        themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      })
      .catch(() => {
        // Sin la escena queda el contenido estático, que ya es legible.
      });

    return () => {
      cancelled = true;
      themeObserver.disconnect();
      scene?.destroy();
    };
  }, [kind]);

  return <span ref={ref} hidden />;
}
