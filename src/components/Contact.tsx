import { useTranslations } from 'next-intl';
import { site } from '@/lib/site';
import { CopyEmail } from './CopyEmail';
import { SectionTitle } from './ui';

export function Contact() {
  const t = useTranslations('Contact');

  return (
    <section id="contact" aria-labelledby="contact-title" className="bg-canvas px-6 py-[clamp(96px,12vw,160px)]">
      <div className="mx-auto max-w-[1200px] text-center">
        <SectionTitle id="contact-title">{t('title')}</SectionTitle>
        <p
          data-reveal
          className="mx-auto mt-6 max-w-[36rem] text-pretty text-[clamp(19px,2vw,21px)] leading-[1.45] text-ink-muted [--delay:80ms]"
        >
          {t('lead')}
        </p>
        {/* El correo se “teclea” al entrar en pantalla (.type-in en globals.css). */}
        <div data-reveal className="mt-11 [--delay:160ms]">
          <a
            href={`mailto:${site.email}`}
            className="type-in inline-block text-[clamp(1.375rem,5.2vw,3.75rem)] font-semibold leading-[1.15] tracking-[-0.03em] text-ink underline transition-colors duration-200 ease-apple [overflow-wrap:anywhere] [text-decoration-color:var(--line)] [text-decoration-thickness:0.04em] [text-underline-offset:0.16em] hover:text-link hover:[text-decoration-color:var(--link)]"
          >
            {site.email}
          </a>
        </div>
        <div data-reveal className="mt-7 flex justify-center [--delay:240ms]">
          <CopyEmail email={site.email} label={t('copy')} copiedLabel={t('copied')} />
        </div>
      </div>
    </section>
  );
}
