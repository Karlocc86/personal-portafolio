import { useTranslations } from 'next-intl';
import { site } from '@/lib/site';
import { HeroGear } from './HeroGear';
import { OutlineButton, PrimaryButton } from './ui';

export function Hero() {
  const t = useTranslations('Hero');
  const common = useTranslations('Common');

  return (
    <section
      id="top"
      aria-labelledby="hero-title"
      className="relative flex min-h-[calc(100svh-3.5rem)] items-center overflow-hidden bg-canvas px-6"
    >
      <HeroGear />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent_55%,var(--hero-glow))]"
      />
      <div className="relative z-10 mx-auto w-full max-w-[1200px] pb-[72px] pt-[clamp(230px,44svh,440px)] text-center">
        <h1
          id="hero-title"
          className="rise text-balance text-[clamp(2.5rem,5.6vw,4.75rem)] font-semibold leading-[1.05] tracking-[-0.03em]"
        >
          {t('name')}
        </h1>
        <p className="rise mx-auto mt-4 max-w-[920px] text-balance text-[clamp(1.25rem,2.1vw,1.75rem)] font-semibold leading-[1.25] tracking-[-0.02em] [--delay:120ms]">
          {t('role')}. <span className="text-ink-muted">{t('focus')}.</span>
        </p>
        <div className="rise mt-7 flex flex-wrap items-center justify-center gap-2.5 [--delay:360ms]">
          <PrimaryButton href="#contact">{t('contact')}</PrimaryButton>
          <OutlineButton href={site.github} external newTabLabel={common('newTab')}>
            GitHub
          </OutlineButton>
          <OutlineButton href={site.linkedin} external newTabLabel={common('newTab')}>
            LinkedIn
          </OutlineButton>
        </div>
      </div>
    </section>
  );
}
