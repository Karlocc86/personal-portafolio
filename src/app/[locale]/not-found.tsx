import { useLocale, useTranslations } from 'next-intl';
import { ChevronLink } from '@/components/ui';

export default function NotFound() {
  const t = useTranslations('NotFound');
  const locale = useLocale();

  return (
    <main className="flex min-h-svh items-center justify-center bg-canvas px-6 text-center">
      <div>
        <p className="font-mono text-[12px] uppercase tracking-[0.08em] text-ink-muted">404</p>
        <h1 className="mt-4 text-balance text-[clamp(2.5rem,6vw,3.5rem)] font-semibold leading-[1.07] tracking-[-0.02em]">
          {t('title')}
        </h1>
        <p className="mt-4 text-[19px] text-ink-muted">{t('description')}</p>
        <div className="mt-6 flex justify-center">
          <ChevronLink href={`/${locale}`}>{t('back')}</ChevronLink>
        </div>
      </div>
    </main>
  );
}
