import { useTranslations } from 'next-intl';
import { site } from '@/lib/site';
import { ChevronLink, Section, SectionTitle } from './ui';

export function Contact() {
  const t = useTranslations('Contact');
  const common = useTranslations('Common');

  return (
    <Section id="contact" labelledBy="contact-title">
      <div className="text-center">
        <SectionTitle id="contact-title">{t('title')}</SectionTitle>
        <p
          data-reveal
          className="mx-auto mt-6 max-w-[36rem] text-pretty text-[19px] leading-[1.45] text-ink-muted sm:text-[21px] [--delay:80ms]"
        >
          {t('lead')}
        </p>
        <div data-reveal className="mt-10 [--delay:160ms]">
          <a
            href={`mailto:${site.email}`}
            className="text-[clamp(1.375rem,4.6vw,2.5rem)] font-semibold tracking-[-0.015em] text-link underline-offset-[6px] [overflow-wrap:anywhere] hover:underline"
          >
            {site.email}
          </a>
        </div>
        <div data-reveal className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 [--delay:240ms]">
          <ChevronLink href={site.github} external newTabLabel={common('newTab')}>
            GitHub
          </ChevronLink>
          <ChevronLink href={site.linkedin} external newTabLabel={common('newTab')}>
            LinkedIn
          </ChevronLink>
        </div>
      </div>
    </Section>
  );
}
