import { useTranslations } from 'next-intl';
import { Label, Section, SectionTitle } from './ui';

const cardClass = 'min-w-0 rounded-[28px] bg-canvas p-[clamp(28px,4vw,44px)] shadow-card dark:shadow-none';
const yearClass =
  'font-mono text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[0.9] tracking-[-0.04em] text-ink-muted opacity-35';
const titleClass = 'mt-5 text-balance text-[clamp(1.75rem,3.4vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.02em]';
const leadClass = 'mt-2.5 text-[clamp(1.0625rem,1.8vw,1.1875rem)] leading-[1.4]';

export function Education() {
  const t = useTranslations('Education');
  const courses = t.raw('education.courses') as string[];

  return (
    <Section id="education" tone="alt" labelledBy="education-title">
      <SectionTitle id="education-title">{t('title')}</SectionTitle>

      <div className="mt-16 flex flex-wrap gap-5">
        <article data-reveal className={`${cardClass} flex-[1.4_1_460px]`}>
          <div className="flex items-start justify-between gap-4">
            <Label>{t('education.label')}</Label>
            {/* Decorativo: el año ya aparece en el texto de abajo. */}
            <p aria-hidden="true" className={yearClass}>
              {t('education.year')}
            </p>
          </div>
          <h3 className={titleClass}>{t('education.school')}</h3>
          <p className={leadClass}>{t('education.degree')}</p>
          <p className="mt-1 text-[clamp(0.9375rem,1.6vw,1.0625rem)] text-ink-muted">{t('education.meta')}</p>

          <Label as="h4" className="mt-9">
            {t('education.coursesLabel')}
          </Label>
          <ol className="mt-3">
            {courses.map((course, i) => (
              <li key={course} className="flex items-baseline gap-4 border-t border-[var(--hairline)] py-3">
                <span aria-hidden="true" className="flex-none font-mono text-[12px] leading-none tracking-[0.08em] text-ink-muted">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-[17px] leading-[1.4]">{course}</span>
              </li>
            ))}
          </ol>
        </article>

        <article data-reveal className={`${cardClass} flex-[1_1_340px] [--delay:80ms]`}>
          <div className="flex items-start justify-between gap-4">
            <Label>{t('award.label')}</Label>
            <p aria-hidden="true" className={yearClass}>
              {t('award.year')}
            </p>
          </div>
          <h3 className={titleClass}>{t('award.title')}</h3>
          <p className={leadClass}>{t('award.event')}</p>
          <p className="mt-6 border-t border-[var(--hairline)] pt-6 text-pretty text-[17px] leading-[1.5] text-ink-muted">
            {t('award.description')}
          </p>
        </article>
      </div>
    </Section>
  );
}
