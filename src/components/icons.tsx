import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
} as const;

export function ChevronRight(props: IconProps) {
  return (
    <svg viewBox="0 0 12 12" strokeWidth={1.6} {...base} {...props}>
      <path d="M4.5 2.5 8 6l-3.5 3.5" />
    </svg>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth={1.6} {...base} {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
    </svg>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth={1.6} {...base} {...props}>
      <path d="M20 14.2A8.2 8.2 0 1 1 9.8 4a6.6 6.6 0 0 0 10.2 10.2Z" />
    </svg>
  );
}

export function CodeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth={1.5} {...base} {...props}>
      <path d="m8 7-5 5 5 5M16 7l5 5-5 5M13.5 4.5l-3 15" />
    </svg>
  );
}

export function LayersIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth={1.5} {...base} {...props}>
      <path d="m12 3.5 8.5 4.5-8.5 4.5L3.5 8 12 3.5Z" />
      <path d="m3.5 12 8.5 4.5 8.5-4.5" />
      <path d="m3.5 16 8.5 4.5 8.5-4.5" />
    </svg>
  );
}

export function CloudIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth={1.5} {...base} {...props}>
      <path d="M7 18.5a4.5 4.5 0 0 1-.4-9A6 6 0 0 1 18 8.6a5 5 0 0 1-.5 9.9H7Z" />
    </svg>
  );
}

export function TerminalIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth={1.5} {...base} {...props}>
      <rect x="3" y="4.5" width="18" height="15" rx="3.5" />
      <path d="m7.5 10 2.5 2-2.5 2M12.5 14.5h4" />
    </svg>
  );
}
