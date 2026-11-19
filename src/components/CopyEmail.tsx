'use client';

import { useEffect, useRef, useState } from 'react';

/** Copia el correo al portapapeles; si el navegador no lo permite, abre el cliente de correo. */
export function CopyEmail({ email, label, copiedLabel }: { email: string; label: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-live="polite"
      className="inline-flex h-10 flex-none cursor-pointer items-center justify-center rounded-lg border border-line px-4 text-[15px] font-medium whitespace-nowrap text-ink transition-colors duration-200 ease-apple hover:border-ink-muted hover:bg-[var(--seg)]"
    >
      {copied ? copiedLabel : label}
    </button>
  );
}
