import type { CSSProperties } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowUpRight } from './icons';

type Project = {
  eyebrow: string;
  status: string;
  name: string;
  tagline: string;
  problem: string;
  how: string;
  result: string;
  metrics: { value: string; label: string }[];
  stack: string[];
  link?: string | null;
  /** Ruta de la captura en public/, por ejemplo "/projects/cobranza.webp". */
  image?: string;
};

/** Estilo con variables CSS propias (las fórmulas de la galería). */
type Vars = CSSProperties & Record<`--${string}`, string>;

const label = 'font-mono text-[12px] leading-[1.4] uppercase tracking-[0.08em] text-ink-muted';
// Con `hpin` (pantalla de al menos 1024 × 800, con movimiento y JS) los paneles van en fila; si no, apilados.
const panel =
  'box-border flex min-w-0 flex-[0_0_auto] items-center px-6 py-[clamp(56px,10vw,96px)] hpin:flex-[0_0_var(--pf-basis)] hpin:pt-[72px] hpin:pb-[44px]';

/**
 * “Portafolio”: una portada y un panel por proyecto. En pantallas amplias la sección se fija y el
 * scroll vertical recorre la galería en horizontal (scroll-fx.js publica --p en [data-pin]).
 * El contenido vive en Projects.items de messages/*.json.
 */
export function Portfolio() {
  const t = useTranslations('Projects');
  const items = t.raw('items') as Project[];

  // Tramo fijo, en alturas de pantalla: HOLD con el título trabado mientras se llena de color,
  // uno por proyecto y 0.6 de reposo al final.
  const N = Math.max(items.length, 1);
  const HOLD = 0.7;
  const RUN = N + HOLD + 0.6;
  const Q = `clamp(0,calc(var(--p,0) * ${(RUN / N).toFixed(4)} - ${(HOLD / N).toFixed(4)}),1)`;
  const lock = `clamp(0,calc(var(--p,0) * ${(RUN / HOLD).toFixed(4)}),1)`;

  const section: Vars = { '--pf-h': `${Math.round((RUN + 1) * 100)}svh` };
  const stage: Vars = { '--pf-q': Q, '--pf-lock': lock };
  const track: Vars = {
    '--pf-w': `${(N + 1) * 100}%`,
    '--pf-basis': `${(100 / (N + 1)).toFixed(4)}%`,
    '--pf-track': `translate3d(calc(var(--pf-q) * ${((-N / (N + 1)) * 100).toFixed(4)}%),0,0)`,
  };
  const title: Vars = {
    '--pf-title': `translateX(calc(var(--pf-q) * ${N} * -16vw))`,
    '--pf-fill': 'calc((1 - var(--pf-lock)) * 100%)',
  };

  return (
    <section
      id="portfolio"
      data-pin=""
      aria-labelledby="portfolio-title"
      className="relative h-auto bg-canvas-alt hpin:h-[var(--pf-h)]"
      style={section}
    >
      <div className="static top-0 h-auto overflow-hidden hpin:sticky hpin:h-[100svh]" style={stage}>
        <div
          className="flex h-full w-full flex-col will-change-transform hpin:w-[var(--pf-w)] hpin:flex-row hpin:[transform:var(--pf-track)]"
          style={track}
        >
          <div className={panel}>
            <div className="mx-auto w-full max-w-[1200px]">
              <p className={label}>
                {String(items.length).padStart(2, '0')} {t('labels.count')}
              </p>
              <h2
                id="portfolio-title"
                className="mt-3 w-fit bg-[linear-gradient(90deg,var(--ink)_40%,var(--ink-muted)_60%)] bg-clip-text text-[clamp(56px,14vw,220px)] leading-[0.95] font-semibold tracking-[-0.05em] text-transparent [background-position:0%_0] [background-size:300%_100%] hpin:[background-position:var(--pf-fill)_0] hpin:[transform:var(--pf-title)]"
                style={title}
              >
                {t('title')}
              </h2>
              <p className="mt-7 max-w-[560px] text-pretty text-[clamp(19px,2vw,21px)] leading-[1.45] text-ink-muted">
                {t('lead')}
              </p>
            </div>
          </div>

          {items.map((project, i) => {
            // 0 con el panel centrado; −1 entrando por la derecha, +1 saliendo por la izquierda.
            const L = `(var(--pf-q) * ${N} - ${i + 1})`;
            const vars: Vars = {
              '--pf-name': `translateX(calc(${L} * -140px))`,
              '--pf-shot': `translateX(calc(${L} * 90px))`,
              '--pf-clip': `inset(0 calc(clamp(0,calc(${i + 1} - var(--pf-q) * ${N} - 0.35),1) * 100%) 0 0 round 20px)`,
            };
            return (
              <article key={project.name} className={panel} style={vars}>
                <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center gap-x-14 gap-y-8">
                  <div className="min-w-0 flex-[1_1_360px]">
                    <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2">
                      <p className={label}>{project.eyebrow}</p>
                      <p className="rounded-lg border border-[var(--hairline)] bg-[var(--seg)] px-2.5 py-[3px] text-[12px] leading-[1.4] text-ink">
                        {project.status}
                      </p>
                    </div>
                    <h3 className="mt-3.5 text-balance text-[clamp(36px,4.2vw,60px)] leading-[1.04] font-semibold tracking-[-0.035em] hpin:[transform:var(--pf-name)]">
                      {project.name}
                    </h3>
                    <p className="mt-3 text-pretty text-[clamp(17px,1.6vw,20px)] leading-[1.4] text-ink-muted">{project.tagline}</p>
                    <dl className="mt-7 grid gap-5">
                      {(['problem', 'how', 'result'] as const).map((key) => (
                        <div key={key}>
                          <dt className={label}>{t(`labels.${key}`)}</dt>
                          <dd className="mt-1.5 text-pretty text-[15px] leading-[1.6]">{project[key]}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>

                  <div className="flex min-w-0 flex-[1.15_1_380px] flex-col gap-5">
                    {/* Sin captura queda el marco rayado como marcador neutro. */}
                    <div className="relative box-border flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-[20px] border border-[var(--hairline)] [background:repeating-linear-gradient(135deg,var(--seg)_0_1px,transparent_1px_14px),var(--canvas)] hpin:max-h-[34svh] hpin:[clip-path:var(--pf-clip)] hpin:[transform:var(--pf-shot)]">
                      {project.image ? (
                        <div className="absolute inset-0 bg-cover bg-top" style={{ backgroundImage: `url("${project.image}")` }} />
                      ) : null}
                    </div>
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(118px,1fr))] gap-x-6 gap-y-3.5">
                      {project.metrics.map((metric) => (
                        <div key={metric.label} className="min-w-0">
                          <p className="text-[clamp(20px,2vw,26px)] leading-[1.15] font-semibold tracking-[-0.02em] [overflow-wrap:anywhere]">
                            {metric.value}
                          </p>
                          <p className="mt-0.5 text-[12px] text-ink-muted">{metric.label}</p>
                        </div>
                      ))}
                    </div>
                    <p className="font-mono text-[12px] leading-[1.6] text-ink-muted">{project.stack.join(' · ')}</p>
                    {project.link ? (
                      <a
                        href={project.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-10 items-center gap-1.5 self-start rounded-lg bg-ink px-4 text-[15px] font-medium text-canvas transition-opacity duration-200 ease-apple hover:opacity-85"
                      >
                        {/github\.com/.test(project.link) ? t('labels.github') : t('labels.visit')}
                        <ArrowUpRight className="size-3" />
                      </a>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Progreso de la galería: solo en modo horizontal. */}
        <div
          aria-hidden="true"
          className="absolute bottom-5 left-1/2 hidden h-0.5 w-[clamp(120px,18vw,200px)] -translate-x-1/2 overflow-hidden rounded-[1px] bg-[var(--seg)] hpin:block"
        >
          <div className="h-full origin-left bg-ink" style={{ transform: 'scaleX(var(--pf-q))' }} />
        </div>
      </div>
    </section>
  );
}
