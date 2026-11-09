import type { ReactNode } from 'react';
import { ChevronRight } from './icons';

export function Label({
  as: Tag = 'p',
  className = '',
  children,
}: {
  as?: 'p' | 'h4' | 'dt';
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag className={`font-mono text-[12px] uppercase tracking-[0.08em] text-ink-muted ${className}`}>{children}</Tag>
  );
}

export function PrimaryButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-ink px-4 text-[15px] font-medium text-canvas transition-opacity duration-300 ease-apple hover:opacity-85"
    >
      {children}
      <ChevronRight className="size-3" />
    </a>
  );
}

export function OutlineButton({
  href,
  children,
  external = false,
  newTabLabel,
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
  newTabLabel?: string;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'me noopener noreferrer' } : {})}
      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-line px-4 text-[15px] font-medium text-ink transition-colors duration-300 ease-apple hover:bg-ink/[0.07]"
    >
      {children}
      {external && newTabLabel ? <span className="sr-only">{newTabLabel}</span> : null}
      <ChevronRight className="size-3" />
    </a>
  );
}

/** Enlace secundario estilo “Más información >”. */
export function ChevronLink({
  href,
  children,
  external = false,
  newTabLabel,
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
  newTabLabel?: string;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'me noopener noreferrer' } : {})}
      className="group inline-flex min-h-11 items-center gap-1 text-[17px] text-link underline-offset-4 hover:underline"
    >
      {children}
      {external && newTabLabel ? <span className="sr-only">{newTabLabel}</span> : null}
      <ChevronRight className="size-3 transition-transform duration-300 ease-apple group-hover:translate-x-0.5" />
    </a>
  );
}

export function Section({
  id,
  labelledBy,
  tone = 'base',
  children,
}: {
  id: string;
  labelledBy: string;
  tone?: 'base' | 'alt';
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={`${tone === 'alt' ? 'bg-canvas-alt' : 'bg-canvas'} px-6 py-24 sm:py-32 lg:py-36`}
    >
      <div className="mx-auto max-w-[980px]">{children}</div>
    </section>
  );
}

export function SectionTitle({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2
      id={id}
      data-reveal
      className="text-balance bg-[linear-gradient(90deg,var(--ink-muted),var(--ink)_3.5em)] bg-clip-text text-[clamp(2.5rem,6vw,3.5rem)] font-semibold leading-[1.07] tracking-[-0.025em] text-transparent"
    >
      {children}
    </h2>
  );
}

/** Retrasos escalonados para [data-reveal] (clases literales para que Tailwind las detecte). */
export const REVEAL_DELAYS = ['[--delay:0ms]', '[--delay:80ms]', '[--delay:160ms]', '[--delay:240ms]'] as const;
