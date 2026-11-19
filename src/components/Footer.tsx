import { useTranslations } from 'next-intl';
import { site } from '@/lib/site';
import { FooterName } from './FooterName';
import { ArrowUp, GitHubIcon, LinkedInIcon, MailIcon } from './icons';

const SECTIONS = ['about', 'tools', 'portfolio', 'contact'] as const;

// Círculo de vidrio. No usa .glass: esa regla va fuera de las capas de Tailwind y taparía el hover.
const social =
  'box-border flex size-[52px] items-center justify-center rounded-full border border-[var(--hairline)] bg-[var(--glass)] text-ink transition-colors duration-200 ease-apple [-webkit-backdrop-filter:saturate(180%)_blur(20px)] [backdrop-filter:saturate(180%)_blur(20px)] hover:border-line hover:bg-[var(--seg-active)]';

export function Footer() {
  const t = useTranslations('Footer');
  const nav = useTranslations('Header.nav');
  const links = [{ href: '#top', label: t('home') }, ...SECTIONS.map((id) => ({ href: `#${id}`, label: nav(id) }))];

  return (
    // data-enter: scroll-fx.js publica --e (0–1) mientras el pie entra en pantalla.
    <footer
      data-enter=""
      aria-label={t('label')}
      className="relative overflow-hidden bg-[linear-gradient(0deg,var(--canvas-alt)_0%,var(--canvas-alt)_40%,var(--canvas)_100%)] px-6 pt-[clamp(80px,11vw,140px)] pb-6 text-ink"
    >
      <div className="mx-auto flex max-w-[1200px] flex-col items-center text-center">
        <div className="flex w-full justify-center overflow-hidden">
          <FooterName>Karlo Cadena</FooterName>
        </div>

        <nav aria-label={t('label')} className="mt-10">
          <ul className="flex flex-wrap justify-center gap-x-8 gap-y-3">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-[15px] font-medium text-[var(--ink80)] transition-colors duration-200 ease-apple hover:text-ink"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <ul aria-label={t('social')} className="mt-9 flex justify-center gap-4">
          <li>
            <a href={site.linkedin} target="_blank" rel="me noopener noreferrer" aria-label="LinkedIn" className={social}>
              <LinkedInIcon className="size-5" />
            </a>
          </li>
          <li>
            <a href={site.github} target="_blank" rel="me noopener noreferrer" aria-label="GitHub" className={social}>
              <GitHubIcon className="size-[22px]" />
            </a>
          </li>
          <li>
            <a href={`mailto:${site.email}`} aria-label="Email" className={social}>
              <MailIcon className="size-[21px]" />
            </a>
          </li>
        </ul>

        <div className="glass mt-12 box-border flex w-full flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-[14px] border border-[var(--hairline)] px-[18px] py-3.5 text-[12px] text-ink-muted">
          <p>{t('copyright')}</p>
          <a href="#top" className="inline-flex items-center gap-1.5 text-ink-muted transition-colors duration-200 ease-apple hover:text-ink">
            {t('top')}
            <ArrowUp className="size-3" />
          </a>
        </div>
      </div>
    </footer>
  );
}
