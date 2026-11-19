import { useTranslations } from 'next-intl';
import { site } from '@/lib/site';
import { HeroGear } from './HeroGear';
import { ChevronDown } from './icons';
import { OutlineButton, PrimaryButton } from './ui';

/** Palabras y letras sueltas: scroll-fx.js mete cada [data-ch] al remolino del engrane. */
const split = (text: string) =>
  text
    .split(' ')
    .filter(Boolean)
    .map((word) => Array.from(word));

function Letters({ text, wordHidden = false, charClass }: { text: string; wordHidden?: boolean; charClass: string }) {
  return split(text).map((chars, w) => (
    <span key={w} aria-hidden={wordHidden || undefined} className="inline-flex whitespace-nowrap">
      {chars.map((char, c) => (
        <span key={c} data-ch="" className={charClass}>
          {char}
        </span>
      ))}
    </span>
  ));
}

export function Hero() {
  const t = useTranslations('Hero');
  const common = useTranslations('Common');
  const name = t('name');
  const role = `${t('role')}.`;
  const focus = `${t('focus')}.`;

  return (
    // z-[2]: el lienzo del engrane queda fijo durante el portal y debe pintarse sobre “Sobre mí”.
    <section
      id="top"
      aria-labelledby="hero-title"
      className="relative z-[2] flex min-h-[calc(100svh-3.5rem)] items-center overflow-hidden bg-canvas"
    >
      <HeroGear />
      {/* scroll-fx.js fija este contenedor en pantalla al bajar: por eso lleva su propia altura. */}
      <div data-hero-content="" className="relative z-[1] box-border flex min-h-[calc(100svh-3.5rem)] w-full items-center px-6">
        <div className="mx-auto w-full max-w-[1200px] pb-[72px] pt-[clamp(230px,44svh,440px)] text-center">
          <h1
            id="hero-title"
            aria-label={name}
            className="rise flex flex-wrap justify-center gap-x-[0.26em] text-[clamp(40px,5.6vw,76px)] leading-[1.05] font-semibold tracking-[-0.03em]"
          >
            <Letters text={name} wordHidden charClass="inline-block will-change-[transform,opacity]" />
          </h1>
          <p className="rise relative mx-auto mt-4 flex max-w-[920px] flex-col items-center text-[clamp(20px,2.1vw,28px)] leading-[1.25] font-semibold tracking-[-0.02em] [--delay:120ms]">
            <span className="sr-only">{`${role} ${focus}`}</span>
            <span aria-hidden="true" className="flex flex-wrap justify-center gap-x-[0.25em]">
              <Letters text={role} charClass="inline-block" />
            </span>
            <span aria-hidden="true" className="flex flex-wrap justify-center gap-x-[0.25em] text-ink-muted">
              <Letters text={focus} charClass="inline-block" />
            </span>
          </p>
          <div className="rise mt-7 flex flex-wrap items-center justify-center gap-2.5 [--delay:240ms]">
            <PrimaryButton href="#contact" data-ch="">
              {t('contact')}
            </PrimaryButton>
            <OutlineButton href={site.github} external newTabLabel={common('newTab')} data-ch="">
              GitHub
            </OutlineButton>
            <OutlineButton href={site.linkedin} external newTabLabel={common('newTab')} data-ch="">
              LinkedIn
            </OutlineButton>
          </div>
        </div>
      </div>
      <a
        href="#about"
        className="scroll-cue absolute bottom-[22px] left-1/2 z-[1] flex -translate-x-1/2 flex-col items-center gap-1.5 font-mono text-[11px] uppercase leading-none tracking-[0.12em] text-ink-muted transition-opacity duration-200 ease-apple hover:text-ink"
      >
        {t('scroll')}
        <ChevronDown className="size-3" />
      </a>
    </section>
  );
}
