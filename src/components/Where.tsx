import { useTranslations } from 'next-intl';
import { site } from '@/lib/site';
import { MexicoMap } from './MexicoMap';

const eyebrow = 'font-mono text-[12px] uppercase tracking-[0.08em] text-ink-muted';
const gradient =
  'text-balance bg-[linear-gradient(90deg,var(--ink-muted),var(--ink)_3.5em)] bg-clip-text font-semibold tracking-[-0.025em] text-transparent';
const topCaption = 'pointer-events-none invisible absolute inset-x-0 top-[clamp(84px,13svh,136px)] z-10 px-6 opacity-0';
// En pantallas anchas la narración va a la izquierda (el sujeto se recorre a la derecha); en móvil, arriba y centrada.
const sideCaption =
  'pointer-events-none invisible absolute inset-x-0 top-[clamp(84px,13svh,136px)] z-10 px-6 opacity-0 md:right-auto md:left-[max(24px,calc((100%-1200px)/2+24px))] md:top-1/2 md:px-0';
const still = 'motion-reduce:visible motion-reduce:relative motion-reduce:opacity-100';

/** “Sobre mí”: recorrido narrado sobre el mapa 3D, de Todos Santos a Guadalajara. */
export function Where() {
  const t = useTranslations('Where');
  const origin = `${site.hometown.name}, ${site.originState.name}`;

  return (
    <section id="about" aria-labelledby="about-title" className="relative h-[600svh] bg-canvas motion-reduce:h-auto">
      <div className="sticky top-0 h-[100svh] min-h-[35rem] overflow-hidden motion-reduce:static motion-reduce:h-auto">
        <div data-caption="0" className={`${topCaption} ${still} motion-reduce:pt-24`}>
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

        <div data-caption="1" className={`${sideCaption} ${still}`}>
          <div className="mx-auto max-w-[560px] text-center md:mx-0 md:max-w-[400px] md:-translate-y-1/2 md:text-left">
            <p className={eyebrow}>{t('home.eyebrow')}</p>
            <h3 className={`mt-3 text-[clamp(1.875rem,3.6vw,3rem)] leading-[1.08] ${gradient}`}>{t('home.title', { origin })}</h3>
          </div>
        </div>

        <div data-caption="2" className={`${sideCaption} ${still}`}>
          <div className="mx-auto max-w-[560px] text-center md:mx-0 md:max-w-[400px] md:-translate-y-1/2 md:text-left">
            <p className={eyebrow}>{t('move.eyebrow')}</p>
            <h3 className={`mt-3 text-[clamp(1.875rem,3.6vw,3rem)] leading-[1.08] ${gradient}`}>{t('move.title')}</h3>
            <p className="mt-3.5 text-pretty text-[clamp(1rem,1.5vw,1.125rem)] leading-[1.45] text-ink-muted">{t('move.body')}</p>
          </div>
        </div>

        <div data-caption="3" className={`${topCaption} ${still} motion-reduce:pb-24`}>
          <div className="mx-auto max-w-[1200px] text-center">
            <p className={eyebrow}>{t('label')}</p>
            <h3 className={`mt-3 text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.07] ${gradient}`}>
              {t('outro.title', { town: site.hometown.name })}
            </h3>
            <p className="mx-auto mt-3.5 max-w-[560px] text-pretty text-[clamp(1rem,1.6vw,1.1875rem)] leading-[1.45] text-ink-muted">
              {t('outro.body')}
            </p>
          </div>
        </div>

        <MexicoMap
          origin={{ id: site.originState.id, label: t('origin'), name: site.hometown.name, detail: site.originState.name, place: site.hometown.place }}
          school={{ id: site.schoolState.id, label: t('school'), name: site.schoolState.name, detail: t('schoolDetail') }}
          hint={t('hint')}
        />
      </div>
    </section>
  );
}
