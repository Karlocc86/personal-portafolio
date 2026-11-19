/**
 * Proyectos: cada [data-project] es una sección alta con un escenario sticky. Aquí solo se publica
 * su progreso de scroll (0–1) en la variable CSS --p; el marcado decide qué aparece en cada tramo
 * con clamp()/calc() sobre --p (interfaz → datos → resultado). Sin dependencias.
 * Lo usan SceneMount.tsx (Next.js) y la vista previa de diseño.
 */
export function mountProjects({ root }) {
  const sections = Array.from(root.querySelectorAll('[data-project]'));
  let raf = 0;

  const update = () => {
    raf = 0;
    const vh = window.innerHeight;
    for (const section of sections) {
      const run = Math.max(section.offsetHeight - vh, 1);
      const p = Math.min(1, Math.max(0, -section.getBoundingClientRect().top / run));
      section.style.setProperty('--p', p.toFixed(4));
    }
  };
  const kick = () => {
    if (!raf) raf = requestAnimationFrame(update);
  };

  window.addEventListener('scroll', kick, { passive: true });
  window.addEventListener('resize', kick);
  update();

  return {
    refresh: update,
    destroy() {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', kick);
      window.removeEventListener('resize', kick);
    },
  };
}
