import { useTranslations } from 'next-intl';

export function Footer() {
  const t = useTranslations('Footer');

  return (
    <footer className="bg-canvas-alt px-6 py-8">
      <p className="mx-auto max-w-[1200px] text-[12px] text-ink-muted">{t('copyright')}</p>
    </footer>
  );
}
