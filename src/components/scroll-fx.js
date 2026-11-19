/**
 * Efectos ligados al scroll, sin dependencias. Lo usan ScrollFx.tsx (Next.js) y la vista previa.
 *
 * 1. Cada [data-pin] (sección alta con escenario sticky) recibe tres variables CSS:
 *    --live = 1 (sin JS o con movimiento reducido no existe y el marcado usa sus valores estáticos),
 *    --in   = 0–1 mientras la sección entra en pantalla,
 *    --p    = 0–1 mientras está fija.
 *    El marcado decide qué pasa en cada tramo con clamp()/calc().
 * 2. Salida del hero: el texto (`heroContent`) se fija en pantalla y, cuando “<” y “>” ya salieron
 *    de la pantalla del engrane (gear-scene.js), el remolino que queda lo traga. Cada [data-ch]
 *    (letras del nombre y del subtítulo, y cada botón) entra en una órbita que se cierra: gira cada
 *    vez más rápido y se encoge con la distancia, y solo se desvanece ya pequeño, en el centro.
 *    Los más cercanos caen primero.
 * 3. Un [data-goto="0.4"] dentro de un [data-pin] lleva el scroll a ese punto del tramo fijo.
 * 4. Cada [data-enter] (el pie de página) recibe --live y --e = 0–1 mientras entra en pantalla; llega
 *    a 1 justo antes de que se vea completo, así que también termina al final de la página.
 */
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
const DEG = 180 / Math.PI;
/** Aleatorio estable por índice: las piezas caen siempre en el mismo orden. */
const hash = (i) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const PIN_VARS = ['--live', '--p', '--in', '--e', '--a0', '--a1', '--a2', '--a3', '--a4', '--a5'];

export function mountScrollFx({ root, hero = null, heroContent = null, reducedMotion = false }) {
  const exit = !!(hero && heroContent) && !reducedMotion;
  const prevStyle = exit ? heroContent.getAttribute('style') : null;
  // Transición propia de cada pieza (los botones animan opacidad): se apaga mientras caen.
  const trans = new WeakMap();
  let raf = 0;
  let dirty = true;
  let hidden = false;
  let heroTop = 0;
  let heroH = 1;
  let parts = [];

  function pinHero() {
    const top = hero.getBoundingClientRect().top + window.scrollY;
    Object.assign(heroContent.style, { position: 'fixed', left: '0', right: '0', top: `${top}px` });
  }

  function reset(el) {
    el.style.transform = '';
    el.style.opacity = '';
    if (trans.has(el)) el.style.transition = trans.get(el);
  }

  function measure() {
    dirty = false;
    heroTop = hero.getBoundingClientRect().top + window.scrollY;
    heroH = Math.max(hero.offsetHeight, 1);
    const els = Array.from(heroContent.querySelectorAll('[data-ch]'));
    for (const el of els) {
      if (!trans.has(el)) trans.set(el, el.style.transition);
      reset(el);
    }
    // Centro del agujero al empezar (misma posición inicial que gear-scene.js).
    const hx = window.innerWidth / 2;
    const hy = heroTop + heroH * 0.3;
    parts = els.map((el, i) => {
      const r = el.getBoundingClientRect();
      const c = [r.left + r.width / 2, r.top + r.height / 2];
      return { el, c, d: Math.hypot(c[0] - hx, c[1] - hy), r: hash(i + 1), r2: hash(i + 57), on: false };
    });
    let d0 = Infinity;
    let d1 = 0;
    for (const q of parts) {
      d0 = Math.min(d0, q.d);
      d1 = Math.max(d1, q.d);
    }
    for (const q of parts) {
      const dn = d1 > d0 ? (q.d - d0) / (d1 - d0) : 0;
      // Los más cercanos al remolino caen primero; cada pieza tarda lo mismo en cerrar su órbita.
      q.at = 0.2 + dn * 0.22 + q.r * 0.05;
      q.len = 0.4;
    }
  }

  function heroExit(vh) {
    const h = window.scrollY / vh;
    if (h >= 0.9) {
      if (!hidden) {
        heroContent.style.visibility = 'hidden';
        hidden = true;
      }
      return;
    }
    if (hidden) {
      heroContent.style.visibility = '';
      hidden = false;
    }
    if (dirty) measure();
    heroContent.style.pointerEvents = h > 0.04 ? 'none' : '';
    // El agujero sigue a la pantalla del engrane (misma trayectoria que gear-scene.js).
    const tx = window.innerWidth / 2;
    const ty = lerp(heroTop + heroH * 0.3, vh / 2, smooth(clamp01(h / 0.7)));

    for (const q of parts) {
      const t = clamp01((h - q.at) / q.len);
      if (t <= 0) {
        if (q.on) {
          reset(q.el);
          q.on = false;
        }
        continue;
      }
      if (!q.on) {
        q.el.style.transition = 'none';
        q.on = true;
      }
      // Órbita que se cierra, como en un remolino real: cada pieza gira alrededor del centro en el
      // sentido del remolino, más rápido conforme el radio se encoge; rueda con el giro, se ladea en
      // 3D y solo se desvanece ya pequeña, en el centro.
      const vx = q.c[0] - tx;
      const vy = q.c[1] - ty;
      const rho = 1 - Math.pow(t, 1.6);
      const th = Math.PI * 2.2 * Math.pow(t, 1.5);
      const cs = Math.cos(th);
      const sn = Math.sin(th);
      const x = tx + (vx * cs - vy * sn) * rho;
      const y = ty + (vx * sn + vy * cs) * rho;
      const spin = th * DEG + (q.r - 0.5) * 60 * t;
      const tilt = (25 + 35 * q.r2) * Math.sin(Math.PI * Math.min(1, t * 1.15));
      q.el.style.transform = `translate3d(${(x - q.c[0]).toFixed(1)}px,${(y - q.c[1]).toFixed(1)}px,0) perspective(600px) rotate3d(${(q.r2 - 0.5).toFixed(3)},1,0,${tilt.toFixed(1)}deg) rotate(${spin.toFixed(1)}deg) scale(${(0.1 + 0.9 * rho).toFixed(3)})`;
      q.el.style.opacity = String(1 - smooth(clamp01((t - 0.75) / 0.25)));
    }
  }

  /**
   * [data-steps="0.29,0.46,…"]: umbrales del tramo fijo. Se activa exactamente un paso a la vez:
   * --a0…--aN valen 1 (activo) o 0, sin valores intermedios; las transiciones CSS hacen el cambio.
   */
  function steps(el, p) {
    const list = el.getAttribute('data-steps');
    if (!list) return;
    const th = list.split(',').map(Number);
    let k = 0;
    for (const v of th) if (p >= v) k++;
    if (el.__step === k) return;
    el.__step = k;
    for (let i = 0; i <= th.length; i++) el.style.setProperty(`--a${i}`, i === k ? '1' : '0');
  }

  function update() {
    raf = 0;
    const vh = Math.max(window.innerHeight, 1);
    if (!reducedMotion) {
      for (const el of root.querySelectorAll('[data-pin]')) {
        const top = el.getBoundingClientRect().top;
        const run = Math.max(el.offsetHeight - vh, 1);
        el.style.setProperty('--live', '1');
        el.style.setProperty('--p', clamp01(-top / run).toFixed(4));
        el.style.setProperty('--in', clamp01((vh - top) / vh).toFixed(4));
        steps(el, clamp01(-top / run));
      }
      for (const el of root.querySelectorAll('[data-enter]')) {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--live', '1');
        el.style.setProperty('--e', smooth(clamp01((vh - r.top) / Math.max(1, Math.min(r.height, vh) * 0.85))).toFixed(4));
      }
    }
    if (exit) heroExit(vh);
  }

  const kick = () => {
    if (!raf) raf = requestAnimationFrame(update);
  };
  const onResize = () => {
    dirty = true;
    if (exit) pinHero();
    kick();
  };
  const onClick = (ev) => {
    const btn = ev.target instanceof Element ? ev.target.closest('[data-goto]') : null;
    const pin = btn ? btn.closest('[data-pin]') : null;
    if (!pin) return;
    const run = pin.offsetHeight - window.innerHeight;
    if (run <= 0) return;
    const top = pin.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + run * Number(btn.getAttribute('data-goto')), behavior: 'smooth' });
  };

  if (exit) pinHero();
  window.addEventListener('scroll', kick, { passive: true });
  window.addEventListener('resize', onResize);
  root.addEventListener('click', onClick);
  // La entrada del hero desplaza el texto ~16 px; se vuelve a medir cuando termina.
  const settle = setTimeout(onResize, 1600);
  update();

  return {
    refresh() {
      dirty = true;
      update();
    },
    destroy() {
      clearTimeout(settle);
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', kick);
      window.removeEventListener('resize', onResize);
      root.removeEventListener('click', onClick);
      for (const el of root.querySelectorAll('[data-pin],[data-enter]')) PIN_VARS.forEach((v) => el.style.removeProperty(v));
      if (exit) {
        for (const el of heroContent.querySelectorAll('[data-ch]')) reset(el);
        if (prevStyle === null) heroContent.removeAttribute('style');
        else heroContent.setAttribute('style', prevStyle);
      }
    },
  };
}
