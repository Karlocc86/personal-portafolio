import { useTranslations } from 'next-intl';
import { CloudIcon, CodeIcon, LayersIcon, TerminalIcon } from './icons';
import { REVEAL_DELAYS, Section, SectionTitle } from './ui';

const GROUPS = [
  { key: 'languages', Icon: CodeIcon },
  { key: 'web', Icon: LayersIcon },
  { key: 'cloud', Icon: CloudIcon },
  { key: 'tools', Icon: TerminalIcon },
] as const;

/** “Supabase (Auth, Row Level Security)” → nombre + detalle en gris. */
function Chip({ label }: { label: string }) {
  const match = label.match(/^(.+?)\s*\((.+)\)$/);
  return (
    <li className="rounded-full bg-canvas px-3.5 py-1.5 font-mono text-[13px] leading-5 text-ink">
      {match ? (
        <>
          {match[1]} <span className="text-ink-muted">({match[2]})</span>
        </>
      ) : (
        label
      )}
    </li>
  );
}

export function Tools() {
  const t = useTranslations('Tools');

  return (
    <Section id="tools" labelledBy="tools-title">
      <SectionTitle id="tools-title">{t('title')}</SectionTitle>
      <p
        data-reveal
        className="mt-6 max-w-[40rem] text-pretty text-[19px] leading-[1.45] text-ink-muted sm:text-[21px] [--delay:80ms]"
      >
        {t('lead')}
      </p>

      <div className="mt-16 grid gap-5 md:grid-cols-2">
        {GROUPS.map(({ key, Icon }, i) => {
          const items = t.raw(`groups.${key}.items`) as string[];
          return (
            <div key={key} data-reveal className={`rounded-[28px] bg-canvas-alt p-8 sm:p-10 ${REVEAL_DELAYS[i % 2]}`}>
              <Icon className="size-7 text-ink" />
              <h3 id={`tools-${key}`} className="mt-5 text-[21px] font-semibold tracking-[-0.01em] sm:text-[24px]">
                {t(`groups.${key}.title`)}
              </h3>
              <ul aria-labelledby={`tools-${key}`} className="mt-6 flex flex-wrap gap-2">
                {items.map((item) => (
                  <Chip key={item} label={item} />
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
