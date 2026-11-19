/**
 * Mapa 3D de México narrado con el scroll (sección de 700svh con escenario sticky). WebGL puro; única
 * dependencia: earcut (triangulación).
 *
 * - Datos (/geo/mexico-states.json, v2): México es una placa (tapa por estado, muros en costa y
 *   fronteras internacionales); los vecinos quedan al nivel del mar.
 * - Entrada: el remolino del engrane termina en negro y desde ahí nace México, estado por estado, con un
 *   rebote (solo México: los países vecinos no se dibujan).
 * - Recorrido (tramos en CHAPTERS): México completo → acercamiento a Todos Santos y Baja California Sur
 *   se alza → un avión vuela a Guadalajara y deja la ruta punteada → Jalisco se alza → vuelta al mapa
 *   completo. Al final, el cursor muestra el nombre de cada estado y un clic lo alza.
 */
import earcut from './earcut.js';

const DEG = Math.PI / 180;
const FOV = 30 * DEG;
/** Grosor de la placa de México (mundo; el ancho del país = 2). */
const SLAB = 0.012;
/** Altura a la que se alza un estado. */
const RAISE = 0.05;
const OVER_TILT = 0.95;
const SUN = norm3([-0.42, -0.58, 0.7]);
const PLANE_SIZE = 0.028;
const FLIGHT_ALT = 0.08;
const ROUTE_DASHES = 64;
/** Progreso del tramo fijo en que termina el portal del engrane (1.62 pantallas de las 6 del tramo). */
const PORTAL = 0.105;

/** Guion compartido por la escena y la página: tramos [inicio, fin] del progreso 0–1 del tramo fijo. */
export const CHAPTERS = {
  captions: [[0.13, 0.26], [0.33, 0.47], [0.53, 0.78], [0.85, 1.01]],
  segments: [[PORTAL, 0.28], [0.28, 0.5], [0.5, 0.8], [0.8, 1]],
  raise: { origin: 0.3, school: 0.6 },
  scrim: [0.32, 0.78],
};

const TONES = {
  dark: {
    bg: [0, 0, 0], top: [0.125, 0.125, 0.135], lit: [0.24, 0.24, 0.255], hover: [0.18, 0.18, 0.195], wall: [0.08, 0.08, 0.085], side: [0.15, 0.15, 0.16],
    nb: [0.05, 0.05, 0.055], border: [0.3, 0.3, 0.32, 0.9], coast: [0.42, 0.42, 0.45, 1], ink: [0.96, 0.96, 0.97],
    plane: [0.93, 0.93, 0.94], planeAccent: [0.42, 0.42, 0.45], amb: 0.52, key: 0.8, planeShadow: 0.45,
  },
  light: {
    bg: [1, 1, 1], top: [0.925, 0.925, 0.935], lit: [0.84, 0.84, 0.855], hover: [0.88, 0.88, 0.895], wall: [0.76, 0.76, 0.78], side: [0.7, 0.7, 0.72],
    nb: [0.955, 0.955, 0.96], border: [0.68, 0.68, 0.71, 0.9], coast: [0.5, 0.5, 0.53, 1], ink: [0.11, 0.11, 0.12],
    plane: [0.28, 0.28, 0.3], planeAccent: [0.6, 0.6, 0.62], amb: 0.66, key: 0.45, planeShadow: 0.16,
  },
};

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a, b, t) => a + (b - a) * t;
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const hash = (a, b = 0) => {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
function norm3(v) {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** Curva cúbica de Bézier (como en CSS), para el ease-out de llegada. */
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = (t) => ((ax * t + bx) * t + cx) * t;
  const dX = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const e = X(t) - x;
      const d = dX(t);
      if (Math.abs(e) < 1e-5 || Math.abs(d) < 1e-6) break;
      t = Math.min(1, Math.max(0, t - e / d));
    }
    return ((ay * t + by) * t + cy) * t;
  };
}
const EASE = bezier(0.33, 0, 0.15, 1);
const EASE_IO = bezier(0.45, 0, 0.25, 1);

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

function translation(x, y, z) {
  const m = identity();
  m[12] = x; m[13] = y; m[14] = z;
  return m;
}

function scaling(x, y, z) {
  const m = identity();
  m[0] = x; m[5] = y; m[10] = z;
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

function ortho(l, r, b, t, n, f) {
  const m = identity();
  m[0] = 2 / (r - l); m[5] = 2 / (t - b); m[10] = -2 / (f - n);
  m[12] = -(r + l) / (r - l); m[13] = -(t + b) / (t - b); m[14] = -(f + n) / (f - n);
  return m;
}

function lookAt(eye, at, up) {
  const z = norm3(sub3(eye, at));
  const x = norm3(cross3(up, z));
  const y = cross3(z, x);
  return new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot3(x, eye), -dot3(y, eye), -dot3(z, eye), 1]);
}

const transform = (m, x, y, z) => [
  m[0] * x + m[4] * y + m[8] * z + m[12],
  m[1] * x + m[5] * y + m[9] * z + m[13],
  m[2] * x + m[6] * y + m[10] * z + m[14],
  m[3] * x + m[7] * y + m[11] * z + m[15],
];

const rot3 = (m) => new Float32Array([m[0], m[1], m[2], m[4], m[5], m[6], m[8], m[9], m[10]]);

/* ---------- Avión low-poly (nariz hacia +x, ~1.15 de largo) ---------- */

function solid() {
  const pos = [];
  const nor = [];
  const tri = (a, b, c) => {
    const n = norm3(cross3(sub3(b, a), sub3(c, a)));
    pos.push(...a, ...b, ...c);
    for (let i = 0; i < 3; i++) nor.push(n[0], n[1], n[2]);
  };
  const quad = (a, b, c, d) => {
    tri(a, b, c);
    tri(a, c, d);
  };
  const box = (x0, y0, z0, x1, y1, z1) => {
    quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]);
    quad([x0, y1, z0], [x1, y1, z0], [x1, y0, z0], [x0, y0, z0]);
    quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]);
    quad([x1, y1, z0], [x0, y1, z0], [x0, y1, z1], [x1, y1, z1]);
    quad([x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]);
    quad([x0, y1, z0], [x0, y0, z0], [x0, y0, z1], [x0, y1, z1]);
  };
  const slab = (pts, z0, z1, map = (p) => p) => {
    const a = pts.map(([x, y]) => map([x, y, z0]));
    const b = pts.map(([x, y]) => map([x, y, z1]));
    for (let i = 1; i < pts.length - 1; i++) {
      tri(b[0], b[i], b[i + 1]);
      tri(a[0], a[i + 1], a[i]);
    }
    for (let i = 0; i < pts.length; i++) {
      const j = (i + 1) % pts.length;
      quad(a[i], a[j], b[j], b[i]);
    }
  };
  return { pos, nor, quad, box, slab };
}

function buildPlane() {
  const body = solid();
  const N = 10;
  const stations = [[-0.56, 0.012, 0.035], [-0.4, 0.05, 0.015], [-0.15, 0.075, 0], [0.28, 0.075, 0], [0.44, 0.06, -0.004], [0.53, 0.03, -0.012], [0.57, 0.006, -0.016]];
  const ringAt = ([x, r, z]) => Array.from({ length: N }, (_, i) => {
    const a = (i / N) * Math.PI * 2;
    return [x, r * Math.cos(a), z + r * Math.sin(a)];
  });
  for (let i = 0; i < stations.length - 1; i++) {
    const A = ringAt(stations[i]);
    const B = ringAt(stations[i + 1]);
    for (let j = 0; j < N; j++) {
      const k = (j + 1) % N;
      body.quad(A[j], A[k], B[k], B[j]);
    }
  }
  body.slab([[0.12, 0.06], [-0.1, 0.56], [-0.2, 0.56], [-0.1, 0.06]], -0.03, -0.012);
  body.slab([[0.12, -0.06], [-0.1, -0.06], [-0.2, -0.56], [-0.1, -0.56]], -0.03, -0.012);
  body.slab([[-0.4, 0.03], [-0.5, 0.2], [-0.55, 0.2], [-0.5, 0.03]], 0.02, 0.034);
  body.slab([[-0.4, -0.03], [-0.5, -0.03], [-0.55, -0.2], [-0.5, -0.2]], 0.02, 0.034);
  const accent = solid();
  accent.slab([[-0.34, 0.05], [-0.5, 0.3], [-0.57, 0.3], [-0.53, 0.05]], -0.012, 0.012, ([x, h, z]) => [x, -z, h]);
  accent.box(-0.02, 0.2, -0.085, 0.14, 0.27, -0.03);
  accent.box(-0.02, -0.27, -0.085, 0.14, -0.2, -0.03);
  return { body, accent };
}

/* ---------- Geometría del mapa ---------- */

const decode = (enc) => {
  const out = new Array(enc.length);
  let x = 0;
  let y = 0;
  for (let i = 0; i < enc.length; i += 2) {
    x += enc[i];
    y += enc[i + 1];
    out[i] = x;
    out[i + 1] = y;
  }
  return out;
};

function buildMap(data) {
  const q = data.q;
  const surf = [];
  const snor = [];
  const edges = new Map();
  const states = data.states.map((s) => {
    const topStart = surf.length / 3;
    const tris = [];
    const box = [Infinity, Infinity, -Infinity, -Infinity];
    for (const poly of s.p) {
      const flat = [];
      const holes = [];
      poly.forEach((enc, ri) => {
        const r = decode(enc);
        const n = r.length / 2;
        if (ri) holes.push(flat.length / 2);
        let a2 = 0;
        for (let i = 0; i < n; i++) {
          const j = (i + 1) % n;
          a2 += r[i * 2] * r[j * 2 + 1] - r[j * 2] * r[i * 2 + 1];
        }
        const solidLeft = ri === 0 ? a2 > 0 : a2 < 0;
        for (let i = 0; i < n; i++) {
          const j = (i + 1) % n;
          const ax = r[i * 2], ay = r[i * 2 + 1], bx = r[j * 2], by = r[j * 2 + 1];
          flat.push(ax, ay);
          // Una arista que aparece en un solo estado es costa o frontera internacional (lleva muro).
          const key = ax < bx || (ax === bx && ay < by) ? `${ax},${ay},${bx},${by}` : `${bx},${by},${ax},${ay}`;
          const e = edges.get(key);
          if (e) {
            e.n++;
            continue;
          }
          let nx = by - ay;
          let ny = ax - bx;
          if (!solidLeft) {
            nx = -nx;
            ny = -ny;
          }
          const L = Math.hypot(nx, ny) || 1;
          edges.set(key, { n: 1, ax: ax / q, ay: ay / q, bx: bx / q, by: by / q, nx: nx / L, ny: ny / L });
        }
      });
      const idx = earcut(flat, holes);
      for (let k = 0; k < idx.length; k++) {
        const x = flat[idx[k] * 2] / q;
        const y = flat[idx[k] * 2 + 1] / q;
        surf.push(x, y, SLAB);
        snor.push(0, 0, 1);
        tris.push(x, y);
        if (x < box[0]) box[0] = x;
        if (y < box[1]) box[1] = y;
        if (x > box[2]) box[2] = x;
        if (y > box[3]) box[3] = y;
      }
    }
    return { id: s.id, name: s.name, anchor: [s.c[0] / q, s.c[1] / q], topStart, topCount: surf.length / 3 - topStart, tris: new Float32Array(tris), box, src: s };
  });

  const zl = SLAB + 0.0004;
  const wallStart = surf.length / 3;
  const coast = [];
  const border = [];
  for (const e of edges.values()) {
    if (e.n > 1) {
      border.push(e.ax, e.ay, zl, e.bx, e.by, zl);
      continue;
    }
    surf.push(e.ax, e.ay, 0, e.bx, e.by, 0, e.bx, e.by, SLAB, e.ax, e.ay, 0, e.bx, e.by, SLAB, e.ax, e.ay, SLAB);
    for (let k = 0; k < 6; k++) snor.push(e.nx, e.ny, 0);
    coast.push(e.ax, e.ay, zl, e.bx, e.by, zl);
  }
  const wall = [wallStart, surf.length / 3 - wallStart];

  const landStart = surf.length / 3;
  for (const poly of data.land || []) {
    const flat = [];
    const holes = [];
    poly.forEach((enc, ri) => {
      const r = decode(enc);
      if (ri) holes.push(flat.length / 2);
      for (let i = 0; i < r.length; i++) flat.push(r[i]);
    });
    const idx = earcut(flat, holes);
    for (let k = 0; k < idx.length; k++) {
      surf.push(flat[idx[k] * 2] / q, flat[idx[k] * 2 + 1] / q, 0);
      snor.push(0, 0, 1);
    }
  }
  const land = [landStart, surf.length / 3 - landStart];

  return { surf: new Float32Array(surf), snor: new Float32Array(snor), states, wall, land, coast, border };
}

/** Contorno de un estado (para el foco), como segmentos. */
function outlineOf(state, q) {
  const segs = [];
  const z = SLAB + 0.0008;
  for (const poly of state.src.p) {
    for (const enc of poly) {
      const r = decode(enc);
      const n = r.length / 2;
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        segs.push(r[i * 2] / q, r[i * 2 + 1] / q, z, r[j * 2] / q, r[j * 2 + 1] / q, z);
      }
    }
  }
  return segs;
}

/** Segmentos → franjas (6 vértices por segmento: A, B, lado, extremo). */
function lineVerts(segs, out = null) {
  const n = segs.length / 6;
  const v = out || new Float32Array(n * 48);
  const corners = [0, -1, 0, 1, 1, 1, 0, -1, 1, 1, 1, -1];
  let o = 0;
  for (let i = 0; i < n; i++) {
    const s = i * 6;
    for (let c = 0; c < 12; c += 2) {
      v[o++] = segs[s]; v[o++] = segs[s + 1]; v[o++] = segs[s + 2];
      v[o++] = segs[s + 3]; v[o++] = segs[s + 4]; v[o++] = segs[s + 5];
      v[o++] = corners[c + 1];
      v[o++] = corners[c];
    }
  }
  return v;
}

/* ---------- Shaders ---------- */

const HP = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
`;

const VS = `attribute vec3 aPos;attribute vec3 aNor;
uniform mat4 uProj;uniform mat4 uView;uniform mat4 uModel;uniform mat3 uNM;
varying vec3 vW;varying vec3 vN;varying vec2 vL;
void main(){vec4 w=uModel*vec4(aPos,1.0);vW=w.xyz;vN=uNM*aNor;vL=aPos.xy;gl_Position=uProj*uView*w;}`;

// uMode: 1 sólido con luz (uColor) · 2 plano (uFlat) · 3 punto con halo.
const FS = `${HP}varying vec3 vW;varying vec3 vN;varying vec2 vL;
uniform float uMode;uniform vec3 uColor;uniform vec4 uFlat;uniform vec3 uSun;uniform vec3 uEye;uniform vec3 uBg;
uniform float uAmb;uniform float uKey;uniform vec2 uFog;
void main(){float fog=smoothstep(uFog.x,uFog.y,length(uEye-vW));
if(uMode>2.5){float r=length(vL)*2.0;float a=max(1.0-smoothstep(0.36,0.46,r),(1.0-smoothstep(0.46,1.0,r))*0.3);
gl_FragColor=vec4(uFlat.rgb,uFlat.a*a*(1.0-fog));return;}
if(uMode>1.5){gl_FragColor=vec4(mix(uFlat.rgb,uBg,fog),uFlat.a);return;}
vec3 N=normalize(vN);vec3 V=normalize(uEye-vW);if(dot(N,V)<0.0)N=-N;
float df=max(dot(N,uSun),0.0);float hemi=0.55+0.45*N.z;
vec3 col=uColor*(uAmb*hemi+uKey*df);
gl_FragColor=vec4(mix(col,uBg,fog),1.0);}`;

// Líneas: cada segmento es una franja en pantalla con borde suavizado (grosor uWidth en píxeles).
const LVS = `attribute vec3 aA;attribute vec3 aB;attribute float aSide;attribute float aEnd;
uniform mat4 uVP;uniform vec2 uRes;uniform float uWidth;uniform float uNear;
varying vec3 vW;varying float vD;
void main(){vec4 a=uVP*vec4(aA,1.0);vec4 b=uVP*vec4(aB,1.0);vW=aEnd<0.5?aA:aB;vD=0.0;
if(a.w<uNear||b.w<uNear){gl_Position=vec4(2.0,2.0,2.0,1.0);return;}
vec2 d=b.xy/b.w*uRes-a.xy/a.w*uRes;float L=length(d);vec2 n=L>1e-4?vec2(-d.y,d.x)/L:vec2(0.0,1.0);
vec4 p=aEnd<0.5?a:b;float hw=uWidth*0.5+1.0;p.xy+=n*aSide*hw/uRes*p.w;vD=aSide*hw;gl_Position=p;}`;
const LFS = `${HP}varying vec3 vW;varying float vD;
uniform vec4 uColor;uniform float uWidth;uniform vec3 uBg;uniform vec3 uEye;uniform vec2 uFog;
void main(){float a=clamp(uWidth*0.5+0.5-abs(vD),0.0,1.0);float fog=smoothstep(uFog.x,uFog.y,length(uEye-vW));
gl_FragColor=vec4(mix(uColor.rgb,uBg,fog),uColor.a*a*(1.0-fog));}`;

/**
 * Monta la escena en `canvas` (dentro del escenario sticky de `section`).
 * @param {object} o
 * @param {{ el: HTMLElement | null, at: [number, number] }[]} [o.captions] textos (y el velo) con su tramo.
 * @param {{ el: HTMLElement | null, at: [number, number] }[]} [o.segments] barras de progreso con su tramo.
 * @param {{ id: string, at: number, el?: HTMLElement | null, place?: string }[]} [o.highlights] estados que se alzan.
 * @param {{ home: string, from?: string, dest?: string, destState?: string } | null} [o.journey] ruta del avión.
 */
export function mountMexico({ canvas, section, data, isDark, captions = [], segments = [], rail = null, tooltip = null, highlights = [], journey = null, reducedMotion = false }) {
  if (!data || data.v !== 2) {
    console.warn('mexico-scene: se esperaba /geo/mexico-states.json v2');
    return null;
  }
  let gl = null;
  try {
    gl = canvas.getContext('webgl', { antialias: true, alpha: false, powerPreference: 'high-performance' });
  } catch {
    gl = null;
  }
  if (!gl) return null;

  const lite = window.matchMedia('(max-width: 767px), (pointer: coarse)').matches;
  const msaa = !!(gl.getContextAttributes() || {}).antialias && gl.getParameter(gl.SAMPLES) > 0;
  const compile = (type, src) => {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) || 'shader');
    return sh;
  };
  const link = (vs, fs, attrs) => {
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
    attrs.forEach((a, i) => gl.bindAttribLocation(p, i, a));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'link');
    return p;
  };
  let prog;
  let lprog;
  try {
    prog = link(VS, FS, ['aPos', 'aNor']);
    lprog = link(LVS, LFS, ['aA', 'aB', 'aSide', 'aEnd']);
  } catch (err) {
    console.warn('mexico-scene', err);
    return null;
  }
  const uni = (p, names) => Object.fromEntries(names.map((n) => [n, gl.getUniformLocation(p, n)]));
  const u = uni(prog, ['uProj', 'uView', 'uModel', 'uNM', 'uMode', 'uColor', 'uFlat', 'uSun', 'uEye', 'uBg', 'uAmb', 'uKey', 'uFog']);
  const lu = uni(lprog, ['uVP', 'uRes', 'uWidth', 'uNear', 'uColor', 'uBg', 'uEye', 'uFog']);
  gl.useProgram(prog);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const buffer = (arr, usage = gl.STATIC_DRAW) => {
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, arr instanceof Float32Array ? arr : new Float32Array(arr), usage);
    return b;
  };
  const lines = (segs) => ({ buf: buffer(lineVerts(segs)), count: (segs.length / 6) * 6 });

  const geo = buildMap(data);
  const states = geo.states;
  const surfBuf = buffer(geo.surf);
  const snorBuf = buffer(geo.snor);
  const coastL = lines(geo.coast);
  const borderL = lines(geo.border);
  const quadBuf = buffer([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0]);
  const routeSegs = new Float32Array(ROUTE_DASHES * 6);
  const routeVerts = new Float32Array(ROUTE_DASHES * 48);
  const routeBuf = buffer(routeVerts, gl.DYNAMIC_DRAW);
  const part = (s) => ({ pos: buffer(s.pos), nor: buffer(s.nor), count: s.pos.length / 3 });
  const planeGeo = buildPlane();
  const plane = { body: part(planeGeo.body), accent: part(planeGeo.accent) };

  function stateAt(x, y) {
    for (let i = 0; i < states.length; i++) {
      const s = states[i];
      if (x < s.box[0] || y < s.box[1] || x > s.box[2] || y > s.box[3]) continue;
      const t = s.tris;
      for (let k = 0; k < t.length; k += 6) {
        const d1 = (x - t[k + 2]) * (t[k + 1] - t[k + 3]) - (t[k] - t[k + 2]) * (y - t[k + 3]);
        const d2 = (x - t[k + 4]) * (t[k + 3] - t[k + 5]) - (t[k + 2] - t[k + 4]) * (y - t[k + 5]);
        const d3 = (x - t[k]) * (t[k + 5] - t[k + 1]) - (t[k + 4] - t[k]) * (y - t[k + 1]);
        if (!((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))) return i;
      }
    }
    return -1;
  }

  const byKey = new Map();
  states.forEach((s, i) => {
    byKey.set(s.id, i);
    byKey.set(s.name, i);
  });
  const find = (key) => (key && byKey.has(key) ? byKey.get(key) : -1);
  const places = {};
  for (const [k, v] of Object.entries(data.places || {})) places[k] = [v[0] / data.q, v[1] / data.q];
  const shadeOf = states.map((_, i) => 0.96 + 0.08 * hash(i, 5));

  // Ruta del avión: del pueblo (o del centro del estado de origen) al destino.
  const homeIndex = find(journey && journey.home);
  const town = journey && journey.from && places[journey.from] ? places[journey.from] : homeIndex >= 0 ? states[homeIndex].anchor : null;
  const destPlace = journey && journey.dest && places[journey.dest] ? places[journey.dest] : null;
  let destIndex = destPlace ? stateAt(destPlace[0], destPlace[1]) : -1;
  if (destIndex < 0) destIndex = find(journey && journey.destState);
  const dest = destPlace || (destIndex >= 0 ? states[destIndex].anchor : null);
  const trip = !!(town && dest);
  const homeC = homeIndex >= 0 ? states[homeIndex].anchor : town;
  const destC = destIndex >= 0 ? states[destIndex].anchor : dest;

  // Estados alzados: los muros y el contorno de cada uno se arman la primera vez que se alza.
  const heights = new Float32Array(states.length);
  const clicked = states.map(() => 0);
  const clickK = states.map(() => 0);
  const manual = states.map(() => null);
  const wallCache = new Map();
  const outlineCache = new Map();
  function wallsOf(i) {
    if (wallCache.has(i)) return wallCache.get(i);
    const q = data.q;
    const pos = [];
    const nor = [];
    for (const poly of states[i].src.p) {
      poly.forEach((enc, ri) => {
        const r = decode(enc);
        const n = r.length / 2;
        let a2 = 0;
        for (let k = 0; k < n; k++) {
          const j = (k + 1) % n;
          a2 += r[k * 2] * r[j * 2 + 1] - r[j * 2] * r[k * 2 + 1];
        }
        const solidLeft = ri === 0 ? a2 > 0 : a2 < 0;
        for (let k = 0; k < n; k++) {
          const j = (k + 1) % n;
          const ax = r[k * 2] / q, ay = r[k * 2 + 1] / q, bx = r[j * 2] / q, by = r[j * 2 + 1] / q;
          let nx = by - ay;
          let ny = ax - bx;
          if (!solidLeft) {
            nx = -nx;
            ny = -ny;
          }
          const L = Math.hypot(nx, ny) || 1;
          pos.push(ax, ay, 0, bx, by, 0, bx, by, 1, ax, ay, 0, bx, by, 1, ax, ay, 1);
          for (let m = 0; m < 6; m++) nor.push(nx / L, ny / L, 0);
        }
      });
    }
    const w = { pos: buffer(pos), nor: buffer(nor), count: pos.length / 3 };
    wallCache.set(i, w);
    return w;
  }
  function outlineL(i) {
    if (!outlineCache.has(i)) outlineCache.set(i, lines(outlineOf(states[i], data.q)));
    return outlineCache.get(i);
  }

  // Nacimiento: al salir del negro, cada estado brota de su centro con un rebote, del centro del país
  // hacia afuera. Solo se dibuja México.
  const BIRTH = 0.6;
  const backOut = (t) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2);
  const birthDelay = (() => {
    const d = states.map((s) => Math.hypot(s.anchor[0], s.anchor[1]));
    const max = Math.max(...d, 1e-6);
    return d.map((v, i) => 0.6 * (v / max) + 0.12 * hash(i, 9));
  })();
  const BIRTH_END = Math.max(...birthDelay) + BIRTH;
  let birthT0 = null;
  if (!reducedMotion) states.forEach((_, i) => wallsOf(i));

  let hl = [];
  function setHL(list) {
    hl = (list || [])
      .map((h) => {
        const i = find(h.id);
        const at = h.place && places[h.place] ? places[h.place] : i >= 0 ? states[i].anchor : null;
        return { i, at, rise: Number.isFinite(h.at) ? h.at : 0, el: h.el || null };
      })
      .filter((h) => h.i >= 0 && h.at);
  }
  setHL(highlights);

  let W = 1;
  let H = 1;
  let dpr = 1;
  let raf = 0;
  let alive = true;
  let last = performance.now();
  let pointer = null;
  let hovered = -1;
  let pick = null;
  let pS = null;
  let VP = identity();
  const I4 = identity();
  const I3 = rot3(I4);

  function measure() {
    const dev = window.devicePixelRatio || 1;
    const cap = lite ? 1.5 : 2;
    dpr = msaa ? Math.min(dev, cap) : Math.min(Math.max(dev, cap), 2);
    W = Math.max(canvas.clientWidth, 1);
    H = Math.max(canvas.clientHeight, 1);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }

  function ensurePick() {
    const w = Math.round(W);
    const h = Math.round(H);
    if (pick && pick.w === w && pick.h === h) return pick;
    if (pick) {
      gl.deleteFramebuffer(pick.fb);
      gl.deleteTexture(pick.tex);
      gl.deleteRenderbuffer(pick.rb);
    }
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const rb = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h);
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rb);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    pick = { fb, tex, rb, w, h };
    return pick;
  }

  /** Progreso 0–1 del tramo fijo (la sección mide más que la pantalla y su escenario es sticky). */
  function progress() {
    if (reducedMotion) return 1;
    const r = section.getBoundingClientRect();
    return clamp01(-r.top / Math.max(r.height - window.innerHeight, 1));
  }

  function visible() {
    const r = section.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight;
  }

  function bind(pos, nor) {
    gl.bindBuffer(gl.ARRAY_BUFFER, pos);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    if (nor) {
      gl.bindBuffer(gl.ARRAY_BUFFER, nor);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
    } else {
      gl.disableVertexAttribArray(1);
      gl.vertexAttrib3f(1, 0, 0, 1);
    }
  }
  const setModel = (M, NM = I3) => {
    gl.uniformMatrix4fv(u.uModel, false, M);
    gl.uniformMatrix3fv(u.uNM, false, NM);
  };
  const solidColor = (c) => {
    gl.uniform1f(u.uMode, 1);
    gl.uniform3fv(u.uColor, c);
  };
  const flat = (c, a) => {
    gl.uniform1f(u.uMode, 2);
    gl.uniform4f(u.uFlat, c[0], c[1], c[2], a);
  };
  function drawLines(L, rgba, width, M = VP) {
    if (!L || !L.count || rgba[3] <= 0.004) return;
    gl.useProgram(lprog);
    gl.uniformMatrix4fv(lu.uVP, false, M);
    gl.bindBuffer(gl.ARRAY_BUFFER, L.buf);
    for (let i = 0; i < 4; i++) gl.enableVertexAttribArray(i);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 32, 0);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 32, 12);
    gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 32, 24);
    gl.vertexAttribPointer(3, 1, gl.FLOAT, false, 32, 28);
    gl.uniform4f(lu.uColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    gl.uniform1f(lu.uWidth, width * dpr);
    gl.drawArrays(gl.TRIANGLES, 0, L.count);
    gl.disableVertexAttribArray(2);
    gl.disableVertexAttribArray(3);
    gl.useProgram(prog);
  }
  function drawDot(at, z, r, a, color) {
    if (a <= 0.004) return;
    bind(quadBuf, null);
    gl.enable(gl.BLEND);
    gl.depthMask(false);
    gl.uniform1f(u.uMode, 3);
    gl.uniform4f(u.uFlat, color[0], color[1], color[2], a);
    setModel(mul(translation(at[0], at[1], z), scaling(r * 2, r * 2, 1)));
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.depthMask(true);
    gl.disable(gl.BLEND);
    setModel(I4);
  }
  function drawPart(pt, color, M, Rp) {
    bind(pt.pos, pt.nor);
    setModel(M, rot3(Rp));
    solidColor(color);
    gl.drawArrays(gl.TRIANGLES, 0, pt.count);
  }

  function render(now) {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    let busy = false;
    const tone = isDark() ? TONES.dark : TONES.light;

    const target = progress();
    pS = pS === null || reducedMotion ? target : pS + (target - pS) * Math.min(1, dt * 9);
    if (Math.abs(target - pS) > 0.0004) busy = true;
    else pS = target;
    const p = pS;
    const mapA = reducedMotion || p > PORTAL ? 1 : 0;
    // El nacimiento se repite cada vez que el mapa sale del negro del portal (no al volver desde abajo).
    if (mapA <= 0) birthT0 = null;
    else if (birthT0 === null) birthT0 = reducedMotion || p > 0.2 ? -1e9 : now;
    const bt = (now - birthT0) / 1000;
    const birthing = bt < BIRTH_END;
    if (birthing) busy = true;

    // Alturas: las del guion siguen al scroll; las del clic tienen su propio ease.
    heights.fill(0);
    for (const h of hl) heights[h.i] = Math.max(heights[h.i], RAISE * smooth(clamp01((p - h.rise) / 0.05)));
    for (let i = 0; i < states.length; i++) {
      const k = clickK[i] + (clicked[i] - clickK[i]) * Math.min(1, dt * 7);
      clickK[i] = Math.abs(clicked[i] - k) < 0.002 ? clicked[i] : k;
      if (clickK[i] !== clicked[i]) busy = true;
      heights[i] = Math.max(heights[i], RAISE * smooth(clickK[i]));
      if (manual[i] !== null) heights[i] = manual[i];
    }

    // Guion: México → Todos Santos → vuelo → Guadalajara → México.
    const toHome = smooth(clamp01((p - 0.26) / 0.08));
    const fly = smooth(clamp01((p - 0.47) / 0.16));
    const toFlight = smooth(clamp01((p - 0.47) / 0.05));
    const toDest = smooth(clamp01((p - 0.59) / 0.06));
    const toEnd = smooth(clamp01((p - 0.78) / 0.08));

    const topZ = SLAB + RAISE + 0.002;
    const alt = (k) => topZ + FLIGHT_ALT * Math.sin(Math.PI * k);
    let planePos = null;
    let heading = 0;
    let pitch = 0;
    let rdx = 0;
    let rdy = 0;
    if (trip) {
      rdx = dest[0] - town[0];
      rdy = dest[1] - town[1];
      heading = Math.atan2(rdy, rdx);
      planePos = [town[0] + rdx * fly, town[1] + rdy * fly, alt(fly)];
      const e = 0.01;
      pitch = Math.atan2(alt(Math.min(1, fly + e)) - alt(Math.max(0, fly - e)), Math.hypot(rdx, rdy) * 2 * e);
    }

    // Encuadre: México ocupa ~52 % del ancho; los acercamientos usan distancias absolutas.
    const aspect = W / H;
    const tanH = Math.tan(FOV / 2);
    const fit = Math.max(1 / ((aspect > 1.1 ? 0.52 : 0.84) * tanH * aspect), (data.h * 0.5 * Math.cos(OVER_TILT) + 0.22) / (0.58 * tanH));
    const near = (D) => (D * Math.max(1, 0.7 / aspect)) / fit;
    const mixCam = (a, b, k) => ({
      cx: lerp(a.cx, b.cx, k), cy: lerp(a.cy, b.cy, k), cz: lerp(a.cz, b.cz, k),
      d: Math.exp(lerp(Math.log(a.d), Math.log(b.d), k)), tilt: lerp(a.tilt, b.tilt, k), yaw: lerp(a.yaw, b.yaw, k),
    });
    const O = { cx: 0.02, cy: 0, cz: 0, d: 1, tilt: OVER_TILT, yaw: -0.08 };
    let cam = O;
    // 0: textos arriba y México centrado · 1: textos a la izquierda y el sujeto a la derecha.
    let sideK = 0;
    if (trip) {
      const Hc = { cx: lerp(homeC[0], town[0], 0.55), cy: lerp(homeC[1], town[1], 0.55), cz: SLAB, d: near(0.95), tilt: 0.92, yaw: -0.16 };
      const Dc = { cx: lerp(destC[0], dest[0], 0.5), cy: lerp(destC[1], dest[1], 0.5), cz: SLAB, d: near(0.9), tilt: 0.95, yaw: 0.1 };
      cam = mixCam(O, Hc, toHome);
      sideK = toHome;
      if (p > 0.47) {
        const F = { cx: planePos[0], cy: planePos[1], cz: planePos[2] * 0.6, d: near(1.1 + 0.35 * Math.sin(Math.PI * fly)), tilt: 0.93, yaw: lerp(-0.16, 0.1, fly) };
        cam = mixCam(mixCam(Hc, F, toFlight), Dc, toDest);
      }
      if (p > 0.78) {
        cam = mixCam(Dc, O, toEnd);
        sideK = 1 - toEnd;
      }
    }
    const close = clamp01((1 - cam.d) / 0.6);
    const dist = fit * cam.d;
    const side = W >= 768 && aspect > 1 ? 1 : 0;
    const R = mul(rot('x', -cam.tilt), rot('z', cam.yaw));
    const Vw = mul(R, translation(-cam.cx, -cam.cy, -cam.cz));
    Vw[12] += dist * tanH * aspect * 0.3 * side * sideK;
    Vw[13] -= dist * tanH * (side ? lerp(0.16, 0.08, sideK) : lerp(0.3, 0.42, close));
    Vw[14] -= dist;
    const nearZ = Math.max(0.004, dist * 0.08);
    const P = perspective(FOV, aspect, nearZ, dist * 4 + 12);
    const eye = [0, 1, 2].map((i) => -(Vw[i * 4] * Vw[12] + Vw[i * 4 + 1] * Vw[13] + Vw[i * 4 + 2] * Vw[14]));
    VP = mul(P, Vw);

    gl.useProgram(lprog);
    gl.uniform2f(lu.uRes, canvas.width / 2, canvas.height / 2);
    gl.uniform1f(lu.uNear, nearZ);
    gl.uniform3fv(lu.uBg, tone.bg);
    gl.uniform3fv(lu.uEye, eye);
    gl.uniform2f(lu.uFog, dist * 1.7, dist * 5.5);
    gl.useProgram(prog);
    gl.uniformMatrix4fv(u.uProj, false, P);
    gl.uniformMatrix4fv(u.uView, false, Vw);
    gl.uniform3fv(u.uSun, SUN);
    gl.uniform3fv(u.uEye, eye);
    gl.uniform3fv(u.uBg, tone.bg);
    gl.uniform1f(u.uAmb, tone.amb);
    gl.uniform1f(u.uKey, tone.key);
    setModel(I4);

    // Al inicio y al final (vistas generales) el cursor muestra el nombre del estado y un clic lo alza.
    const interactive = !birthing && (reducedMotion || (p > 0.12 && p < 0.255) || p > 0.85);
    if (pointer && interactive && mapA > 0.9) {
      const pk = ensurePick();
      gl.bindFramebuffer(gl.FRAMEBUFFER, pk.fb);
      gl.viewport(0, 0, pk.w, pk.h);
      gl.disable(gl.BLEND);
      gl.enable(gl.DEPTH_TEST);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniform2f(u.uFog, 1e5, 2e5);
      bind(surfBuf, snorBuf);
      states.forEach((st, i) => {
        flat([(i + 1) / 255, 0, 0], 1);
        setModel(heights[i] > 0 ? translation(0, 0, heights[i]) : I4);
        gl.drawArrays(gl.TRIANGLES, st.topStart, st.topCount);
      });
      setModel(I4);
      const px = new Uint8Array(4);
      const x = Math.min(pk.w - 1, Math.max(0, Math.round(pointer.x)));
      const y = Math.min(pk.h - 1, Math.max(0, Math.round(pk.h - pointer.y - 1)));
      gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      hovered = px[0] > 0 && px[0] <= states.length ? px[0] - 1 : -1;
    } else {
      hovered = -1;
    }
    canvas.style.cursor = hovered >= 0 ? 'pointer' : '';

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clearColor(tone.bg[0], tone.bg[1], tone.bg[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniform2f(u.uFog, dist * 1.7, dist * 5.5);

    const colorOf = (i) => {
      const up = Math.min(1, heights[i] / RAISE);
      const c0 = i === hovered ? tone.hover : tone.top;
      return mix3([c0[0] * shadeOf[i], c0[1] * shadeOf[i], c0[2] * shadeOf[i]], tone.lit, up);
    };
    const popped = [];
    if (birthing) {
      // Cada estado crece desde su centro y da un salto: tapa, muros y contorno suben juntos.
      for (let i = 0; i < states.length; i++) {
        const k = clamp01((bt - birthDelay[i]) / BIRTH);
        if (k <= 0) continue;
        const st = states[i];
        const e = backOut(k);
        const lift = RAISE * 0.45 * Math.sin(Math.PI * Math.min(1, k * 1.15));
        const sxy = 0.35 + 0.65 * e;
        const XY = mul(mul(translation(st.anchor[0], st.anchor[1], 0), scaling(sxy, sxy, 1)), translation(-st.anchor[0], -st.anchor[1], 0));
        const topM = mul(translation(0, 0, heights[i] + lift), mul(XY, scaling(1, 1, e)));
        bind(surfBuf, snorBuf);
        solidColor(colorOf(i));
        setModel(topM);
        gl.drawArrays(gl.TRIANGLES, st.topStart, st.topCount);
        const w = wallsOf(i);
        bind(w.pos, w.nor);
        setModel(mul(XY, scaling(1, 1, Math.max(1e-5, SLAB * e + lift + heights[i]))));
        solidColor(tone.wall);
        gl.drawArrays(gl.TRIANGLES, 0, w.count);
        popped.push([i, topM]);
      }
    } else {
      bind(surfBuf, snorBuf);
      solidColor(tone.wall);
      gl.drawArrays(gl.TRIANGLES, geo.wall[0], geo.wall[1]);
      states.forEach((st, i) => {
        solidColor(colorOf(i));
        setModel(heights[i] > 0 ? translation(0, 0, heights[i]) : I4);
        gl.drawArrays(gl.TRIANGLES, st.topStart, st.topCount);
      });
      for (let i = 0; i < states.length; i++) {
        if (heights[i] < 0.0004) continue;
        const w = wallsOf(i);
        bind(w.pos, w.nor);
        setModel(mul(translation(0, 0, SLAB), scaling(1, 1, heights[i])));
        solidColor(tone.side);
        gl.drawArrays(gl.TRIANGLES, 0, w.count);
      }
    }
    setModel(I4);

    // Líneas con antialiasing: fronteras, costa, contorno blanco de los estados alzados y la ruta punteada.
    gl.enable(gl.BLEND);
    gl.depthMask(false);
    if (birthing) {
      for (const [i, M] of popped) drawLines(outlineL(i), tone.border, 1, mul(VP, M));
    } else {
      drawLines(borderL, tone.border, 1);
      drawLines(coastL, tone.coast, 1.2);
    }
    for (let i = 0; i < states.length; i++) {
      if (heights[i] < 0.0004) continue;
      drawLines(outlineL(i), [tone.ink[0], tone.ink[1], tone.ink[2], 0.85 * Math.min(1, heights[i] / RAISE)], 1.4, mul(VP, translation(0, 0, heights[i])));
    }
    if (trip && fly > 0) {
      let n = 0;
      for (let i = 0; i < ROUTE_DASHES; i++) {
        const a0 = i / ROUTE_DASHES;
        if (a0 >= fly) break;
        const a1 = Math.min(fly, (i + 0.5) / ROUTE_DASHES);
        routeSegs.set([town[0] + rdx * a0, town[1] + rdy * a0, alt(a0), town[0] + rdx * a1, town[1] + rdy * a1, alt(a1)], n * 6);
        n++;
      }
      if (n) {
        lineVerts(routeSegs.subarray(0, n * 6), routeVerts);
        gl.bindBuffer(gl.ARRAY_BUFFER, routeBuf);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, routeVerts.subarray(0, n * 48));
        drawLines({ buf: routeBuf, count: n * 6 }, [tone.ink[0], tone.ink[1], tone.ink[2], 0.95], 2);
      }
    }
    gl.depthMask(true);
    gl.disable(gl.BLEND);
    if (trip) {
      const zh = homeIndex >= 0 ? heights[homeIndex] : 0;
      const zd = destIndex >= 0 ? heights[destIndex] : 0;
      drawDot(town, SLAB + zh + 0.001, dist * 0.014, smooth(clamp01((p - 0.32) / 0.03)), tone.ink);
      drawDot(dest, SLAB + zd + 0.001, dist * 0.014, smooth(clamp01((p - 0.62) / 0.03)), tone.ink);
    }

    // Avión: despega de Todos Santos y aterriza en Guadalajara.
    if (trip && p > 0.47 && p < 0.66) {
      const appear = smooth(clamp01((p - 0.47) / 0.015));
      const vanish = 1 - smooth(clamp01((p - 0.63) / 0.02));
      const sc = PLANE_SIZE * appear * vanish;
      if (sc > 0.0001) {
        const Rp = mul(rot('z', heading), rot('y', -pitch));
        const gi = stateAt(planePos[0], planePos[1]);
        const ground = gi >= 0 ? SLAB + heights[gi] : 0;
        if (planePos[2] > ground + 0.002) {
          gl.enable(gl.BLEND);
          gl.depthMask(false);
          bind(plane.body.pos, null);
          setModel(mul(mul(translation(planePos[0], planePos[1], ground + 0.0008), rot('z', heading)), scaling(sc, sc, 0)));
          flat([0, 0, 0], tone.planeShadow * appear * vanish);
          gl.drawArrays(gl.TRIANGLES, 0, plane.body.count);
          gl.depthMask(true);
          gl.disable(gl.BLEND);
        }
        const M = mul(mul(translation(planePos[0], planePos[1], planePos[2]), Rp), scaling(sc, sc, sc));
        drawPart(plane.body, tone.plane, M, Rp);
        drawPart(plane.accent, tone.planeAccent, M, Rp);
        setModel(I4);
      }
    }

    // Capas HTML.
    canvas.style.opacity = String(mapA);
    const F = 0.02;
    captions.forEach((c) => {
      if (!c.el || !c.at) return;
      const [a, b] = c.at;
      const fin = smooth(clamp01((p - a) / F));
      const fout = b > 1 ? 0 : smooth(clamp01((p - (b - F)) / F));
      const o = reducedMotion ? (b > 1 ? 1 : 0) : fin * (1 - fout) * mapA;
      c.el.style.opacity = o.toFixed(3);
      c.el.style.transform = `translateY(${((1 - fin) * 10).toFixed(1)}px)`;
      c.el.style.visibility = o > 0.001 ? 'visible' : 'hidden';
    });
    if (rail) rail.style.opacity = (reducedMotion ? 0 : mapA).toFixed(3);
    segments.forEach((sg) => {
      if (!sg.el || !sg.at) return;
      const [a, b] = sg.at;
      sg.el.style.transform = `scaleX(${clamp01((p - a) / Math.max(b - a, 1e-4)).toFixed(4)})`;
    });

    const project = (x, yy, z) => {
      const c = transform(VP, x, yy, z);
      return [(c[0] / c[3] * 0.5 + 0.5) * W, (0.5 - (c[1] / c[3]) * 0.5) * H, c[3]];
    };
    const place = (el, at, a) => {
      const [x, yy, w] = project(at[0], at[1], at[2]);
      const on = w > 0 && x > -80 && x < W + 80 && yy > -80 && yy < H + 80;
      el.style.transform = `translate(${x.toFixed(1)}px, ${yy.toFixed(1)}px)`;
      el.style.opacity = on ? a.toFixed(3) : '0';
    };
    for (const h of hl) {
      if (!h.el) continue;
      const a = (reducedMotion ? 1 : smooth(clamp01((p - h.rise - 0.03) / 0.03))) * mapA;
      place(h.el, [h.at[0], h.at[1], SLAB + heights[h.i] + 0.001], a);
    }
    if (tooltip) {
      const show = hovered >= 0 && !!pointer;
      if (show) {
        tooltip.textContent = states[hovered].name;
        tooltip.style.transform = `translate(${(pointer.x + 14).toFixed(0)}px, ${(pointer.y + 18).toFixed(0)}px)`;
      }
      tooltip.style.opacity = show ? '1' : '0';
    }
    return busy;
  }

  function frame(now) {
    raf = 0;
    if (!alive) return;
    const busy = visible() ? render(now) : false;
    if (busy && !document.hidden) raf = requestAnimationFrame(frame);
  }

  function kick() {
    if (alive && !raf) raf = requestAnimationFrame(frame);
  }

  const onResize = () => {
    measure();
    kick();
  };
  const onMove = (e) => {
    const r = canvas.getBoundingClientRect();
    pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
    kick();
  };
  const onLeave = () => {
    pointer = null;
    kick();
  };
  const onClick = () => {
    if (hovered < 0) return;
    clicked[hovered] = clicked[hovered] ? 0 : 1;
    kick();
  };

  measure();
  kick();
  window.addEventListener('scroll', kick, { passive: true });
  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', kick);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerleave', onLeave);
  canvas.addEventListener('click', onClick);

  return {
    /** Alza un estado a mano (id ISO o nombre); `null` lo devuelve al guion. */
    setHeight(key, value) {
      const i = find(key);
      if (i < 0) return;
      manual[i] = value === null || value === undefined ? null : Number(value);
      kick();
    },
    setHighlights(list) {
      setHL(list);
      kick();
    },
    refresh() {
      measure();
      kick();
    },
    renderNow() {
      pS = null;
      render(performance.now());
    },
    destroy() {
      alive = false;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', kick);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', kick);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('click', onClick);
      canvas.style.cursor = '';
      if (!canvas.isConnected) {
        const lose = gl.getExtension('WEBGL_lose_context');
        if (lose) lose.loseContext();
      }
    },
  };
}
