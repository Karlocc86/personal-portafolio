'use client';

import { MoonIcon, SunIcon } from './icons';

export function ThemeToggle({ label }: { label: string }) {
  function toggle() {
    const root = document.documentElement;
    const next = root.classList.contains('dark') ? 'light' : 'dark';
    root.classList.toggle('dark', next === 'dark');
    root.style.colorScheme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {
      // Almacenamiento no disponible (modo privado): el cambio dura solo esta visita.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="inline-flex size-8 items-center justify-center rounded-md text-ink-muted transition-colors duration-300 ease-apple hover:text-ink"
    >
      <MoonIcon className="size-4 dark:hidden" />
      <SunIcon className="hidden size-4 dark:block" />
    </button>
  );
}
