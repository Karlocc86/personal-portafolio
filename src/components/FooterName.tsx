'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Nombre del pie con aspecto de metal grabado. Sube al entrar en pantalla (scroll-fx.js publica
 * --live y --e en el [data-enter] del pie) y cada 5.2 s lo cruza un destello de izquierda a derecha.
 */
export function FooterName({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof el.animate !== 'function') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // La franja de luz cruza el nombre y descansa antes de repetir.
    const shine = el.animate(
      [
        { backgroundPosition: '100% 0, 0 0', offset: 0, easing: 'cubic-bezier(0.45, 0, 0.2, 1)' },
        { backgroundPosition: '0% 0, 0 0', offset: 0.4 },
        { backgroundPosition: '0% 0, 0 0', offset: 1 },
      ],
      { duration: 5200, iterations: Infinity, delay: 600 },
    );
    return () => shine.cancel();
  }, []);

  return (
    <p
      ref={ref}
      className="whitespace-nowrap text-[clamp(44px,12vw,156px)] leading-[0.95] font-semibold tracking-[-0.035em] uppercase"
      style={{
        padding: '0.06em 0.04em 0.08em',
        backgroundImage:
          'linear-gradient(100deg, transparent 44%, var(--name-shine) 50%, transparent 56%), linear-gradient(180deg, var(--name-hi) 0%, var(--name-mid) 55%, var(--name-lo) 100%)',
        backgroundSize: '300% 100%, 100% 100%',
        backgroundPosition: '0% 0, 0 0',
        backgroundRepeat: 'no-repeat',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
        filter: 'drop-shadow(0 1px 0 var(--name-edge))',
        transform: 'translateY(calc(var(--live,0) * (1 - var(--e,0)) * 105%))',
      }}
    >
      {children}
    </p>
  );
}
