import { useTranslations } from 'next-intl';
import { SceneMount } from './SceneMount';
import { Section, SectionTitle } from './ui';

const GROUPS = ['languages', 'web', 'cloud', 'tools'] as const;

/** Etiqueta de una herramienta. “Supabase (Auth, RLS)” → nombre + detalle (en órbita aparece al pasar el cursor). */
function Tool({ label, ring }: { label: string; ring: number }) {
  const match = label.match(/^(.+?)\s*\((.+)\)$/);
  return (
    <li
      data-tool={match ? match[1] : label}
      data-ring={ring}
      className="inline-flex cursor-default items-center gap-[7px] whitespace-nowrap rounded-lg border border-[var(--hairline)] bg-[var(--glass)] px-2.5 py-[5px] font-mono text-[13px] font-medium leading-[1.3] text-ink-muted"
    >
      <span data-dot aria-hidden="true" className="size-1.5 flex-none rounded-full border border-ink-muted bg-ink-muted" />
      <span data-name>
        {match ? match[1] : label}
        {match ? <span data-detail className="font-normal"> ({match[2]})</span> : null}
      </span>
    </li>
  );
}

/**
 * “Con qué trabajo”: el engrane del hero al centro y las herramientas en cuatro órbitas, una por
 * categoría. orbit-scene.js las anima; sin JavaScript quedan como cuatro listas de etiquetas.
 */
export function Tools() {
  const t = useTranslations('Tools');

  return (
    <Section id="tools" labelledBy="tools-title">
      <SectionTitle id="tools-title">{t('title')}</SectionTitle>
      <p
        data-reveal
        className="mt-6 max-w-[40rem] text-pretty text-[19px] leading-[1.45] text-ink-muted sm:text-[21px] [--delay:80ms]"
      >
        {t('lead')}
      </p>

      <div data-scene-root className="relative mt-10">
        <SceneMount kind="orbit" />
        <div data-stage className="relative touch-pan-y">
          <canvas data-orbit aria-hidden="true" className="pointer-events-none absolute inset-0 z-[2] h-full w-full" />
          {GROUPS.map((key, ring) => (
            <ul key={key} data-ring-list aria-label={t(`groups.${key}.title`)} className="mb-3 flex flex-wrap gap-2">
              {(t.raw(`groups.${key}.items`) as string[]).map((item) => (
                <Tool key={item} label={item} ring={ring} />
              ))}
            </ul>
          ))}
        </div>
        <p className="mt-2 text-center font-mono text-[12px] tracking-[0.04em] text-ink-muted">{t('hint')}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {GROUPS.map((key, ring) => (
            <button
              key={key}
              type="button"
              data-ring-btn={ring}
              aria-pressed="false"
              className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-[var(--hairline)] px-3 text-[13px] font-medium text-ink-muted transition-colors duration-300 ease-apple hover:text-ink"
            >
              <span aria-hidden="true" className="font-mono text-[11px] tracking-[0.08em]">
                {String(ring + 1).padStart(2, '0')}
              </span>
              {t(`groups.${key}.title`)}
            </button>
          ))}
        </div>
      </div>
    </Section>
  );
}
