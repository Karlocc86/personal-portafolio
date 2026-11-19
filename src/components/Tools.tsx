import { useTranslations } from 'next-intl';

type Layer = { title: string; body: string; items: string[] };

/** Umbrales del tramo fijo: scroll-fx.js publica --a0…--a4 con exactamente una capa en 1. */
const STEPS = [0.29, 0.46, 0.63, 0.8];

/** Con --live (lo pone scroll-fx.js) vale v; sin él (sin JS o con movimiento reducido), 1. */
const live = (v: string) => `calc(1 - var(--live,0) * (1 - ${v}))`;
const IN = live('var(--in,0)');
// Las capas se separan en el primer noveno del tramo fijo.
const E = live('clamp(0,calc(var(--p,0) * 9),1)');

const mono = 'font-mono text-[12px] leading-[1.4] uppercase tracking-[0.08em]';

/**
 * “Con qué trabajo”: pila isométrica de cinco capas. Al entrar, la pila se inclina; al bajar, las
 * capas se separan y se enciende una a la vez mientras la lista muestra sus herramientas.
 * Sin JavaScript o con movimiento reducido, la sección no se fija y todas las capas quedan abiertas.
 */
export function Tools() {
  const t = useTranslations('Tools');
  const layers = (t.raw('layers') as Layer[]).map((layer, k) => {
    const on = `var(--a${k},${k === 0 ? 1 : 0})`;
    const a = live(on);
    return {
      ...layer,
      n: String(k + 1).padStart(2, '0'),
      goto: k === 0 ? '0.15' : (STEPS[k - 1] + 0.08).toFixed(2),
      a,
      plateA: `calc(var(--live,0) * ${on})`,
      dim: `calc(0.62 + 0.38 * ${a})`,
      maxH: `calc(${a} * 220px)`,
      tf: `translateZ(calc(${2 - k} * (1px + var(--stack-gap) * ${E})))`,
    };
  });

  return (
    <section
      id="tools"
      data-pin=""
      data-steps={STEPS.join(',')}
      aria-labelledby="tools-title"
      className="relative h-auto bg-canvas fx:h-[380svh]"
    >
      <div className="static top-0 box-border flex min-h-[100svh] items-center overflow-hidden px-6 pt-16 pb-5 tall:pt-[72px] tall:pb-8 fx:sticky fx:h-[100svh]">
        <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center gap-x-14 gap-y-4">
          <div className="min-w-0 flex-[1_1_320px]">
            <h2
              id="tools-title"
              className="text-balance bg-[linear-gradient(90deg,var(--ink-muted),var(--ink)_3.5em)] bg-clip-text text-[clamp(30px,5vw,56px)] leading-[1.07] font-semibold tracking-[-0.025em] text-transparent"
            >
              {t('title')}
            </h2>
            <p className="mt-4 hidden max-w-[520px] text-pretty text-[clamp(17px,1.7vw,19px)] leading-[1.45] text-ink-muted md:tall:block">
              {t('lead')}
            </p>
            <ol className="mt-3.5 border-b border-[var(--hairline)] md:tall:mt-7">
              {layers.map((layer) => (
                <li key={layer.n} className="border-t border-[var(--hairline)]">
                  {/* scroll-fx.js lleva el scroll a ese punto del tramo fijo. */}
                  <button
                    type="button"
                    data-goto={layer.goto}
                    className="flex w-full cursor-pointer items-baseline gap-3.5 py-1.5 text-left text-ink md:tall:py-3"
                  >
                    <span aria-hidden="true" className={`w-[18px] flex-none text-ink-muted ${mono}`}>
                      {layer.n}
                    </span>
                    <span
                      className="text-[clamp(19px,2.2vw,26px)] leading-[1.2] font-semibold tracking-[-0.02em] transition-opacity duration-200 ease-apple"
                      style={{ opacity: layer.dim }}
                    >
                      {layer.title}
                    </span>
                    <span aria-hidden="true" className={`ml-auto text-ink-muted ${mono}`}>
                      {layer.items.length}
                    </span>
                  </button>
                  <div
                    className="overflow-hidden [transition:max-height_.25s_cubic-bezier(.25,.1,.25,1),opacity_.2s_cubic-bezier(.25,.1,.25,1)]"
                    style={{ maxHeight: layer.maxH, opacity: layer.a }}
                  >
                    <p className="mb-2.5 ml-8 text-[15px] leading-[1.4] text-ink-muted">{layer.body}</p>
                    <ul className="mb-4 ml-8 flex flex-wrap gap-1.5">
                      {layer.items.map((item) => (
                        <li
                          key={item}
                          className="rounded-lg border border-[var(--hairline)] bg-[var(--seg)] px-2.5 py-[5px] font-mono text-[13px] leading-[1.3] font-medium text-ink"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Pila decorativa: el contenido está en la lista. En móvil va arriba y más chica. */}
          <div
            aria-hidden="true"
            className="-order-1 flex h-[190px] min-w-0 flex-[1_1_320px] items-center justify-center md:order-none md:h-[min(560px,70svh)]"
          >
            <div
              className="relative size-[120px] flex-none [--stack-gap:26px] [transform-style:preserve-3d] md:size-[clamp(200px,24vw,300px)] md:[--stack-gap:64px]"
              style={{ transform: `rotateX(calc(58deg * ${IN})) rotateZ(calc(-45deg * ${IN})) scale(calc(0.7 + 0.3 * ${IN}))` }}
            >
              {layers.map((layer) => (
                <div
                  key={layer.n}
                  className="absolute inset-0 rounded-[22px] border border-line bg-canvas-alt"
                  style={{ transform: layer.tf }}
                >
                  <div
                    className="absolute -inset-px rounded-[22px] bg-ink transition-opacity duration-200 ease-apple"
                    style={{ opacity: layer.plateA }}
                  />
                  <span className={`absolute bottom-3.5 left-[18px] whitespace-nowrap text-ink-muted ${mono}`}>
                    {layer.n} · {layer.title}
                  </span>
                  <span
                    className={`absolute bottom-3.5 left-[18px] whitespace-nowrap text-canvas transition-opacity duration-200 ease-apple ${mono}`}
                    style={{ opacity: layer.plateA }}
                  >
                    {layer.n} · {layer.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
