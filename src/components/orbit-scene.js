/**
 * “Con qué trabajo” como sistema de órbitas: el engrane del hero al centro y las herramientas
 * girando a su alrededor en cuatro anillos (uno por categoría). Se arrastra para girar; al llegar
 * a la sección, las herramientas salen disparadas del engrane. Canvas 2D + etiquetas HTML, sin
 * dependencias. Lo usan SceneMount.tsx (Next.js) y la vista previa de diseño.
 *
 * Marcado esperado dentro de `root`:
 *   [data-stage]                 escenario (posición relativa); contiene el lienzo y las listas
 *   canvas[data-orbit]           anillos y engrane
 *   [data-ring-list]             una lista por categoría
 *   [data-tool][data-ring="0-3"] cada herramienta, con [data-dot], [data-name] y opcional [data-detail]
 *   [data-ring-btn="0-3"]        leyenda: enfoca una categoría
 * Sin JavaScript las listas quedan como texto normal; el modo órbita se activa al montar.
 */

const TAU = Math.PI * 2;
const SEG = 96;
/** Radio (fracción del radio exterior), inclinación y velocidad angular de cada anillo. */
const RINGS = [
  { r: 0.36, incl: 0, speed: 0.16 },
  { r: 0.6, incl: 0.16, speed: -0.1 },
  { r: 0.81, incl: -0.12, speed: 0.075 },
  { r: 1, incl: 0.09, speed: -0.055 },
];

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const ease = (t) => 1 - Math.pow(1 - t, 3);
const back = (t) => 1 + 2.6 * Math.pow(t - 1, 3) + 1.6 * Math.pow(t - 1, 2);

/** Silueta del engrane de 8 dientes (la misma del hero). */
function gearRadius(t) {
  const step = Math.PI / 4;
  let d = ((t % step) + step) % step;
  d = Math.min(d, step - d);
  const k = clamp((d - 0.113) / 0.192, 0, 1);
  return 0.857 + 0.143 * (1 - k * k * (3 - 2 * k));
}

export function mountOrbit({ root, isDark, reducedMotion = false }) {
  const stage = root.querySelector('[data-stage]');
  const canvas = root.querySelector('canvas[data-orbit]');
  const ctx = canvas ? canvas.getContext('2d') : null;
  if (!stage || !ctx) return null;

  const counts = RINGS.map(() => 0);
  const items = Array.from(root.querySelectorAll('[data-tool]')).map((el) => {
    const ring = clamp(Number(el.dataset.ring) || 0, 0, RINGS.length - 1);
    return { el, ring, index: counts[ring]++, name: el.querySelector('[data-name]'), detail: el.querySelector('[data-detail]'), dot: el.querySelector('[data-dot]') };
  });
  for (const it of items) it.phase = (it.index / counts[it.ring]) * TAU + it.ring * 0.7;
  const buttons = Array.from(root.querySelectorAll('[data-ring-btn]'));

  // Modo órbita: las listas dejan de fluir y cada etiqueta se posiciona sobre el escenario.
  stage.style.height = 'clamp(440px, 52vw, 620px)';
  stage.style.cursor = 'grab';
  stage.style.userSelect = 'none';
  stage.style.webkitUserSelect = 'none';
  root.querySelectorAll('[data-ring-list]').forEach((ul) => {
    ul.style.display = 'block';
    ul.style.margin = '0';
  });
  for (const it of items) {
    const s = it.el.style;
    s.position = 'absolute';
    s.left = '50%';
    s.top = '50%';
    s.margin = '0';
    s.opacity = '0';
    s.willChange = 'transform, opacity';
    if (it.detail) it.detail.style.display = 'none';
  }

  let W = 1;
  let H = 1;
  let R = 200;
  let narrow = null;
  let yaw = 0.5;
  let elev = 0.4;
  let velYaw = 0;
  let spin = 1;
  let clock = 0;
  let seenAt = reducedMotion ? 0 : -1;
  let focus = null;
  let userPicked = false;
  let hovered = null;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let inView = false;
  let raf = 0;
  let last = performance.now();
  let alive = true;
  let sy = 0;
  let cy = 1;
  let se = 0;
  let ce = 1;

  function project(r, a, incl) {
    const x0 = r * Math.cos(a);
    const z0 = r * Math.sin(a);
    const x1 = x0 * Math.cos(incl);
    const y1 = x0 * Math.sin(incl);
    const x2 = x1 * cy + z0 * sy;
    const z2 = -x1 * sy + z0 * cy;
    const depth = z2 * ce + y1 * se;
    const k = (R * 3.4) / (R * 3.4 - depth);
    return [x2 * k, (-y1 * ce + z2 * se) * k, depth];
  }

  function paintFocus() {
    buttons.forEach((btn) => {
      const on = Number(btn.dataset.ringBtn) === focus;
      btn.setAttribute('aria-pressed', String(on));
      btn.style.color = on ? 'var(--ink)' : 'var(--ink-muted)';
      btn.style.borderColor = on ? 'var(--link)' : 'var(--hairline)';
    });
    for (const it of items) paintItem(it);
  }

  /** Fuera de la categoría enfocada, la herramienta se reduce a un punto. */
  function paintItem(it) {
    const hot = hovered === it;
    const dim = focus !== null && focus !== it.ring && !hot;
    if (it.name) it.name.style.display = dim ? 'none' : '';
    if (it.detail) it.detail.style.display = hot ? '' : 'none';
    it.el.style.padding = dim ? '5px' : '';
    it.el.style.color = hot || (focus !== null && focus === it.ring) ? 'var(--ink)' : '';
    if (it.dot) {
      it.dot.style.background = hot ? 'var(--link)' : '';
      it.dot.style.borderColor = hot ? 'var(--link)' : '';
    }
  }

  function measure() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(stage.clientWidth, 1);
    H = Math.max(stage.clientHeight, 1);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const isNarrow = W < 700;
    if (isNarrow !== narrow) {
      narrow = isNarrow;
      // En pantallas angostas no caben 25 nombres: se ve más desde arriba y se enfoca una categoría.
      elev = narrow ? 0.62 : 0.4;
      if (!userPicked) focus = narrow ? 1 : null;
      paintFocus();
    }
    R = Math.min(Math.max(W * 0.5 - 64, 190), (H * 0.5) / (Math.sin(elev) + 0.14));
  }

  function drawGear(x, y, G, rot, dark) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    for (let i = 0; i <= 240; i++) {
      const t = (i / 240) * TAU;
      const r = gearRadius(t) * G;
      if (i) ctx.lineTo(r * Math.cos(t + rot), r * Math.sin(t + rot));
      else ctx.moveTo(r * Math.cos(t + rot), r * Math.sin(t + rot));
    }
    ctx.closePath();
    ctx.fillStyle = dark ? '#2a2a2d' : '#d4d4d9';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = dark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.1)';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, G * 0.645, 0, TAU);
    ctx.fillStyle = dark ? '#000000' : '#ffffff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, G * 0.575, 0, TAU);
    ctx.fillStyle = dark ? '#1c1c1e' : '#ececf0';
    ctx.fill();
    // Monitor con “< >”
    ctx.strokeStyle = dark ? '#a1a1a6' : '#6e6e73';
    ctx.lineWidth = Math.max(1.5, G * 0.05);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const w = G * 0.62;
    const h = G * 0.42;
    const top = -G * 0.28;
    const rr = G * 0.08;
    ctx.beginPath();
    ctx.moveTo(-w / 2 + rr, top);
    ctx.arcTo(w / 2, top, w / 2, top + h, rr);
    ctx.arcTo(w / 2, top + h, -w / 2, top + h, rr);
    ctx.arcTo(-w / 2, top + h, -w / 2, top, rr);
    ctx.arcTo(-w / 2, top, w / 2, top, rr);
    ctx.closePath();
    ctx.moveTo(0, top + h);
    ctx.lineTo(0, G * 0.3);
    ctx.moveTo(-G * 0.13, G * 0.31);
    ctx.lineTo(G * 0.13, G * 0.31);
    ctx.moveTo(-G * 0.09, -G * 0.16);
    ctx.lineTo(-G * 0.18, -G * 0.07);
    ctx.lineTo(-G * 0.09, G * 0.02);
    ctx.moveTo(G * 0.09, -G * 0.16);
    ctx.lineTo(G * 0.18, -G * 0.07);
    ctx.lineTo(G * 0.09, G * 0.02);
    ctx.stroke();
    ctx.restore();
  }

  function draw(e) {
    const dark = isDark();
    const ink = dark ? '245,245,247' : '29,29,31';
    const accent = dark ? '41,151,255' : '0,102,204';
    const fade = ease(e);
    const grow = e <= 0 ? 0 : back(e);
    sy = Math.sin(yaw);
    cy = Math.cos(yaw);
    se = Math.sin(elev);
    ce = Math.cos(elev);
    const ox = W / 2;
    const oy = H / 2;
    ctx.clearRect(0, 0, W, H);

    const rings = (front) => {
      RINGS.forEach((ring, i) => {
        const r = ring.r * R * grow;
        if (r < 1) return;
        const hot = focus === i;
        ctx.lineWidth = hot ? 1.4 : 1;
        let prev = project(r, 0, ring.incl);
        for (let j = 1; j <= SEG; j++) {
          const p = project(r, (j / SEG) * TAU, ring.incl);
          const d = (prev[2] + p[2]) / 2;
          if (d > 0 === front) {
            const depth = 0.5 + 0.5 * clamp(d / R, -1, 1);
            ctx.strokeStyle = `rgba(${hot ? accent : ink},${((hot ? 0.55 : 0.2) * (0.35 + 0.65 * depth) * fade).toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(ox + prev[0], oy + prev[1]);
            ctx.lineTo(ox + p[0], oy + p[1]);
            ctx.stroke();
          }
          prev = p;
        }
      });
    };

    rings(false);
    // El engrane late una vez al soltar las herramientas y luego gira despacio.
    drawGear(ox, oy, R * 0.2 * (1 + 0.14 * Math.sin(Math.PI * clamp(e * 1.4, 0, 1))), clock * 0.25 + (1 - fade) * 5, dark);
    rings(true);

    const swirl = (1 - fade) * -2.2;
    for (const it of items) {
      const ring = RINGS[it.ring];
      const p = project(ring.r * R * grow, it.phase + clock * ring.speed + swirl * (1 + it.ring * 0.25), ring.incl);
      const depth = 0.5 + 0.5 * clamp(p[2] / R, -1, 1);
      const hot = hovered === it;
      const dim = focus !== null && focus !== it.ring && !hot;
      const s = it.el.style;
      s.transform = `translate(-50%,-50%) translate(${p[0].toFixed(1)}px,${p[1].toFixed(1)}px) scale(${((0.84 + 0.24 * depth) * (hot ? 1.12 : 1)).toFixed(3)})`;
      s.opacity = (fade * (hot ? 1 : (0.38 + 0.62 * depth) * (dim ? 0.7 : 1))).toFixed(3);
      // Las etiquetas del lado lejano van bajo el lienzo: el engrane las tapa al pasar por detrás.
      s.zIndex = hot ? '5' : p[2] > 0 ? '3' : '1';
    }
  }

  function frame(now) {
    raf = 0;
    if (!alive) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const target = reducedMotion || dragging || hovered ? 0 : 1;
    spin += (target - spin) * Math.min(1, dt * 5);
    clock += dt * spin;
    if (!dragging) {
      yaw += velYaw * dt;
      velYaw *= Math.pow(0.04, dt);
    }
    draw(seenAt < 0 ? 0 : reducedMotion ? 1 : clamp((now - seenAt) / 1500, 0, 1));
    if (inView) raf = requestAnimationFrame(frame);
  }

  const kick = () => {
    if (alive && !raf) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  };

  const itemOf = (ev) => {
    const el = ev.target instanceof Element ? ev.target.closest('[data-tool]') : null;
    return el ? items.find((it) => it.el === el) || null : null;
  };
  const setHover = (it) => {
    if (hovered === it) return;
    const prev = hovered;
    hovered = it;
    if (prev) paintItem(prev);
    if (it) paintItem(it);
    kick();
  };
  const onOver = (ev) => {
    if (!dragging) setHover(itemOf(ev));
  };
  const onLeave = () => setHover(null);
  const onDown = (ev) => {
    if (ev.button) return;
    dragging = true;
    lastX = ev.clientX;
    lastY = ev.clientY;
    velYaw = 0;
    stage.setPointerCapture(ev.pointerId);
    stage.style.cursor = 'grabbing';
  };
  const onMove = (ev) => {
    if (!dragging) return;
    const dx = ev.clientX - lastX;
    const dy = ev.clientY - lastY;
    lastX = ev.clientX;
    lastY = ev.clientY;
    yaw += dx * 0.006;
    velYaw = dx * 0.2;
    elev = clamp(elev + dy * 0.004, 0.16, 1.05);
    kick();
  };
  const onUp = () => {
    dragging = false;
    stage.style.cursor = 'grab';
  };
  const onPick = (ev) => {
    const btn = ev.target instanceof Element ? ev.target.closest('[data-ring-btn]') : null;
    if (!btn) return;
    const i = Number(btn.dataset.ringBtn);
    userPicked = true;
    focus = focus === i && !narrow ? null : i;
    paintFocus();
    kick();
  };

  stage.addEventListener('pointerover', onOver);
  stage.addEventListener('pointerleave', onLeave);
  stage.addEventListener('pointerdown', onDown);
  stage.addEventListener('pointermove', onMove);
  stage.addEventListener('pointerup', onUp);
  stage.addEventListener('pointercancel', onUp);
  root.addEventListener('click', onPick);

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        inView = entry.isIntersecting;
        if (seenAt < 0 && entry.intersectionRatio >= 0.3) seenAt = performance.now();
        if (inView) kick();
      }
    },
    { threshold: [0, 0.3] },
  );
  io.observe(stage);
  const ro = new ResizeObserver(() => {
    measure();
    kick();
  });
  ro.observe(stage);

  measure();
  paintFocus();
  kick();

  return {
    refresh() {
      measure();
      kick();
    },
    destroy() {
      alive = false;
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      stage.removeEventListener('pointerover', onOver);
      stage.removeEventListener('pointerleave', onLeave);
      stage.removeEventListener('pointerdown', onDown);
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerup', onUp);
      stage.removeEventListener('pointercancel', onUp);
      root.removeEventListener('click', onPick);
    },
  };
}
