'use client';

import { useEffect, useRef } from 'react';

type GearScene = { refresh: () => void; destroy: () => void };
type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
};

/** Lienzo del engrane 3D detrás del titular. Se carga después de hidratar para no afectar el LCP. */
export function HeroGear() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = document.getElementById('top');
    if (!canvas || !section) return;

    let scene: GearScene | null = null;
    let cancelled = false;
    const themeObserver = new MutationObserver(() => scene?.refresh());

    const start = () => {
      import('./gear-scene')
        .then(({ mountGear }) => {
          if (cancelled) return;
          scene = mountGear({
            canvas,
            section,
            isDark: () => document.documentElement.classList.contains('dark'),
            reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
          });
          themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        })
        .catch(() => {
          // Sin WebGL: el hero se queda sin el objeto 3D.
        });
    };

    const w = window as IdleWindow;
    if (w.requestIdleCallback) w.requestIdleCallback(start, { timeout: 2000 });
    else window.setTimeout(start, 800);

    return () => {
      cancelled = true;
      themeObserver.disconnect();
      scene?.destroy();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
    />
  );
}
