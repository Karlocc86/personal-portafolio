/**
 * Mapa 3D de México por estados: WebGL puro, sin dependencias.
 * Cada estado es un prisma extruido cuya altura se puede animar por separado (setHeight / highlights).
 * Geometría: /geo/mexico-states.json (Natural Earth vía angelnmara/geojson, proyectada en Mercator,
 * simplificada y triangulada de antemano).
 *
 * Línea de tiempo ligada al scroll de `section` (alto ≈ 500svh con escenario sticky), ver TL:
 *   zoom-in a México → zoom a Todos Santos, donde se arma una cabaña de playa en bloques → el avión despega,
 *   la cámara lo sigue hasta Guadalajara → zoom-out al mapa completo con la ruta trazada.
 * Interacción: hover alza un poco el estado y muestra su nombre; clic lo deja alzado.
 */

const DEG = Math.PI / 180;
const FOV = 30 * DEG;
const BASE_H = 0.026;
const RAISE_H = 0.17;
const HOVER_H = 0.035;
const PIN_H = 0.11;
const FINAL_TILT = 0.95;
const STUD = 0.0036;
const DROP = 6;
const HOUSE_YAW = 0.1;
const PLANE_SIZE = 0.034;
const FLIGHT_ALT = 0.11;
/** Fases sobre el progreso de scroll de la sección (0–1). */
const TL = {
  mexico: [0.03, 0.14],
  text: [0.08, 0.13],
  home: [0.16, 0.24],
  build: [0.24, 0.5],
  out: [0.52, 0.58],
  fly: [0.58, 0.8],
  final: [0.83, 0.93],
};

const TONES = {
  dark: {
    top: [0.11, 0.11, 0.12], hover: [0.22, 0.22, 0.235], line: [0.36, 0.36, 0.38],
    ink: [0.93, 0.93, 0.95], accent: [0.0, 0.443, 0.89], objBody: [0.95, 0.95, 0.96], objRoof: [0.42, 0.42, 0.45],
    amb: 0.42, key: 0.78, spec: 0.22, rim: 0.2, shadow: 0,
  },
  light: {
    top: [0.95, 0.95, 0.955], hover: [0.86, 0.86, 0.88], line: [0.74, 0.74, 0.76],
    ink: [0.17, 0.17, 0.18], accent: [0.0, 0.443, 0.89], objBody: [1, 1, 1], objRoof: [0.2, 0.2, 0.22],
    amb: 0.6, key: 0.46, spec: 0.1, rim: 0, shadow: 0.045,
  },
};

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a, b, t) => a + (b - a) * t;
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

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

const transform = (m, x, y, z) => [
  m[0] * x + m[4] * y + m[8] * z + m[12],
  m[1] * x + m[5] * y + m[9] * z + m[13],
  m[2] * x + m[6] * y + m[10] * z + m[14],
  m[3] * x + m[7] * y + m[11] * z + m[15],
];

function rotY(t) {
  const m = identity();
  const c = Math.cos(t);
  const s = Math.sin(t);
  m[0] = c; m[2] = -s; m[8] = s; m[10] = c;
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

const rot3 = (m) => new Float32Array([m[0], m[1], m[2], m[4], m[5], m[6], m[8], m[9], m[10]]);
const easeOutBack = (t) => 1 + 2.4 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2);

/* ---------- Objetos low-poly: casa y avión ---------- */

function solid() {
  const pos = [];
  const nor = [];
  const tri = (a, b, c) => {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const L = Math.hypot(nx, ny, nz) || 1;
    nx /= L; ny /= L; nz /= L;
    pos.push(...a, ...b, ...c);
    for (let i = 0; i < 3; i++) nor.push(nx, ny, nz);
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
  return { pos, nor, tri, quad, box };
}

/* ---------- Cabaña de playa en bloques (estilo LEGO) ---------- */

const BRICK = 1.2;
const PLATE = 0.4;
const COL = {
  sand: [0.95, 0.89, 0.76], sandSide: [0.86, 0.77, 0.62], water: [0.42, 0.74, 0.8], waterDeep: [0.3, 0.62, 0.72], foam: [0.97, 0.97, 0.95],
  wood: [0.82, 0.52, 0.34], woodDark: [0.64, 0.39, 0.25], wall: [0.56, 0.75, 0.71], trim: [0.98, 0.97, 0.94],
  roof: [0.91, 0.85, 0.71], roofAlt: [0.85, 0.78, 0.63], glass: [0.99, 0.8, 0.58],
  trunk: [0.8, 0.56, 0.38], trunkDark: [0.7, 0.47, 0.31], leaf: [0.58, 0.74, 0.44], leafDark: [0.43, 0.62, 0.34],
  bush: [0.33, 0.56, 0.32], bushLight: [0.45, 0.66, 0.38], pebble: [0.9, 0.9, 0.88],
};

/**
 * Cabaña de playa (referencia: casita verde salvia de un piso con techo claro de dos aguas,
 * ventana redonda en el frontón, terraza de madera con barandales y escalones, cuatro palmeras,
 * arbustos y una franja de mar al frente) en unidades de “stud”: 14 × 12 de base, ~11 de alto.
 * Devuelve las piezas en orden de construcción, cada una con su rango en el búfer.
 */
function buildDiorama() {
  const bricks = [];
  let group = 0;
  const add = (x, y, z, w, d, h, color, o = {}) =>
    bricks.push({ x, y, z, w, d, h, color, glow: !!o.glow, studs: o.studs ?? !o.glow, group });
  const next = () => {
    group += 1;
  };
  const range = (a, b) => Array.from({ length: Math.max(0, b - a) }, (_, i) => a + i);
  const hash = (a, b) => {
    const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const flat = { studs: false };

  // Muros con hileras trabadas (las esquinas alternan entre frente y costados).
  const ring = (x0, x1, y0, y1, z0, courses, holes, color) => {
    for (let c = 0; c < courses; c++) {
      const z = z0 + c * BRICK;
      const odd = c % 2 === 1;
      const hole = (x, y) => holes.some((h) => h.c.includes(c) && x >= h.x0 && x < h.x1 && y >= h.y0 && y < h.y1);
      const run = (cells, mk) => {
        let seg = [];
        const flush = () => {
          let i = 0;
          let first = true;
          while (i < seg.length) {
            const len = Math.min(first && odd ? 1 : 2, seg.length - i);
            mk(seg[i], len);
            i += len;
            first = false;
          }
          seg = [];
        };
        for (const cell of cells) {
          if (hole(cell[0], cell[1])) flush();
          else seg.push(cell);
        }
        flush();
      };
      const fx0 = odd ? x0 + 1 : x0;
      const fx1 = odd ? x1 - 1 : x1;
      const sy0 = odd ? y0 : y0 + 1;
      const sy1 = odd ? y1 : y1 - 1;
      for (const y of [y0, y1 - 1]) run(range(fx0, fx1).map((x) => [x, y]), (p, len) => add(p[0], p[1], z, len, 1, BRICK, color, flat));
      for (const x of [x0, x1 - 1]) run(range(sy0, sy1).map((y) => [x, y]), (p, len) => add(p[0], p[1], z, 1, len, BRICK, color, flat));
    }
  };

  // 1. Base de arena (bloque grueso con esquinas redondeadas).
  const inBase = (cx, cy) => Math.pow(Math.abs((cx + 0.5 - 7) / 7.1), 6) + Math.pow(Math.abs((cy + 0.5 - 6) / 6.1), 6) <= 1;
  const cells = (fn) => {
    for (let y = 0; y < 12; y += 2) {
      for (let x = 0; x < 14; x += 2) {
        if (inBase(x, y) && inBase(x + 1, y) && inBase(x, y + 1) && inBase(x + 1, y + 1)) fn(x, y, 2, 2);
        else for (const [i, j] of [[0, 0], [1, 0], [0, 1], [1, 1]]) if (inBase(x + i, y + j)) fn(x + i, y + j, 1, 1);
      }
    }
  };
  cells((x, y, w, d) => add(x, y, 0, w, d, BRICK, COL.sandSide, flat));

  // 2. Superficie: mar al frente, espuma y arena.
  next();
  const foamY = (x) => 2 + (hash(x, 3) > 0.5 ? 1 : 0);
  cells((x, y, w, d) => {
    for (let i = 0; i < w; i++) {
      for (let j = 0; j < d; j++) {
        const cx = x + i;
        const cy = y + j;
        const f = foamY(cx);
        if (cy < f - 1) add(cx, cy, BRICK, 1, 1, PLATE, hash(cx, cy) > 0.5 ? COL.water : COL.waterDeep, flat);
        else if (cy === f - 1) add(cx, cy, BRICK, 1, 1, PLATE, COL.foam, flat);
        else add(cx, cy, BRICK, 1, 1, PLATE, COL.sand);
      }
    }
  });
  const BZ = BRICK + PLATE;

  // 3. Plataforma de madera y terraza.
  next();
  for (let x = 3; x < 11; x += 2) for (let y = 4; y < 10; y += 2) add(x, y, BZ, 2, 2, 2 * PLATE, COL.woodDark);
  next();
  const FZ = BZ + 2 * PLATE;
  for (let x = 3; x < 11; x += 2) add(x, 4, FZ, 2, 2, PLATE, COL.wood);
  const DZ = FZ + PLATE;

  // 4. Muros (puerta al centro, ventanas al frente y a los lados).
  next();
  ring(3, 11, 6, 10, FZ, 3, [
    { x0: 6, x1: 8, y0: 6, y1: 7, c: [0, 1] },
    { x0: 4, x1: 5, y0: 6, y1: 7, c: [1] },
    { x0: 9, x1: 10, y0: 6, y1: 7, c: [1] },
    { x0: 3, x1: 4, y0: 7, y1: 9, c: [1] },
    { x0: 10, x1: 11, y0: 7, y1: 9, c: [1] },
  ], COL.wall);

  // 5. Puerta, ventanas con marco blanco y esquineros.
  next();
  const W1 = FZ + BRICK;
  add(6.1, 6.3, FZ, 1.8, 0.4, 2 * BRICK, COL.wood, flat);
  add(6.45, 6.2, FZ + 1.3, 1.1, 0.12, 0.9, COL.glass, { glow: true });
  for (const x of [4, 9]) {
    add(x + 0.1, 6.35, W1, 0.8, 0.3, BRICK, COL.glass, { glow: true });
    add(x - 0.2, 5.8, W1 - 0.15, 1.4, 0.25, 0.15, COL.trim, flat);
    add(x - 0.2, 5.8, W1 + BRICK, 1.4, 0.25, 0.15, COL.trim, flat);
    add(x - 0.2, 5.8, W1, 0.2, 0.25, BRICK, COL.trim, flat);
    add(x + 1.0, 5.8, W1, 0.2, 0.25, BRICK, COL.trim, flat);
    add(x + 0.42, 5.75, W1, 0.16, 0.2, BRICK, COL.trim, flat);
  }
  for (const x of [3, 10]) add(x + 0.35, 7, W1, 0.3, 2, BRICK, COL.glass, { glow: true });
  for (const x of [2.85, 10.9]) add(x, 5.85, FZ, 0.25, 0.25, 3 * BRICK, COL.trim, flat);

  // 6. Techo de dos aguas (cumbrera de frente a fondo) con frontón verde.
  next();
  const RZ = FZ + 3 * BRICK;
  const LH = 0.5;
  for (let k = 0; k < 8; k++) {
    const z = RZ + k * LH;
    const color = k % 2 ? COL.roofAlt : COL.roof;
    const cuts = k % 2 ? [5.4, 6.4, 8.4, 10.6] : [5.4, 7.4, 9.4, 10.6];
    for (const xs of [2.4 + 0.5 * k, 10.6 - 0.5 * k]) {
      for (let i = 0; i < cuts.length - 1; i++) add(xs, cuts[i], z, 1, cuts[i + 1] - cuts[i], LH, color, flat);
    }
    const f0 = 3.4 + 0.5 * k;
    const f1 = 10.6 - 0.5 * k;
    if (f1 - f0 > 0.05) add(f0, 6, z, f1 - f0, 4, LH, COL.wall, flat);
  }
  add(6.4, 5.4, RZ + 8 * LH, 1.2, 5.2, LH, COL.roofAlt);

  // 7. Ventana redonda del frontón.
  next();
  add(6.4, 5.8, RZ + 0.6, 1.2, 0.2, 1.2, COL.wood, flat);
  add(6.6, 5.72, RZ + 0.8, 0.8, 0.1, 0.8, COL.glass, { glow: true });

  // 8. Barandales y escalones de la terraza.
  next();
  const post = (x, y) => add(x, y, DZ, 0.22, 0.22, 1.1, COL.wood, flat);
  for (const x of [3.05, 3.85, 4.65, 5.45]) post(x, 4.05);
  for (const x of [8.35, 9.15, 9.95, 10.75]) post(x, 4.05);
  for (const y of [4.85, 5.65]) {
    post(3.05, y);
    post(10.75, y);
  }
  add(3, 4, DZ + 1.1, 2.7, 0.3, 0.2, COL.wood, flat);
  add(8.3, 4, DZ + 1.1, 2.7, 0.3, 0.2, COL.wood, flat);
  add(3, 4, DZ + 1.1, 0.3, 2, 0.2, COL.wood, flat);
  add(10.7, 4, DZ + 1.1, 0.3, 2, 0.2, COL.wood, flat);
  add(6, 3, BZ, 2, 1, 2 * PLATE, COL.woodDark, flat);
  add(6, 3, BZ + 2 * PLATE, 2, 1, 0.15, COL.wood, flat);
  add(6, 2, BZ, 2, 1, PLATE, COL.woodDark, flat);
  add(6, 2, BZ + PLATE, 2, 1, 0.15, COL.wood, flat);

  // 9. Palmeras.
  next();
  const palm = (x, y, n, lean) => {
    let px = x;
    let py = y;
    for (let i = 0; i < n; i++) {
      add(px, py, BZ + i * BRICK, 0.8, 0.8, BRICK, i % 2 ? COL.trunk : COL.trunkDark, flat);
      px += (lean[0] * i) / n;
      py += (lean[1] * i) / n;
    }
    const tz = BZ + n * BRICK;
    const cx = px + 0.4;
    const cy = py + 0.4;
    add(cx - 0.9, cy - 0.9, tz, 1.8, 1.8, PLATE, COL.leafDark, flat);
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [0.72, 0.72], [-0.72, 0.72], [0.72, -0.72], [-0.72, -0.72]];
    dirs.forEach(([dx, dy], k) => {
      const w = Math.abs(dy) < 0.1 ? 1.4 : Math.abs(dx) < 0.1 ? 0.8 : 1.0;
      const d = Math.abs(dx) < 0.1 ? 1.4 : Math.abs(dy) < 0.1 ? 0.8 : 1.0;
      for (let i = 0; i < 3; i++) {
        const r = 1.3 + i * 1.0;
        add(cx + dx * r - w / 2, cy + dy * r - d / 2, tz + 0.1 - i * 0.42, w, d, 0.22, (k + i) % 2 ? COL.leaf : COL.leafDark, flat);
      }
    });
  };
  palm(0.8, 8.6, 8, [-0.25, 0.1]);
  palm(1.2, 4.6, 6, [-0.3, -0.12]);
  palm(12.2, 8.4, 9, [0.25, 0.12]);
  palm(12.3, 5.2, 7, [0.32, -0.1]);

  // 10. Arbustos y piedritas.
  next();
  const bush = (x, y, s) => {
    add(x, y, BZ, 1.4 * s, 1.2 * s, 0.7 * s, COL.bush, flat);
    add(x + 0.3 * s, y + 0.2 * s, BZ + 0.7 * s, 0.9 * s, 0.8 * s, 0.5 * s, COL.bushLight, flat);
  };
  bush(1.6, 3.3, 1.1);
  bush(2.1, 6.4, 0.9);
  bush(11.1, 3.5, 1.0);
  bush(11.3, 6.6, 0.9);
  bush(1.5, 10.1, 1.0);
  for (const [x, y] of [[1.1, 2.7], [3.6, 3.2], [9.6, 2.9], [12.6, 3.4], [5.2, 2.9]]) add(x, y, BZ, 0.45, 0.45, 0.3, COL.pebble, flat);

  bricks.sort((a, b) => a.group - b.group || a.z - b.z || b.y - a.y || a.x - b.x);

  const pos = [];
  const nor = [];
  const quad = (a, b, c, d, n) => {
    for (const v of [a, b, c, a, c, d]) {
      pos.push(v[0], v[1], v[2]);
      nor.push(n[0], n[1], n[2]);
    }
  };
  const stud = (cx, cy, z) => {
    const r = 0.3;
    const h = 0.18;
    const n = 8;
    for (let k = 0; k < n; k++) {
      const a0 = (k / n) * Math.PI * 2;
      const a1 = ((k + 1) / n) * Math.PI * 2;
      const p0 = [cx + r * Math.cos(a0), cy + r * Math.sin(a0)];
      const p1 = [cx + r * Math.cos(a1), cy + r * Math.sin(a1)];
      const am = (a0 + a1) / 2;
      quad([p0[0], p0[1], z], [p1[0], p1[1], z], [p1[0], p1[1], z + h], [p0[0], p0[1], z + h], [Math.cos(am), Math.sin(am), 0]);
      for (const v of [[cx, cy, z + h], [p0[0], p0[1], z + h], [p1[0], p1[1], z + h]]) {
        pos.push(v[0], v[1], v[2]);
        nor.push(0, 0, 1);
      }
    }
  };
  const G = 0.03;
  let top = 0;
  const items = bricks.map((b) => {
    const start = pos.length / 3;
    const g = Math.min(G, b.w * 0.2, b.d * 0.2);
    const x0 = b.x + g;
    const x1 = b.x + b.w - g;
    const y0 = b.y + g;
    const y1 = b.y + b.d - g;
    const z0 = b.z;
    const z1 = b.z + b.h - Math.min(0.015, b.h * 0.1);
    quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1]);
    quad([x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x1, y0, z0], [0, 0, -1]);
    quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0]);
    quad([x1, y1, z0], [x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [0, 1, 0]);
    quad([x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1], [1, 0, 0]);
    quad([x0, y1, z0], [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [-1, 0, 0]);
    if (b.studs && b.w >= 1 && b.d >= 1) {
      for (let i = 0; i < Math.floor(b.w + 1e-6); i++) {
        for (let j = 0; j < Math.floor(b.d + 1e-6); j++) stud(b.x + i + 0.5, b.y + j + 0.5, z1);
      }
    }
    top = Math.max(top, b.z + b.h);
    return { start, count: pos.length / 3 - start, color: b.color, glow: b.glow, top: b.z + b.h };
  });
  return { pos, nor, items, top, cx: 7, cy: 6 };
}

/** Avión de ~1.1 unidades de largo, nariz hacia +x. */
function buildPlane() {
  const body = solid();
  body.box(-0.5, -0.075, -0.07, 0.42, 0.075, 0.08);
  body.box(0.42, -0.05, -0.045, 0.56, 0.05, 0.055);
  body.box(-0.08, -0.55, -0.012, 0.14, 0.55, 0.018);
  body.box(-0.5, -0.2, 0.0, -0.38, 0.2, 0.02);
  const fin = solid();
  fin.box(-0.52, -0.014, 0.06, -0.36, 0.014, 0.3);
  return { body, fin };
}

/* ---------- Geometría ---------- */

function buildGeometry(data) {
  const q = data.q;
  const pos = [];
  const nor = [];
  const line = [];
  const states = data.states.map((s) => {
    const top = [];
    const wall = [];
    const wallN = [];
    const lineStart = line.length / 3;
    for (const p of s.p) {
      const v = p.v;
      const n = v.length / 2;
      for (const i of p.t) top.push(v[i * 2] / q, v[i * 2 + 1] / q, 1);
      const starts = [0, ...p.h, n];
      for (let r = 0; r < starts.length - 1; r++) {
        const a0 = starts[r];
        const a1 = starts[r + 1];
        for (let k = a0; k < a1; k++) {
          const k2 = k + 1 < a1 ? k + 1 : a0;
          const ax = v[k * 2] / q;
          const ay = v[k * 2 + 1] / q;
          const bx = v[k2 * 2] / q;
          const by = v[k2 * 2 + 1] / q;
          let nx = by - ay;
          let ny = ax - bx;
          const L = Math.hypot(nx, ny) || 1;
          nx /= L;
          ny /= L;
          wall.push(ax, ay, 0, bx, by, 0, bx, by, 1, ax, ay, 0, bx, by, 1, ax, ay, 1);
          for (let j = 0; j < 6; j++) wallN.push(nx, ny, 0);
          line.push(ax, ay, 1, bx, by, 1);
        }
      }
    }
    const topStart = pos.length / 3;
    pos.push(...top);
    for (let i = 0; i < top.length / 3; i++) nor.push(0, 0, 1);
    pos.push(...wall);
    nor.push(...wallN);
    return {
      id: s.id,
      name: s.name,
      anchor: [s.c[0] / q, s.c[1] / q],
      topStart,
      topCount: top.length / 3,
      solidCount: (top.length + wall.length) / 3,
      lineStart,
      lineCount: line.length / 3 - lineStart,
    };
  });
  return { pos, nor, line, states, mapH: data.h };
}

const VS = `attribute vec3 aPos;attribute vec3 aNor;
uniform mat4 uProj;uniform mat4 uMV;uniform mat3 uNorm;uniform float uH;uniform float uZ0;uniform vec2 uOff;
varying vec3 vN;varying vec3 vP;
void main(){vec3 p=vec3(aPos.xy+uOff,uZ0+aPos.z*uH);vec4 w=uMV*vec4(p,1.0);vP=w.xyz;vN=uNorm*aNor;gl_Position=uProj*w;}`;

const FS = `precision mediump float;varying vec3 vN;varying vec3 vP;
uniform vec3 uColor;uniform vec3 uLight;uniform float uAmb;uniform float uKey;uniform float uSpec;uniform float uRim;
uniform float uFlat;uniform vec4 uFlatColor;
void main(){
vec3 n=normalize(vN);vec3 v=normalize(-vP);vec3 L=normalize(uLight);
float d=max(dot(n,L),0.0);
float s=pow(max(dot(n,normalize(L+v)),0.0),40.0)*uSpec;
float r=pow(1.0-clamp(dot(n,v),0.0,1.0),3.0)*uRim;
vec3 col=uColor*(uAmb+d*uKey)+vec3(s+r);
gl_FragColor=mix(vec4(col,1.0),uFlatColor,uFlat);}`;

/**
 * @param {object} o
 * @param {HTMLCanvasElement} o.canvas  lienzo que llena `stage`
 * @param {HTMLElement} o.section       sección alta (scroll)
 * @param {object} o.data               contenido de mexico-states.json
 * @param {() => boolean} o.isDark
 * @param {{el: HTMLElement | null, at: [number, number]}[]} [o.captions]  textos de la narración, visibles en su tramo de scroll
 * @param {HTMLElement | null} [o.tooltip]     etiqueta flotante para el estado bajo el cursor
 * @param {HTMLElement | null} [o.hint]        texto de ayuda: aparece con el último estado destacado
 * @param {{id: string, tone: 'ink'|'accent', at: number, el?: HTMLElement | null, place?: string}[]} [o.highlights]
 * @param {{home: string, from?: string, dest: string}} [o.journey]  estado de origen, lugar de la casa y destino del avión (claves de data.places)
 * @param {boolean} [o.reducedMotion]  true si el visitante pidió reducir movimiento
 */
export function mountMexico({ canvas, section, data, isDark, captions = [], tooltip, hint, highlights = [], journey = null, reducedMotion = false }) {
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
  const u = {};
  for (const name of ['uProj', 'uMV', 'uNorm', 'uH', 'uZ0', 'uOff', 'uColor', 'uLight', 'uAmb', 'uKey', 'uSpec', 'uRim', 'uFlat', 'uFlatColor']) {
    u[name] = gl.getUniformLocation(prog, name);
  }

  const geo = buildGeometry(data);
  const buffer = (arr) => {
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arr), gl.STATIC_DRAW);
    return b;
  };
  const posBuf = buffer(geo.pos);
  const norBuf = buffer(geo.nor);
  const lineBuf = buffer(geo.line);
  const states = geo.states;
  const byKey = new Map();
  states.forEach((s, i) => {
    byKey.set(s.id, i);
    byKey.set(s.name, i);
  });

  const extra = new Float32Array(states.length);
  const pinned = new Uint8Array(states.length);
  const manual = new Map();
  let marks = [];
  let W = 1;
  let H = 1;
  let raf = 0;
  let alive = true;
  let last = performance.now();
  let pointer = null;
  let hovered = -1;
  let pick = null;

  function setHighlights(list) {
    marks = (list || [])
      .map((h) => ({ ...h, index: byKey.has(h.id) ? byKey.get(h.id) : -1 }))
      .filter((h) => h.index >= 0);
    kick();
  }
  setHighlights(highlights);

  const part = (s) => ({ pos: buffer(s.pos), nor: buffer(s.nor), count: s.pos.length / 3 });
  const dioGeo = buildDiorama();
  const diorama = { pos: buffer(dioGeo.pos), nor: buffer(dioGeo.nor), items: dioGeo.items, cx: dioGeo.cx, cy: dioGeo.cy };
  const HOUSE_LIFT = dioGeo.top * STUD;
  const planeGeo = buildPlane();
  const plane = { body: part(planeGeo.body), fin: part(planeGeo.fin) };
  const TRAIL = 64;
  const trailBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, trailBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(TRAIL * 3), gl.DYNAMIC_DRAW);
  const places = {};
  for (const [k, v] of Object.entries(data.places || {})) places[k] = [v[0] / data.q, v[1] / data.q];
  const homeIndex = journey && byKey.has(journey.home) ? byKey.get(journey.home) : -1;
  const homeAt = journey && journey.from && places[journey.from] ? places[journey.from] : null;
  const dest = journey && places[journey.dest] ? places[journey.dest] : null;
  let ts = null;

  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.clearColor(0, 0, 0, 0);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  function measure() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
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

  function progress() {
    if (reducedMotion) return 1;
    const r = section.getBoundingClientRect();
    return clamp01((window.innerHeight - r.top) / Math.max(section.offsetHeight, 1));
  }

  function visible() {
    const r = section.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight;
  }

  function bindSolid() {
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aNor);
    gl.bindBuffer(gl.ARRAY_BUFFER, norBuf);
    gl.vertexAttribPointer(aNor, 3, gl.FLOAT, false, 0, 0);
  }

  function bindLines() {
    gl.bindBuffer(gl.ARRAY_BUFFER, lineBuf);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
    gl.disableVertexAttribArray(aNor);
    gl.vertexAttrib3f(aNor, 0, 0, 1);
  }

  function drawPart(p, color, M, Rn, MV, R) {
    gl.bindBuffer(gl.ARRAY_BUFFER, p.pos);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aNor);
    gl.bindBuffer(gl.ARRAY_BUFFER, p.nor);
    gl.vertexAttribPointer(aNor, 3, gl.FLOAT, false, 0, 0);
    gl.uniformMatrix4fv(u.uMV, false, mul(MV, M));
    gl.uniformMatrix3fv(u.uNorm, false, rot3(mul(R, Rn)));
    gl.uniform3fv(u.uColor, color);
    gl.drawArrays(gl.TRIANGLES, 0, p.count);
  }

  function render(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const time = reducedMotion ? 0 : now / 1000;
    const tone = isDark() ? TONES.dark : TONES.light;
    const raw = progress();
    ts = ts === null || reducedMotion ? raw : ts + (raw - ts) * Math.min(1, dt * 6);
    const t = ts;
    const seg = (a, b) => smooth(clamp01((t - a) / (b - a)));

    // Alturas: destacados ligados al scroll; hover y clic animados.
    const amount = new Float32Array(states.length);
    const toneOf = new Array(states.length);
    for (const m of marks) {
      amount[m.index] = Math.max(amount[m.index], smooth(clamp01((t - m.at) / 0.08)));
      toneOf[m.index] = m.tone;
    }
    const heights = states.map((s, i) => {
      const target = (i === hovered ? HOVER_H : 0) + (pinned[i] ? PIN_H : 0);
      extra[i] += (target - extra[i]) * Math.min(1, dt * 9);
      const m = manual.has(i) ? manual.get(i) : 0;
      return BASE_H + amount[i] * RAISE_H + extra[i] + m;
    });

    // Recorrido: casa en el estado de origen, avión hacia el destino.
    const home = homeIndex >= 0 ? homeAt || states[homeIndex].anchor : null;
    const homeH = homeIndex >= 0 ? heights[homeIndex] : 0;
    const destIndex = dest ? marks.find((m) => m.place === journey.dest)?.index ?? -1 : -1;
    const destH = destIndex >= 0 ? heights[destIndex] : BASE_H;
    const fly = seg(TL.fly[0], TL.fly[1]);
    let planePos = null;
    let heading = 0;
    let pitch = 0;
    if (home && dest) {
      const dx = dest[0] - home[0];
      const dy = dest[1] - home[1];
      heading = Math.atan2(dy, dx);
      const lift = HOUSE_LIFT;
      const alt = (s) => lerp(homeH + lift, destH + 0.012, s) + FLIGHT_ALT * Math.sin(Math.PI * s);
      planePos = [home[0] + dx * fly, home[1] + dy * fly, alt(fly)];
      const e = 0.01;
      pitch = Math.atan2(alt(Math.min(1, fly + e)) - alt(Math.max(0, fly - e)), Math.hypot(dx, dy) * 2 * e);
    }

    // Cámara por fases (distancia interpolada en escala logarítmica).
    const FAR = { cx: 0, cy: 0, cz: 0, d: 10, tilt: 0, yaw: 0.55 };
    const MEX = { cx: 0, cy: 0, cz: 0, d: 1, tilt: FINAL_TILT, yaw: -0.08 };
    const mixCam = (a, b, k) => ({
      cx: lerp(a.cx, b.cx, k), cy: lerp(a.cy, b.cy, k), cz: lerp(a.cz, b.cz, k), d: Math.exp(lerp(Math.log(a.d), Math.log(b.d), k)),
      tilt: lerp(a.tilt, b.tilt, k), yaw: lerp(a.yaw, b.yaw, k),
    });
    const k1 = seg(TL.mexico[0], TL.mexico[1]);
    let cam = mixCam(FAR, MEX, k1);
    if (home && dest && !reducedMotion) {
      // Acercamiento a la casa; mientras se arma, la cámara la rodea despacio.
      const bp = smooth(clamp01((t - TL.build[0]) / (TL.build[1] - TL.build[0])));
      const near = { cx: home[0], cy: home[1], cz: homeH + 0.018, d: lerp(0.12, 0.1, bp), tilt: lerp(1.05, 0.98, bp), yaw: lerp(0.7, 0.25, bp) };
      cam = mixCam(cam, near, seg(TL.home[0], TL.home[1]));
      const lead = 0.06;
      const follow = {
        cx: planePos[0] + Math.cos(heading) * lead, cy: planePos[1] + Math.sin(heading) * lead, cz: planePos[2] * 0.7,
        d: 0.42 + 0.12 * Math.sin(Math.PI * fly), tilt: 0.92, yaw: Math.atan2(-(dest[1] - home[1]), dest[0] - home[0]),
      };
      cam = mixCam(cam, follow, seg(TL.out[0], TL.out[1]));
      cam = mixCam(cam, MEX, seg(TL.final[0], TL.final[1]));
    }
    cam.yaw += Math.sin(time * 0.2) * 0.012 * k1;

    const aspect = W / H;
    const tanH = Math.tan(FOV / 2);
    const fit = Math.max(1 / (0.7 * tanH * aspect), (geo.mapH * 0.5 * Math.cos(FINAL_TILT) + 0.22) / (0.4 * tanH));
    const dist = fit * cam.d;
    // En los acercamientos el foco baja más para dejar aire a la etiqueta.
    const close = clamp01((1 - cam.d) / 0.6);
    const ty = -dist * tanH * lerp(0.3, 0.12, close);
    const R = mul(rot('x', -cam.tilt), rot('z', cam.yaw));
    const MV = mul(R, translation(-cam.cx, -cam.cy, -cam.cz));
    MV[13] += ty;
    // Con la narración a la izquierda (pantallas anchas), el sujeto se recorre a la derecha.
    const side = W >= 768 && aspect > 1.1 ? 1 : 0;
    const focus = home && dest && !reducedMotion ? seg(TL.home[0], TL.home[1]) * (1 - seg(TL.final[0], TL.final[1])) : 0;
    MV[12] += dist * tanH * aspect * 0.28 * side * focus;
    MV[14] -= dist;
    const N3 = rot3(R);
    const P = perspective(FOV, aspect, Math.max(0.02, dist * 0.1), dist * 4 + 10);

    gl.uniformMatrix4fv(u.uProj, false, P);
    gl.uniformMatrix4fv(u.uMV, false, MV);
    gl.uniformMatrix3fv(u.uNorm, false, N3);
    gl.uniform3f(u.uLight, -0.35, 0.8, 0.5);
    gl.uniform1f(u.uAmb, tone.amb);
    gl.uniform1f(u.uKey, tone.key);
    gl.uniform1f(u.uSpec, tone.spec);
    gl.uniform1f(u.uRim, tone.rim);

    // Selección por color (estado bajo el cursor).
    if (pointer && k1 > 0.6) {
      const pk = ensurePick();
      gl.bindFramebuffer(gl.FRAMEBUFFER, pk.fb);
      gl.viewport(0, 0, pk.w, pk.h);
      gl.disable(gl.BLEND);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniform1f(u.uFlat, 1);
      gl.uniform2f(u.uOff, 0, 0);
      gl.uniform1f(u.uZ0, 0);
      bindSolid();
      states.forEach((s, i) => {
        gl.uniform4f(u.uFlatColor, (i + 1) / 255, 0, 0, 1);
        gl.uniform1f(u.uH, heights[i]);
        gl.drawArrays(gl.TRIANGLES, s.topStart, s.solidCount);
      });
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
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    bindSolid();

    if (tone.shadow > 0) {
      gl.enable(gl.BLEND);
      gl.disable(gl.DEPTH_TEST);
      gl.uniform1f(u.uFlat, 1);
      gl.uniform4f(u.uFlatColor, 0, 0, 0, tone.shadow * k1);
      gl.uniform1f(u.uH, 0);
      gl.uniform1f(u.uZ0, 0);
      for (let j = 0; j < 6; j++) {
        const k = 0.012 + j * 0.007;
        gl.uniform2f(u.uOff, k * 0.7, -k);
        states.forEach((s) => gl.drawArrays(gl.TRIANGLES, s.topStart, s.topCount));
      }
      gl.disable(gl.BLEND);
      gl.enable(gl.DEPTH_TEST);
    }

    gl.uniform1f(u.uFlat, 0);
    gl.uniform2f(u.uOff, 0, 0);
    gl.uniform1f(u.uZ0, 0);
    states.forEach((s, i) => {
      let c = i === hovered || pinned[i] ? tone.hover : tone.top;
      if (amount[i] > 0) c = mix3(c, tone[toneOf[i]] || tone.accent, amount[i]);
      gl.uniform3fv(u.uColor, c);
      gl.uniform1f(u.uH, heights[i]);
      gl.drawArrays(gl.TRIANGLES, s.topStart, s.solidCount);
    });

    bindLines();
    gl.uniform1f(u.uFlat, 1);
    gl.uniform4f(u.uFlatColor, tone.line[0], tone.line[1], tone.line[2], 1);
    gl.uniform1f(u.uZ0, 0.0015);
    states.forEach((s, i) => {
      gl.uniform1f(u.uH, heights[i]);
      gl.drawArrays(gl.LINES, s.lineStart, s.lineCount);
    });

    // Objetos: matrices propias, sin extrusión.
    gl.uniform1f(u.uH, 1);
    gl.uniform1f(u.uZ0, 0);
    gl.uniform1f(u.uFlat, 0);

    // Casa de playa: se arma pieza por pieza con el scroll; cada bloque cae y encaja.
    let houseTop = 0;
    if (home) {
      const b = reducedMotion ? 1 : clamp01((t - TL.build[0]) / (TL.build[1] - TL.build[0]));
      if (b > 0) {
        const items = diorama.items;
        const n = items.length;
        const dur = 0.06;
        const Rh = rot('z', HOUSE_YAW);
        const M = mul(mul(mul(translation(home[0], home[1], homeH), Rh), scaling(STUD, STUD, STUD)), translation(-diorama.cx, -diorama.cy, 0));
        gl.bindBuffer(gl.ARRAY_BUFFER, diorama.pos);
        gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aNor);
        gl.bindBuffer(gl.ARRAY_BUFFER, diorama.nor);
        gl.vertexAttribPointer(aNor, 3, gl.FLOAT, false, 0, 0);
        gl.uniformMatrix4fv(u.uMV, false, mul(MV, M));
        gl.uniformMatrix3fv(u.uNorm, false, rot3(mul(R, Rh)));
        let placed = 0;
        for (let i = 0; i < n; i++) {
          const p = (b - (i / n) * (1 - dur)) / dur;
          if (p <= 0) break;
          const it = items[i];
          const q = clamp01(p);
          if (q >= 1) placed = Math.max(placed, it.top);
          gl.uniform1f(u.uZ0, q < 1 ? DROP * Math.pow(1 - q, 3) : 0);
          if (it.glow) {
            gl.uniform1f(u.uFlat, 1);
            gl.uniform4f(u.uFlatColor, it.color[0], it.color[1], it.color[2], 1);
          } else {
            gl.uniform1f(u.uFlat, 0);
            gl.uniform3fv(u.uColor, it.color);
          }
          gl.drawArrays(gl.TRIANGLES, it.start, it.count);
        }
        gl.uniform1f(u.uZ0, 0);
        gl.uniform1f(u.uFlat, 0);
        houseTop = homeH + placed * STUD;
      }
    }

    // Ruta y avión.
    if (planePos) {
      const shown = fly > 0 || t >= TL.fly[0] - 0.04;
      if (shown) {
        const n = Math.max(2, Math.round(TRAIL * Math.max(fly, 0.001)));
        const arr = new Float32Array(TRAIL * 3);
        const dx = dest[0] - home[0];
        const dy = dest[1] - home[1];
        const lift = HOUSE_LIFT;
        for (let i = 0; i < n; i++) {
          const s = (i / (n - 1)) * fly;
          arr[i * 3] = home[0] + dx * s;
          arr[i * 3 + 1] = home[1] + dy * s;
          arr[i * 3 + 2] = lerp(homeH + lift, destH + 0.012, s) + FLIGHT_ALT * Math.sin(Math.PI * s);
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, trailBuf);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, arr);
        gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
        gl.disableVertexAttribArray(aNor);
        gl.vertexAttrib3f(aNor, 0, 0, 1);
        gl.uniformMatrix4fv(u.uMV, false, MV);
        gl.uniform1f(u.uFlat, 1);
        gl.uniform4f(u.uFlatColor, tone.accent[0], tone.accent[1], tone.accent[2], 1);
        if (fly > 0) gl.drawArrays(gl.LINE_STRIP, 0, n);
        gl.uniform1f(u.uFlat, 0);
      }
      const appear = seg(TL.fly[0] - 0.04, TL.fly[0]);
      const vanish = 1 - seg(TL.fly[1] - 0.01, TL.fly[1] + 0.03);
      const sc = PLANE_SIZE * appear * vanish;
      if (sc > 0.0001) {
        const bank = Math.sin(time * 1.4) * 0.08 * Math.sin(Math.PI * fly);
        const Rp = mul(mul(rot('z', heading), rotY(-pitch)), rot('x', bank));
        const M = mul(mul(translation(planePos[0], planePos[1], planePos[2] + (1 - appear) * 0.02), Rp), scaling(sc, sc, sc));
        drawPart(plane.body, tone.objBody, M, Rp, MV, R);
        drawPart(plane.fin, tone.accent, M, Rp, MV, R);
      }
    }

    // Capas HTML: lienzo, título, etiquetas, ayuda y tooltip.
    canvas.style.opacity = String(smooth(clamp01((t - 0.02) / 0.1)));
    for (const c of captions) {
      if (!c.el) continue;
      const fin = seg(c.at[0], c.at[0] + 0.025);
      const fout = c.at[1] >= 1 ? 0 : seg(c.at[1] - 0.025, c.at[1]);
      const a = fin * (1 - fout);
      c.el.style.opacity = String(a);
      c.el.style.transform = `translateY(${((1 - fin) * 16 - fout * 16).toFixed(1)}px)`;
      c.el.style.visibility = a > 0.001 ? 'visible' : 'hidden';
    }
    const project = (x, y, h) => {
      const v = transform(MV, x, y, h);
      const c = transform(P, v[0], v[1], v[2]);
      return [(c[0] / c[3] * 0.5 + 0.5) * W, (0.5 - (c[1] / c[3]) * 0.5) * H];
    };
    let lastAmount = 0;
    for (const m of marks) {
      const a = amount[m.index];
      lastAmount = a;
      if (!m.el) continue;
      const s = states[m.index];
      let at = s.anchor;
      let h = heights[m.index];
      if (m.index === homeIndex && houseTop) h = houseTop;
      if (m.place && places[m.place]) at = places[m.place];
      const [x, y] = project(at[0], at[1], h);
      m.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      m.el.style.opacity = String(a);
    }
    if (hint) hint.style.opacity = String(lastAmount);
    if (tooltip) {
      const show = hovered >= 0 && !marks.some((m) => m.index === hovered && m.el);
      if (show && pointer) {
        tooltip.textContent = states[hovered].name;
        tooltip.style.transform = `translate(${(pointer.x + 14).toFixed(0)}px, ${(pointer.y + 18).toFixed(0)}px)`;
      }
      tooltip.style.opacity = show ? '1' : '0';
    }
  }

  function frame(now) {
    raf = 0;
    if (!alive) return;
    const on = visible();
    if (on) render(now);
    if (on && !document.hidden) raf = requestAnimationFrame(frame);
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
  };
  const onClick = () => {
    if (hovered >= 0) pinned[hovered] = pinned[hovered] ? 0 : 1;
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
    /** Altura extra (unidades del mapa; el ancho de México = 2) para un estado, por id ISO o nombre. */
    setHeight(key, value) {
      if (!byKey.has(key)) return;
      manual.set(byKey.get(key), value);
      kick();
    },
    setHighlights,
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
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('click', onClick);
      const lose = gl.getExtension('WEBGL_lose_context');
      if (lose) lose.loseContext();
    },
  };
}
