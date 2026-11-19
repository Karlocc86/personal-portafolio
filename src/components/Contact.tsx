import { useTranslations } from 'next-intl';
import { site } from '@/lib/site';
import { CopyEmail } from './CopyEmail';
import { OutlineButton, Section, SectionTitle } from './ui';

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
        <div data-reveal className="mt-11 [--delay:160ms]">
          <a
            href={`mailto:${site.email}`}
            className="type-in inline-block text-[clamp(1.375rem,5.2vw,3.75rem)] font-semibold leading-[1.15] tracking-[-0.03em] text-ink underline transition-colors duration-300 ease-apple [overflow-wrap:anywhere] [text-decoration-color:var(--line)] [text-decoration-thickness:0.04em] [text-underline-offset:0.16em] hover:text-link hover:[text-decoration-color:var(--link)]"
          >
            {site.email}
          </a>
        </div>
        <div data-reveal className="mt-10 flex flex-wrap items-center justify-center gap-2.5 [--delay:240ms]">
          <CopyEmail email={site.email} label={t('copy')} copiedLabel={t('copied')} />
          <OutlineButton href={site.github} external newTabLabel={common('newTab')}>
            GitHub
          </OutlineButton>
          <OutlineButton href={site.linkedin} external newTabLabel={common('newTab')}>
            LinkedIn
          </OutlineButton>
        </div>
      </div>
    </Section>
  );
}
