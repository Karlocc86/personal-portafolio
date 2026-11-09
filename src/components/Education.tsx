import { useTranslations } from 'next-intl';
import { Label, Section, SectionTitle } from './ui';

const cardClass = 'rounded-[28px] bg-canvas p-8 shadow-card dark:shadow-none sm:p-10';

export function Education() {
  const t = useTranslations('Education');
  const courses = t.raw('education.courses') as string[];

  return (
    <Section id="education" tone="alt" labelledBy="education-title">
      <SectionTitle id="education-title">{t('title')}</SectionTitle>

      <div className="mt-16 grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <article data-reveal className={cardClass}>
          <Label>{t('education.label')}</Label>
          <h3 className="mt-4 text-[28px] font-semibold leading-[1.14] tracking-[-0.015em] sm:text-[32px]">
            {t('education.school')}
          </h3>
          <p className="mt-2 text-[17px] leading-[1.4] sm:text-[19px]">{t('education.degree')}</p>
          <p className="mt-1 text-[15px] text-ink-muted sm:text-[17px]">{t('education.meta')}</p>

          <Label as="h4" className="mt-10">
            {t('education.coursesLabel')}
          </Label>
          <ul className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {courses.map((course) => (
              <li key={course} className="text-[17px] leading-[1.4]">
                {course}
              </li>
            ))}
          </ul>
        </article>

        <article data-reveal className={`${cardClass} [--delay:80ms]`}>
          <Label>{t('award.label')}</Label>
          <h3 className="mt-4 text-[28px] font-semibold leading-[1.14] tracking-[-0.015em] sm:text-[32px]">
            {t('award.title')}
          </h3>
          <p className="mt-2 text-[17px] leading-[1.4] sm:text-[19px]">{t('award.event')}</p>
          <p className="mt-6 text-[17px] leading-[1.5] text-ink-muted">{t('award.description')}</p>
        </article>
      </div>
    </Section>
  );
}
