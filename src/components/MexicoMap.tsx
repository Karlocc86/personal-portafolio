'use client';

import { useEffect, useRef, type RefObject } from 'react';
import type { MapScene } from './mexico-scene';

type Marker = { id: string; label: string; name: string; detail?: string; place?: string };

const glass =
  'rounded-[10px] border border-[var(--hairline)] bg-[var(--glass)] px-3 py-2 whitespace-nowrap [backdrop-filter:saturate(180%)_blur(20px)]';

/** Etiqueta a la derecha del punto, con línea guía: `up` sube desde el punto, si no baja. */
function Pin({ marker, accent, up, markerRef }: { marker: Marker; accent?: boolean; up?: boolean; markerRef: RefObject<HTMLDivElement | null> }) {
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

/**
 * Lienzo del mapa 3D y sus capas HTML: velo de contraste, etiquetas, ayuda y barras de progreso.
 * La escena y la geometría se cargan cuando el navegador está libre; el guion (tramos de cada texto
 * y de cada barra) viene de CHAPTERS en mexico-scene.js.
 */
export function MexicoMap({ origin, school }: { origin: Marker; school: Marker }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const originRef = useRef<HTMLDivElement>(null);
  const schoolRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = document.getElementById('where');
    if (!canvas || !section) return;

    let scene: MapScene | null = null;
    let cancelled = false;
    const themeObserver = new MutationObserver(() => scene?.refresh());

    const start = () => {
      Promise.all([import('./mexico-scene'), fetch('/geo/mexico-states.json').then((r) => r.json())])
        .then(([{ mountMexico, CHAPTERS }, data]) => {
          if (cancelled) return;
          // Sin animación la sección no se ancla y los textos se quedan visibles: la escena solo dibuja la vista final.
          const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          const pick = (selector: string) => Array.from(section.querySelectorAll<HTMLElement>(selector));
          scene = mountMexico({
            canvas,
            section,
            data,
            isDark: () => document.documentElement.classList.contains('dark'),
            captions: still
              ? []
              : [
                  ...pick('[data-caption]')
                    .slice(0, CHAPTERS.captions.length)
                    .map((el, i) => ({ el, at: CHAPTERS.captions[i] })),
                  { el: scrimRef.current, at: CHAPTERS.scrim },
                ],
            segments: still
              ? []
              : pick('[data-segment]')
                  .slice(0, CHAPTERS.segments.length)
                  .map((el, i) => ({ el, at: CHAPTERS.segments[i] })),
            rail: still ? null : railRef.current,
            tooltip: tooltipRef.current,
            highlights: [
              { id: origin.id, tone: 'ink', at: CHAPTERS.raise.origin, el: originRef.current, place: origin.place },
              { id: school.id, tone: 'ink', at: CHAPTERS.raise.school, el: schoolRef.current, place: 'gdl' },
            ],
            journey: { home: origin.id, from: origin.place, dest: 'gdl' },
            reducedMotion: still,
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
    // Sin animación, el mapa va debajo de los textos en vez de detrás.
    <div className="absolute inset-0 motion-reduce:relative motion-reduce:mt-10 motion-reduce:h-[80svh]">
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full touch-pan-y opacity-0" />
      {/* Velo bajo los textos laterales: asegura el contraste sobre los estados alzados y la ruta. */}
      <div
        ref={scrimRef}
        aria-hidden="true"
        className="pointer-events-none invisible absolute left-0 top-[-24px] h-[calc(54%+24px)] w-full bg-[linear-gradient(180deg,var(--scrim)_0%,var(--scrim)_34%,var(--scrim0)_100%)] opacity-0 motion-reduce:hidden md:landscape:h-[calc(100%+48px)] md:landscape:w-[min(66%,860px)] md:landscape:bg-[linear-gradient(90deg,var(--scrim)_0%,var(--scrim)_26%,var(--scrim0)_100%)]"
      />
      <Pin marker={origin} markerRef={originRef} up />
      <Pin marker={school} markerRef={schoolRef} />
      <div
        ref={tooltipRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 rounded-md border border-[var(--hairline)] bg-[var(--glass)] px-2.5 py-1 text-[13px] font-medium whitespace-nowrap text-ink opacity-0 transition-opacity duration-200 ease-apple [backdrop-filter:blur(20px)]"
      />
      {/* Progreso del recorrido: una barra por capítulo. */}
      <div
        ref={railRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-[clamp(20px,4svh,36px)] flex justify-center gap-2 px-6 opacity-0 motion-reduce:hidden"
      >
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-0.5 w-[clamp(36px,7vw,72px)] overflow-hidden rounded-sm bg-ink/[0.07]">
            <div data-segment={i} className="h-full origin-left bg-ink [transform:scaleX(0)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
