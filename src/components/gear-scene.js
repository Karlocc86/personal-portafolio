/**
 * Engrane 3D del hero: WebGL puro, sin dependencias.
 * Geometría fiel al icono (1200×1200, centro 600,600): engrane de 8 dientes trapezoidales
 * con esquinas redondeadas, ranura circular, disco interior y monitor con “< >” en relieve.
 * Material casi negro y satinado: lo dibujan un filo de contraluz que recorre los biseles y
 * un brillo suave arriba a la izquierda; la parte baja se funde con el fondo.
 * Entrada: emerge de la oscuridad y gira hasta quedar de frente. Scroll: se acerca a la cámara.
 * Lo usan HeroGear.tsx (Next.js) y la vista previa de diseño.
 */

const FOV = (30 * Math.PI) / 180;
const DIST = 9;
const U = 525;
const PALETTE = {
  dark: { bg: [0, 0, 0], body: [0.075, 0.075, 0.08], disc: [0.05, 0.05, 0.055], mark: [0.1, 0.1, 0.108], amb: 0.55, key: 0.5, sheen: 0.09, edge: 1.35, alpha: 1 },
  light: { bg: [1, 1, 1], body: [0.9, 0.9, 0.915], disc: [0.86, 0.86, 0.88], mark: [0.8, 0.8, 0.82], amb: 0.8, key: 0.25, sheen: 0.12, edge: 0.25, alpha: 0.75 },
};

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const lerp = (a, b, t) => a + (b - a) * t;
const px = (v) => v / U;
const pt = (x, y) => [(x - 600) / U, (600 - y) / U];

/* ---------- Contornos 2D ---------- */

/** Polígono cerrado con radio de redondeo por vértice → polilínea. */
function filleted(verts, seg = 10) {
  const out = [];
  const n = verts.length;
  for (let i = 0; i < n; i++) {
    const P = verts[i];
    if (!P.r) {
      out.push([P.x, P.y]);
      continue;
    }
    const A = verts[(i + n - 1) % n];
    const B = verts[(i + 1) % n];
    let u1 = [A.x - P.x, A.y - P.y];
    let u2 = [B.x - P.x, B.y - P.y];
    const l1 = Math.hypot(u1[0], u1[1]);
    const l2 = Math.hypot(u2[0], u2[1]);
    u1 = [u1[0] / l1, u1[1] / l1];
    u2 = [u2[0] / l2, u2[1] / l2];
    const half = Math.acos(Math.max(-1, Math.min(1, u1[0] * u2[0] + u1[1] * u2[1]))) / 2;
    const t = Math.min(P.r / Math.tan(half), 0.45 * Math.min(l1, l2));
    const r = t * Math.tan(half);
    let bis = [u1[0] + u2[0], u1[1] + u2[1]];
    const bl = Math.hypot(bis[0], bis[1]) || 1;
    bis = [bis[0] / bl, bis[1] / bl];
    const C = [P.x + (bis[0] * r) / Math.sin(half), P.y + (bis[1] * r) / Math.sin(half)];
    const a1 = Math.atan2(P.y + u1[1] * t - C[1], P.x + u1[0] * t - C[0]);
    const a2 = Math.atan2(P.y + u2[1] * t - C[1], P.x + u2[0] * t - C[0]);
    let d = a2 - a1;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    for (let j = 0; j <= seg; j++) {
      const a = a1 + (d * j) / seg;
      out.push([C[0] + r * Math.cos(a), C[1] + r * Math.sin(a)]);
    }
  }
  return out;
}

/** Remuestrea una forma estrellada respecto al origen en N ángulos uniformes (rayo ∩ polilínea). */
function polarFromPolyline(poly, N) {
  const pts = [];
  for (let i = 0; i < N; i++) {
    const th = (i / N) * Math.PI * 2;
    const dx = Math.cos(th);
    const dy = Math.sin(th);
    let best = 0;
    for (let j = 0; j < poly.length; j++) {
      const P = poly[j];
      const Q = poly[(j + 1) % poly.length];
      const ex = Q[0] - P[0];
      const ey = Q[1] - P[1];
      const den = dx * ey - dy * ex;
      if (Math.abs(den) < 1e-12) continue;
      const t = (P[0] * ey - P[1] * ex) / den;
      const s = (P[0] * dy - P[1] * dx) / den;
      if (t > 0 && s >= -1e-6 && s <= 1 + 1e-6 && t > best) best = t;
    }
    pts.push([best * dx, best * dy]);
  }
  return pts;
}

/** Igual, para un SDF 2D (negativo dentro), por bisección. */
function polarFromSdf(sdf, N) {
  const pts = [];
  for (let i = 0; i < N; i++) {
    const th = (i / N) * Math.PI * 2;
    const dx = Math.cos(th);
    const dy = Math.sin(th);
    let lo = 0;
    let hi = 2;
    for (let k = 0; k < 32; k++) {
      const m = (lo + hi) / 2;
      if (sdf(m * dx, m * dy) < 0) lo = m;
      else hi = m;
    }
    pts.push([lo * dx, lo * dy]);
  }
  return pts;
}

const circle = (r, N) => polarFromSdf((x, y) => Math.hypot(x, y) - r, N);

function roundedBox(hx, hy, r) {
  return (x, y) => {
    const qx = Math.abs(x) - (hx - r);
    const qy = Math.abs(y) - (hy - r);
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
  };
}

function gearOutline() {
  const Rr = px(450);
  const Rt = px(525);
  const wb = px(128);
  const wt = px(75);
  const hb = Math.sqrt(Rr * Rr - wb * wb);
  const beta = Math.atan2(wb, hb);
  const verts = [];
  for (let k = 0; k < 8; k++) {
    const phi = (k * Math.PI) / 4;
    const c = Math.cos(phi);
    const s = Math.sin(phi);
    const at = (rad, tan) => ({ x: c * rad - s * tan, y: s * rad + c * tan });
    verts.push({ ...at(hb, -wb), r: px(16) });
    verts.push({ ...at(Rt, -wt), r: px(34) });
    verts.push({ ...at(Rt, wt), r: px(34) });
    verts.push({ ...at(hb, wb), r: px(16) });
    const a0 = phi + beta;
    const a1 = phi + Math.PI / 4 - beta;
    for (let j = 1; j < 12; j++) {
      const a = a0 + ((a1 - a0) * j) / 12;
      verts.push({ x: Rr * Math.cos(a), y: Rr * Math.sin(a), r: 0 });
    }
  }
  return filleted(verts, 10);
}

function capsule(p, q, r, seg) {
  const a = Math.atan2(q[1] - p[1], q[0] - p[0]);
  const pts = [];
  for (let i = 0; i <= seg; i++) {
    const t = a - Math.PI / 2 + (i / seg) * Math.PI;
    pts.push([q[0] + r * Math.cos(t), q[1] + r * Math.sin(t)]);
  }
  for (let i = 0; i <= seg; i++) {
    const t = a + Math.PI / 2 + (i / seg) * Math.PI;
    pts.push([p[0] + r * Math.cos(t), p[1] + r * Math.sin(t)]);
  }
  return pts;
}

/** Normal 2D que apunta fuera del material (hacia el hueco si `hole`). */
function contour(pts, hole) {
  const n = pts.length;
  return pts.map((p, i) => {
    const a = pts[(i + n - 1) % n];
    const b = pts[(i + 1) % n];
    let nx = b[1] - a[1];
    let ny = a[0] - b[0];
    const len = Math.hypot(nx, ny) || 1;
    nx /= len;
    ny /= len;
    if (hole) {
      nx = -nx;
      ny = -ny;
    }
    return { x: p[0], y: p[1], nx, ny };
  });
}

/* ---------- Extrusión con bisel redondeado ---------- */

function rings(c, zf, zb, bevel, steps) {
  const ring = (phi, front) => {
    const s = Math.sin(phi);
    const k = Math.cos(phi);
    const inset = bevel * (1 - s);
    const z = front ? zf - bevel + bevel * k : zb + bevel - bevel * k;
    return c.map((p) => ({ x: p.x - p.nx * inset, y: p.y - p.ny * inset, z, nx: p.nx * s, ny: p.ny * s, nz: front ? k : -k }));
  };
  const out = [];
  for (let i = 0; i <= steps; i++) out.push(ring((i / steps) * (Math.PI / 2), true));
  for (let i = steps; i >= 0; i--) out.push(ring((i / steps) * (Math.PI / 2), false));
  return out;
}

function mesh() {
  const pos = [];
  const nor = [];
  const put = (v) => {
    pos.push(v.x, v.y, v.z);
    nor.push(v.nx, v.ny, v.nz);
  };
  return {
    pos,
    nor,
    tri(a, b, c) {
      put(a);
      put(b);
      put(c);
    },
  };
}

function walls(m, rs) {
  for (let r = 0; r < rs.length - 1; r++) {
    const A = rs[r];
    const B = rs[r + 1];
    for (let i = 0; i < A.length; i++) {
      const j = (i + 1) % A.length;
      m.tri(A[i], B[i], B[j]);
      m.tri(A[i], B[j], A[j]);
    }
  }
}

function annulus(m, outer, inner) {
  const pairs = [
    [outer[0], inner[0]],
    [outer[outer.length - 1], inner[inner.length - 1]],
  ];
  for (const [o, h] of pairs) {
    for (let i = 0; i < o.length; i++) {
      const j = (i + 1) % o.length;
      m.tri(o[i], h[i], h[j]);
      m.tri(o[i], h[j], o[j]);
    }
  }
}

function fan(m, rs) {
  for (const ring of [rs[0], rs[rs.length - 1]]) {
    let cx = 0;
    let cy = 0;
    for (const p of ring) {
      cx += p.x;
      cy += p.y;
    }
    const c = { x: cx / ring.length, y: cy / ring.length, z: ring[0].z, nx: 0, ny: 0, nz: ring[0].nz };
    for (let i = 0; i < ring.length; i++) m.tri(c, ring[i], ring[(i + 1) % ring.length]);
  }
}

function buildModel() {
  const body = mesh();
  const disc = mesh();
  const mark = mesh();

  const N = 1080;
  const outer = rings(contour(polarFromPolyline(gearOutline(), N), false), 0.11, -0.11, 0.05, 6);
  const hole = rings(contour(circle(px(338), N), true), 0.11, -0.11, 0.04, 6);
  walls(body, outer);
  walls(body, hole);
  annulus(body, outer, hole);

  const d = rings(contour(circle(px(300), 360), false), 0.085, -0.085, 0.035, 5);
  walls(disc, d);
  fan(disc, d);

  const zf = 0.12;
  const zb = 0.07;
  const bv = 0.016;
  const M = 480;
  const fo = rings(contour(polarFromSdf(roundedBox(px(225), px(149), px(75)), M), false), zf, zb, bv, 3);
  const fi = rings(contour(polarFromSdf(roundedBox(px(188), px(112), px(38)), M), true), zf, zb, bv, 3);
  walls(mark, fo);
  walls(mark, fi);
  annulus(mark, fo, fi);

  const strokes = [
    [pt(600, 748), pt(600, 790)],
    [pt(544, 806), pt(656, 806)],
    [pt(543, 542), pt(475, 593)],
    [pt(475, 607), pt(543, 658)],
    [pt(657, 542), pt(725, 593)],
    [pt(725, 607), pt(657, 658)],
  ];
  for (const [p, q] of strokes) {
    const r = rings(contour(capsule(p, q, px(19), 16), false), zf, zb, bv, 3);
    walls(mark, r);
    fan(mark, r);
  }
  return { body, disc, mark };
}

/* ---------- Matrices 4×4 (column-major) ---------- */

const identity = () => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

function mul(a, b) {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
      o[c * 4 + r] = s;
    }
  }
  return o;
}

function rot(axis, t) {
  const m = identity();
  const c = Math.cos(t);
  const s = Math.sin(t);
  if (axis === 'x') {
    m[5] = c; m[6] = s; m[9] = -s; m[10] = c;
  } else if (axis === 'y') {
    m[0] = c; m[2] = -s; m[8] = s; m[10] = c;
  } else {
    m[0] = c; m[1] = s; m[4] = -s; m[5] = c;
  }
  return m;
}

function perspective(fovy, aspect, near, far) {
  const f = 1 / Math.tan(fovy / 2);
  const m = new Float32Array(16);
  m[0] = f / aspect;
  m[5] = f;
  m[10] = (far + near) / (near - far);
  m[11] = -1;
  m[14] = (2 * far * near) / (near - far);
  return m;
}

function modelMatrix(R, s, y) {
  const m = new Float32Array(R);
  for (const i of [0, 1, 2, 4, 5, 6, 8, 9, 10]) m[i] *= s;
  m[13] = y;
  return m;
}

const normal3 = (m) => new Float32Array([m[0], m[1], m[2], m[4], m[5], m[6], m[8], m[9], m[10]]);

const VS = `attribute vec3 aPos;attribute vec3 aNor;uniform mat4 uProj;uniform mat4 uModel;uniform mat3 uNorm;varying vec3 vN;varying vec3 vP;
void main(){vec4 w=uModel*vec4(aPos,1.0);vP=w.xyz;vN=uNorm*aNor;gl_Position=uProj*vec4(w.x,w.y,w.z-${DIST.toFixed(1)},1.0);}`;

// uRim: contraluz (detrás, arriba-izquierda) → filo fino en los biseles.
// uKeyPos: luz puntual frontal → brillo satinado con degradado sobre las caras planas.
// uFrame: (centro y, radio) del objeto → la parte baja se funde con el fondo.
const FS = `precision mediump float;varying vec3 vN;varying vec3 vP;
uniform vec3 uColor;uniform vec3 uBg;uniform vec3 uRim;uniform vec3 uKeyPos;uniform vec2 uFrame;
uniform float uAmb;uniform float uKey;uniform float uSheen;uniform float uEdge;
void main(){
vec3 n=normalize(vN);
vec3 v=normalize(vec3(0.0,0.0,${DIST.toFixed(1)})-vP);
float facing=1.0-clamp(dot(n,v),0.0,1.0);
float hemi=mix(0.3,1.0,n.y*0.5+0.5);
vec3 lk=normalize(uKeyPos-vP);
float d=max(dot(n,lk),0.0);
float sh=pow(max(dot(n,normalize(lk+v)),0.0),10.0)*uSheen;
float rim=pow(max(dot(n,normalize(uRim)),0.0),2.0)*pow(facing,1.3)*uEdge;
float rel=(vP.y-uFrame.x)/uFrame.y;
float fade=smoothstep(-1.15,0.55,rel);
vec3 col=uColor*(uAmb*hemi+d*uKey)+vec3(sh);
col=mix(uBg,col,fade)+vec3(rim)*mix(0.25,1.0,fade);
gl_FragColor=vec4(col,1.0);}`;

/**
 * Monta la escena en `canvas` (posición absoluta dentro de `section`, el hero).
 * Devuelve { refresh, destroy } o null si no hay WebGL.
 */
export function mountGear({ canvas, section, isDark, reducedMotion = false }) {
  let gl = null;
  try {
    gl = canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: true, powerPreference: 'low-power' });
  } catch {
    gl = null;
  }
  if (!gl) return null;

  let prog;
  try {
    const compile = (type, src) => {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) || 'shader');
      return sh;
    };
    prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  } catch {
    return null;
  }
  gl.useProgram(prog);

  const aPos = gl.getAttribLocation(prog, 'aPos');
  const aNor = gl.getAttribLocation(prog, 'aNor');
  gl.enableVertexAttribArray(aPos);
  gl.enableVertexAttribArray(aNor);
  const u = {};
  for (const name of ['uProj', 'uModel', 'uNorm', 'uColor', 'uBg', 'uRim', 'uKeyPos', 'uFrame', 'uAmb', 'uKey', 'uSheen', 'uEdge']) {
    u[name] = gl.getUniformLocation(prog, name);
  }

  const upload = (m) => {
    const buffer = (data) => {
      const b = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
      return b;
    };
    return { pos: buffer(m.pos), nor: buffer(m.nor), count: m.pos.length / 3 };
  };
  const geo = buildModel();
  const meshes = { body: upload(geo.body), disc: upload(geo.disc), mark: upload(geo.mark) };

  gl.enable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);
  gl.clearColor(0, 0, 0, 0);

  let W = 1;
  let H = 1;
  let raf = 0;
  let alive = true;
  const t0 = performance.now();

  function measure() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(canvas.clientWidth, 1);
    H = Math.max(canvas.clientHeight, 1);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function progress() {
    if (reducedMotion) return 0;
    return clamp01(-section.getBoundingClientRect().top / Math.max(section.offsetHeight, 1));
  }

  function visible() {
    const r = section.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight;
  }

  function draw(m, R, s, y, color) {
    gl.bindBuffer(gl.ARRAY_BUFFER, m.pos);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, m.nor);
    gl.vertexAttribPointer(aNor, 3, gl.FLOAT, false, 0, 0);
    gl.uniformMatrix4fv(u.uModel, false, modelMatrix(R, s, y));
    gl.uniformMatrix3fv(u.uNorm, false, normal3(R));
    gl.uniform3fv(u.uColor, color);
    gl.drawArrays(gl.TRIANGLES, 0, m.count);
  }

  function render(time) {
    const pal = isDark() ? PALETTE.dark : PALETTE.light;
    const p = progress();
    const e = smooth(p);

    // Entrada: emerge de la oscuridad, algo inclinado y lejos, y gira hasta quedar de frente.
    const ti = reducedMotion ? 99 : (performance.now() - t0) / 1000;
    const k = easeOut(clamp01((ti - 0.1) / 3.2));
    const fade = smooth(clamp01(ti / 2));
    const idle = reducedMotion ? 0 : 1;

    // Scroll: se acerca a la cámara (crece y se inclina hacia el frente) y sube más lento que el texto.
    const halfH = DIST * Math.tan(FOV / 2);
    const wpp = (2 * halfH) / H;
    const base = halfH * Math.min(0.52, 0.8 * (W / H));
    const s = base * lerp(0.86, 1, k) * lerp(1, 1.75, e);
    const centerPx = H * 0.3 + e * H * 0.38;
    const y = (H / 2 - centerPx) * wpp + Math.sin(time * 0.7) * 0.01 * base * idle;

    const R = mul(
      rot('x', lerp(-0.5, -0.16, k) + e * 0.22 + Math.sin(time * 0.17) * 0.03 * idle),
      rot('y', lerp(0.42, 0.08, k) + Math.sin(time * 0.22) * 0.09 * idle),
    );

    // La contraluz barre los bordes durante la entrada y luego oscila despacio.
    const ang = (lerp(205, 128, k) + Math.sin(time * 0.26) * 16 * idle) * (Math.PI / 180);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(u.uProj, false, perspective(FOV, W / H, 0.1, 50));
    gl.uniform3fv(u.uBg, pal.bg);
    gl.uniform3f(u.uRim, Math.cos(ang), Math.sin(ang), -0.35);
    gl.uniform3f(u.uKeyPos, -2.4 * s, y + 2.6 * s, 3.2 * s);
    gl.uniform2f(u.uFrame, y, s);
    gl.uniform1f(u.uAmb, pal.amb);
    gl.uniform1f(u.uKey, pal.key);
    gl.uniform1f(u.uSheen, pal.sheen);
    gl.uniform1f(u.uEdge, pal.edge);
    draw(meshes.body, R, s, y, pal.body);
    draw(meshes.disc, R, s, y, pal.disc);
    draw(meshes.mark, R, s, y, pal.mark);

    canvas.style.opacity = String(pal.alpha * fade * (1 - 0.35 * e));
  }

  function frame(now) {
    raf = 0;
    if (!alive) return;
    if (visible()) render(reducedMotion ? 0 : now / 1000);
    if (!reducedMotion && visible() && !document.hidden) raf = requestAnimationFrame(frame);
  }

  const kick = () => {
    if (alive && !raf) raf = requestAnimationFrame(frame);
  };
  const onResize = () => {
    measure();
    kick();
  };

  measure();
  kick();
  window.addEventListener('scroll', kick, { passive: true });
  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', kick);

  return {
    refresh() {
      measure();
      kick();
    },
    destroy() {
      alive = false;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', kick);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', kick);
      const lose = gl.getExtension('WEBGL_lose_context');
      if (lose) lose.loseContext();
    },
  };
}
