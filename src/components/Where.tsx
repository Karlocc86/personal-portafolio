import { useTranslations } from 'next-intl';
import { site } from '@/lib/site';
import { MexicoMap } from './MexicoMap';

const eyebrow = 'font-mono text-[12px] uppercase tracking-[0.08em] text-ink-muted';
const gradient =
  'text-balance bg-[linear-gradient(90deg,var(--ink-muted),var(--ink)_3.5em)] bg-clip-text font-semibold tracking-[-0.025em] text-transparent';
// Los textos arrancan ocultos; mexico-scene.js muestra cada uno en su tramo de scroll (CHAPTERS.captions).
// Sin animación quedan apilados y visibles: ver .where-caption en globals.css.
const topCaption =
  'where-caption pointer-events-none invisible absolute inset-x-0 top-[clamp(84px,13svh,136px)] z-10 px-6 opacity-0';
// En pantallas anchas y apaisadas la narración va a la izquierda (la cámara recorre el sujeto a la derecha);
// en el resto, arriba y centrada.
const sideCaption = `${topCaption} md:landscape:right-auto md:landscape:left-[max(24px,calc((100%-1200px)/2+24px))] md:landscape:top-1/2 md:landscape:px-0`;
const sideInner =
  'mx-auto max-w-[560px] text-center md:landscape:mx-0 md:landscape:max-w-[min(400px,36vw)] md:landscape:-translate-y-1/2 md:landscape:text-left';

/** “Sobre mí”: recorrido narrado sobre el mapa 3D, de Todos Santos a Guadalajara. */
export function Where() {
  const t = useTranslations('Where');
  const origin = `${site.hometown.name}, ${site.originState.name}`;

  return (
    <section id="where" aria-labelledby="about-title" className="relative h-[700svh] bg-canvas motion-reduce:h-auto">
      {/* El enlace “Sobre mí” cae aquí: pasado el portal del engrane, con México llenando la pantalla. */}
      <span
        id="about"
        aria-hidden="true"
        className="absolute left-0 top-[calc(84svh+3.5rem)] size-px motion-reduce:top-0"
      />
      <div className="sticky top-0 h-[100svh] overflow-hidden motion-reduce:static motion-reduce:h-auto motion-reduce:py-12">
        <div data-caption="0" className={topCaption}>
          <div className="mx-auto max-w-[1200px] text-center">
            <p className={eyebrow}>{t('label')}</p>
            <h2 id="about-title" className={`mt-3 text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.07] ${gradient}`}>
              {t('intro.title')}
            </h2>
            <p className="mx-auto mt-3.5 max-w-[560px] text-pretty text-[clamp(1rem,1.6vw,1.1875rem)] leading-[1.45] text-ink-muted">
              {t('intro.body')}
            </p>
          </div>
        </div>

        <div data-caption="1" className={sideCaption}>
          <div className={sideInner}>
            <p className={eyebrow}>{t('home.eyebrow')}</p>
            <h3 className={`mt-3 text-[clamp(1.875rem,3.6vw,3rem)] leading-[1.08] ${gradient}`}>{t('home.title', { origin })}</h3>
          </div>
        </div>

        <div data-caption="2" className={sideCaption}>
          <div className={sideInner}>
            <p className={eyebrow}>{t('move.eyebrow')}</p>
            <h3 className={`mt-3 text-[clamp(1.875rem,3.6vw,3rem)] leading-[1.08] ${gradient}`}>{t('move.title')}</h3>
            <p className="mt-3.5 text-pretty text-[clamp(1rem,1.5vw,1.125rem)] leading-[1.45] text-ink-muted">{t('move.body')}</p>
          </div>
        </div>

        <div data-caption="3" className={topCaption}>
          <div className="mx-auto max-w-[1200px] text-center">
            <p className={eyebrow}>{t('label')}</p>
            <h3 className={`mt-3 text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.07] ${gradient}`}>
              {t('outro.title', { town: site.hometown.name })}
            </h3>
          </div>
        </div>

        <MexicoMap
          origin={{ id: site.originState.id, label: t('origin'), name: site.hometown.name, detail: site.originState.name, place: site.hometown.place }}
          school={{ id: site.schoolState.id, label: t('school'), name: site.schoolState.name, detail: t('schoolDetail') }}
        />
      </div>
    </section>
  );
}
