import { useLocale, useTranslations } from 'next-intl';
import { Fragment } from 'react';
import { routing } from '@/i18n/routing';
import { HeaderShell } from './HeaderShell';
import { ThemeToggle } from './ThemeToggle';

const SECTIONS = ['about', 'tools', 'education', 'contact'] as const;
const LANGUAGE_NAMES: Record<string, string> = { es: 'Español', en: 'English' };

export function Header() {
  const t = useTranslations('Header');
  const hero = useTranslations('Hero');
  const locale = useLocale();

  return (
    <HeaderShell>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-10 focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-[14px] focus:text-canvas"
      >
        {t('skip')}
      </a>
      <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-8 px-5 sm:px-6">
        <a href="#top" aria-label="kscc.tech" className="inline-flex rounded-md text-ink">
          <svg viewBox="0 0 32 32" aria-hidden="true" className="size-6 flex-none">
            <rect width="32" height="32" rx="7.5" className="fill-ink" />
            <path
              d="M11.5 8.5v15M20.5 11.5l-6.6 5.6M15.6 15.6l5.4 7.9"
              className="fill-none stroke-canvas"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>

        <nav aria-label={t('primaryNav')} className="hidden md:block">
          <ul className="flex items-center gap-6">
            {SECTIONS.map((id) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="text-[13px] font-medium text-ink/80 transition-colors duration-300 ease-apple hover:text-ink"
                >
                  {t(`nav.${id}`)}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-4">
          <div role="group" aria-label={t('language')} className="flex items-center gap-0.5 font-mono text-[12px] font-medium tracking-[0.04em]">
            {routing.locales.map((code, i) => {
              const active = code === locale;
              return (
                <Fragment key={code}>
                  {i > 0 ? (
                    <span aria-hidden="true" className="text-ink-muted/50">
                      /
                    </span>
                  ) : null}
                  <a
                    href={`/${code}`}
                    hrefLang={code}
                    lang={code}
                    aria-label={LANGUAGE_NAMES[code]}
                    aria-current={active ? 'true' : undefined}
                    className={`inline-flex h-8 items-center px-1 transition-colors duration-300 ease-apple ${
                      active ? 'text-ink' : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    {code.toUpperCase()}
                  </a>
                </Fragment>
              );
            })}
          </div>
          <ThemeToggle label={t('theme')} />
          <a
            href="#contact"
            className="hidden h-[30px] items-center rounded-md border border-line px-3 text-[13px] font-medium text-ink transition-colors duration-300 ease-apple hover:bg-ink/[0.07] sm:inline-flex"
          >
            {hero('contact')}
          </a>
        </div>
      </div>
    </HeaderShell>
  );
}
