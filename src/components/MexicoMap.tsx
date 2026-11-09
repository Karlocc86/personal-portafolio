'use client';

import { useEffect, useRef } from 'react';

type Marker = { id: string; label: string; name: string; detail?: string; place?: string };
type MapScene = { refresh: () => void; destroy: () => void };

const glass =
  'rounded-[10px] border border-[var(--hairline)] bg-[var(--glass)] px-3 py-2 whitespace-nowrap [backdrop-filter:saturate(180%)_blur(20px)]';

/** Etiqueta a la derecha del punto, con línea guía: `up` sube desde el punto, si no baja. */
function Pin({ marker, accent, up, markerRef }: { marker: Marker; accent?: boolean; up?: boolean; markerRef: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div ref={markerRef} aria-hidden="true" className="pointer-events-none absolute left-0 top-0 opacity-0">
      <div
        className={`flex flex-row-reverse justify-end ${up ? 'items-end [transform:translate(-3.5px,calc(-100%+3.5px))]' : 'items-start [transform:translate(-3.5px,-3.5px)]'}`}
      >
        <div className={glass}>
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-muted">{marker.label}</p>
          <p className="mt-0.5 text-[15px] font-semibold tracking-[-0.01em] text-ink">{marker.name}</p>
          {marker.detail ? <p className="text-[13px] text-ink-muted">{marker.detail}</p> : null}
        </div>
        <div className="flex h-[7px] flex-none flex-row-reverse items-center">
          <div className={`h-px w-9 ${accent ? 'bg-accent' : 'bg-ink'}`} />
          <div className={`size-[7px] rounded-full ${accent ? 'bg-accent' : 'bg-ink'}`} />
        </div>
      </div>
    </div>
  );
}

/** Lienzo del mapa 3D + etiquetas. La escena y la geometría se cargan cuando el navegador está libre. */
export function MexicoMap({ origin, school, hint }: { origin: Marker; school: Marker; hint: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originRef = useRef<HTMLDivElement>(null);
  const schoolRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = document.getElementById('about');
    if (!canvas || !section) return;

    let scene: MapScene | null = null;
    let cancelled = false;
    const themeObserver = new MutationObserver(() => scene?.refresh());

    const start = () => {
      Promise.all([import('./mexico-scene'), fetch('/geo/mexico-states.json').then((r) => r.json())])
        .then(([{ mountMexico }, data]) => {
          if (cancelled) return;
          scene = mountMexico({
            canvas,
            section,
            data,
            isDark: () => document.documentElement.classList.contains('dark'),
            captions: ([
              [0.07, 0.17],
              [0.2, 0.5],
              [0.55, 0.83],
              [0.88, 1],
            ] as [number, number][]).map((at, i) => ({ el: section.querySelector<HTMLElement>(`[data-caption="${i}"]`), at })),
            tooltip: tooltipRef.current,
            hint: hintRef.current,
            highlights: [
              { id: origin.id, tone: 'ink', at: 0.17, el: originRef.current, place: origin.place },
              { id: school.id, tone: 'accent', at: 0.78, el: schoolRef.current, place: 'gdl' },
            ],
            journey: { home: origin.id, from: origin.place, dest: 'gdl' },
            reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
          });
          themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        })
        .catch(() => {
          // Sin WebGL o sin red: queda el texto de la sección.
        });
    };

    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(start, { timeout: 2500 });
    else window.setTimeout(start, 1000);

    return () => {
      cancelled = true;
      themeObserver.disconnect();
      scene?.destroy();
    };
  }, [origin.id, origin.place, school.id]);

  return (
    <>
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full touch-pan-y opacity-0" />
      <Pin marker={origin} markerRef={originRef} up />
      <Pin marker={school} markerRef={schoolRef} accent />
      <div
        ref={tooltipRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 rounded-md border border-[var(--hairline)] bg-[var(--glass)] px-2.5 py-1 text-[13px] font-medium whitespace-nowrap text-ink opacity-0 transition-opacity duration-200 ease-apple [backdrop-filter:blur(20px)]"
      />
      <p
        ref={hintRef}
        className="pointer-events-none absolute inset-x-0 bottom-[clamp(24px,5svh,48px)] px-6 text-center font-mono text-[12px] tracking-[0.04em] text-ink-muted opacity-0"
      >
        {hint}
      </p>
    </>
  );
}
