import { useTranslations } from 'next-intl';
import { site } from '@/lib/site';
import { HeroGear } from './HeroGear';
import { ChevronDown } from './icons';
import { OutlineButton, PrimaryButton } from './ui';

export function Hero() {
  const t = useTranslations('Hero');
  const common = useTranslations('Common');

  return (
    // z-[2]: el lienzo del engrane queda fijo durante el portal y debe pintarse sobre “Sobre mí”.
    <section
      id="top"
      aria-labelledby="hero-title"
      className="relative z-[2] flex min-h-[calc(100svh-3.5rem)] items-center overflow-hidden bg-canvas px-6"
    >
      <HeroGear />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,var(--hero-glow)_80%,transparent)]"
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
      <a
        href="#about"
        className="scroll-cue absolute bottom-[22px] left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1.5 font-mono text-[11px] uppercase leading-none tracking-[0.12em] text-ink-muted transition-[opacity,color] duration-[400ms] ease-apple hover:text-ink"
      >
        {t('scroll')}
        <ChevronDown className="size-3" />
      </a>
    </section>
  );
}
