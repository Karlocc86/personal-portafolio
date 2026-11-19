import type { CSSProperties } from 'react';
import { useTranslations } from 'next-intl';
import { SceneMount } from './SceneMount';

type Project = {
  eyebrow: string;
  name: string;
  tagline: string;
  url: string;
  ui: string;
  data: string;
  result: string;
  stack: string;
  screen: string;
  chart: string;
  rows: { label: string; value: string }[];
  metrics: { value: string; label: string }[];
};

/** 0→1 a partir del progreso `at` de la escena (--p lo publica project-scenes.js). */
const vis = (at: number, k = 10) => `clamp(0,calc((var(--p,0) - ${at}) * ${k}),1)`;
const rise = (at: number): CSSProperties => ({ opacity: vis(at), transform: `translateY(calc((1 - ${vis(at)}) * 16px))` });
const between = (a: number, b: number): CSSProperties => ({
  opacity: `clamp(0,min(calc((var(--p,0) - ${a}) * 14),calc((${b} - var(--p,0)) * 14)),1)`,
});

const eyebrow = 'font-mono text-[12px] uppercase tracking-[0.08em] text-ink-muted';
const CHAPTERS = [
  { key: 'ui', from: -1, to: 0.36, rail: [0, 2.78] },
  { key: 'data', from: 0.36, to: 0.68, rail: [0.36, 3.125] },
  { key: 'result', from: 0.68, to: 2, rail: [0.68, 3.125] },
] as const;
const SKELETON = ['62%', '48%', '70%', '54%'];
const BARS = ['38%', '52%', '47%', '70%', '92%'];

/** Escena de un proyecto: la ventana se arma con el scroll (interfaz → datos → resultado). */
function ProjectScene({ project, steps }: { project: Project; steps: Record<'ui' | 'data' | 'result', string> }) {
  return (
    <article data-project className="relative h-[320svh]">
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden px-6 pb-8 pt-[72px]">
        <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center gap-x-14 gap-y-6">
          <div className="min-w-0 flex-[1_1_300px]">
            <p className={eyebrow}>{project.eyebrow}</p>
            <h3 className="mt-2.5 text-[clamp(1.75rem,3.6vw,2.75rem)] font-semibold leading-[1.08] tracking-[-0.025em]">{project.name}</h3>
            <p className="mt-2 hidden text-pretty text-[17px] leading-[1.45] text-ink-muted md:block">{project.tagline}</p>
            <div className="relative mt-6 min-h-[132px]">
              {CHAPTERS.map(({ key, from, to }, i) => (
                <div key={key} className="absolute inset-0" style={between(from, to)}>
                  <p className={eyebrow}>
                    {String(i + 1).padStart(2, '0')} · {steps[key]}
                  </p>
                  <p className="mt-2 text-pretty text-[clamp(1rem,1.5vw,1.125rem)] leading-[1.45]">{project[key]}</p>
                </div>
              ))}
            </div>
            <div aria-hidden="true" className="mt-4 flex gap-2">
              {CHAPTERS.map(({ key, rail }) => (
                <div key={key} className="h-0.5 w-[clamp(36px,7vw,72px)] overflow-hidden rounded-sm bg-ink/[0.07]">
                  <div className="h-full origin-left bg-ink" style={{ transform: `scaleX(${vis(rail[0], rail[1])})` }} />
                </div>
              ))}
            </div>
            <p className="mt-5 hidden font-mono text-[12px] leading-[1.6] text-ink-muted md:block">{project.stack}</p>
          </div>

          {/* Maqueta decorativa: el contenido real del proyecto está en el texto de la izquierda. */}
          <div aria-hidden="true" className="min-w-0 flex-[1.5_1_420px]">
            <div
              className="overflow-hidden rounded-[14px] border border-[var(--hairline)] bg-canvas shadow-card dark:shadow-none"
              style={{ transform: `scale(calc(0.95 + 0.05 * ${vis(0, 12)}))` }}
            >
              <div className="flex h-9 items-center gap-1.5 border-b border-[var(--hairline)] px-3.5">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="size-[9px] rounded-full bg-ink/[0.14]" />
                ))}
                <span className="ml-3 rounded-md bg-ink/[0.07] px-2.5 py-0.5 font-mono text-[11px] text-ink-muted" style={{ opacity: vis(0.02) }}>
                  {project.url}
                </span>
              </div>
              <div className="relative overflow-hidden p-5">
                <div className="flex items-center justify-between" style={rise(0.04)}>
                  <span className="text-[14px] font-semibold tracking-[-0.01em]">{project.name}</span>
                  <span className="flex gap-2">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="h-2 w-9 rounded bg-ink/[0.07]" />
                    ))}
                  </span>
                </div>
                <p className="mt-4 text-[20px] font-semibold tracking-[-0.02em]" style={rise(0.09)}>
                  {project.screen}
                </p>
                <div className="mt-3 flex gap-6">
                  <div className="min-w-0 flex-[1.4]">
                    {project.rows.slice(0, 4).map((row, i) => (
                      <div key={row.label} className="relative flex h-[34px] items-center justify-between gap-3 border-t border-[var(--hairline)] text-[13px]">
                        <span
                          className="absolute left-0 top-[13px] h-2 rounded bg-ink/[0.07]"
                          style={{ width: SKELETON[i], opacity: `calc(${vis(0.12 + i * 0.04)} * (1 - ${vis(0.38 + i * 0.04)}))` }}
                        />
                        <span className="min-w-0 truncate" style={{ opacity: vis(0.38 + i * 0.04) }}>
                          {row.label}
                        </span>
                        <span className="flex-none font-mono text-[12px] text-ink-muted" style={{ opacity: vis(0.4 + i * 0.04) }}>
                          {row.value}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="hidden min-w-0 flex-1 md:block">
                    <div className="flex h-[112px] items-end gap-2 border-b border-[var(--hairline)]">
                      {BARS.map((height, i) => (
                        <span
                          key={height}
                          className={`flex-1 origin-bottom rounded-t ${i === BARS.length - 1 ? 'bg-accent' : 'bg-ink/[0.14]'}`}
                          style={{ height, transform: `scaleY(${vis(0.5 + i * 0.03)})` }}
                        />
                      ))}
                    </div>
                    <p className="mt-2 font-mono text-[11px] text-ink-muted" style={{ opacity: vis(0.5) }}>
                      {project.chart}
                    </p>
                  </div>
                </div>
                <div
                  className="absolute inset-x-0 bottom-0 flex flex-wrap gap-x-8 gap-y-3 border-t border-[var(--hairline)] bg-canvas px-5 py-4"
                  style={{ transform: `translateY(calc((1 - ${vis(0.68, 8)}) * 101%))` }}
                >
                  {project.metrics.map((metric) => (
                    <div key={metric.label}>
                      <p className="text-[clamp(1.375rem,2.6vw,1.875rem)] font-semibold leading-[1.1] tracking-[-0.02em]">{metric.value}</p>
                      <p className="mt-0.5 text-[12px] text-ink-muted">{metric.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

/** “Proyectos”: una escena de scroll por proyecto. El contenido vive en Projects.items de messages/*.json. */
export function Projects() {
  const t = useTranslations('Projects');
  const items = t.raw('items') as Project[];
  const steps = { ui: t('steps.ui'), data: t('steps.data'), result: t('steps.result') };

  return (
    <section id="projects" aria-labelledby="projects-title" data-scene-root className="bg-canvas-alt">
      <SceneMount kind="projects" />
      <div className="mx-auto max-w-[1248px] px-6 pt-24 sm:pt-32 lg:pt-36">
        <h2
          id="projects-title"
          data-reveal
          className="text-balance bg-[linear-gradient(90deg,var(--ink-muted),var(--ink)_3.5em)] bg-clip-text text-[clamp(2.5rem,6vw,3.5rem)] font-semibold leading-[1.07] tracking-[-0.025em] text-transparent"
        >
          {t('title')}
        </h2>
        <p data-reveal className="mt-6 max-w-[40rem] text-pretty text-[19px] leading-[1.45] text-ink-muted sm:text-[21px] [--delay:80ms]">
          {t('lead')}
        </p>
      </div>
      {items.map((project) => (
        <ProjectScene key={project.name} project={project} steps={steps} />
      ))}
    </section>
  );
}
