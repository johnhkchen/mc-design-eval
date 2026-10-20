// The metal forms (owner's v3 comment: sheets, not inflated volumes). Each mass is a low enclosed body (its walls in
// the mass's colour, a flat, gently curved grey roof at `roof`) and, standing proud of it, tall curved SHEETS of the
// same colour that rise from the ground along an arc of its wall and peel over at the top like a breaking wave (a
// curl that overhangs the side it rolls toward). Overlapping masses merge; a crease line runs where two colours meet;
// dark tinted-glass slots stand in the walls where a sheet ends. Cladding: one main block per colour with a second tone in horizontal seam
// courses every 4 blocks (no random dithering). The parts write the cells of their own masses: writeForms(g, names).
import { inFootprint } from "../vocab/base.mjs";

const [W, H, D] = [102, 47, 153];
const idx = (x, y, z) => (y * D + z) * W + x;

// name, base centre and radii, height on the high side / low side, high-side direction, lean at the top (blocks),
// bulge (section growth at the shoulder), crumple phase, a diagonal fold (angle at the base -> at the top, radians)
// roof = the grey roof over the body; sheets: arc a0..a1 (radians, atan2 of south over east), top = the sheet's
// highest cell, lean = outward lean at the top (blocks, negative leans in), curl = the lip's radius (positive rolls
// out, negative rolls in over the roof), ridge = sharp zig-zag peaks along the top edge (the crumpled silver)
export const MASSES = [
  { name: "purple", c: [74, 31], r: [19, 30], roof: 26, hi: 44, lean: [-1, -1], bulge: 0.04, ph: 0.3,
    fold: [Math.PI, Math.PI * 0.8], clad: ["purple_concrete", "purple_terracotta"],
    sheets: [{ a0: -2.9, a1: -0.5, top: 44, lean: 0.5, curl: -4 }, { a0: -0.3, a1: 1.2, top: 40, lean: 0.5, curl: -4 },
      { a0: 1.4, a1: 2.6, top: 34, lean: 0, curl: -3 }] },
  { name: "silverA", c: [23, 45], r: [21, 20], roof: 28, hi: 40, lean: [-1, -1], bulge: 0.05, ph: 1.1,
    fold: [Math.PI * 0.95, Math.PI * 0.7], clad: ["light_gray_concrete", "iron_block"], seam: 3,
    sheets: [{ a0: 2.0, a1: 3.0, top: 36, lean: 2, curl: 3 }, { a0: 3.2, a1: 4.3, top: 38, lean: 1, curl: 3 },
      { a0: -1.6, a1: -0.4, top: 40, lean: 0, curl: -3, ridge: 5 }, { a0: -0.2, a1: 1.2, top: 34, lean: 0, curl: -2, ridge: 4 }] },
  { name: "hood", c: [27, 28], r: [16, 8], roof: 14, hi: 32, lean: [0, -2], bulge: 0.1, ph: 2.0,
    fold: null, clad: ["light_gray_concrete", "iron_block"], seam: 3,
    sheets: [{ a0: -2.8, a1: -1.6, top: 31, lean: 2, curl: 4, ridge: 3 }, { a0: -1.4, a1: -0.3, top: 27, lean: 1, curl: 3, ridge: 3 }] },
  { name: "blue", c: [75, 85], r: [21, 24], roof: 24, hi: 38, lean: [1, 0], bulge: 0.04, ph: 0.7,
    fold: [Math.PI * 0.1, Math.PI * 0.35], clad: ["light_blue_concrete", "cyan_terracotta"],
    sheets: [{ a0: -1.5, a1: 0.2, top: 39, lean: 0.5, curl: -4 }, { a0: 0.4, a1: 1.5, top: 36, lean: 0.5, curl: -4 },
      { a0: 1.7, a1: 2.8, top: 31, lean: 0, curl: -3 }] },
  { name: "red", c: [24, 75], r: [16, 15], roof: 18, hi: 28, lean: [1, 0], bulge: 0.04, ph: 2.6,
    fold: [Math.PI * 0.9, Math.PI * 1.15], clad: ["red_concrete", "red_terracotta"],
    sheets: [{ a0: 1.5, a1: 2.6, top: 28, lean: 3, curl: 3 }, { a0: 2.8, a1: 3.9, top: 25, lean: 3, curl: 2 },
      { a0: -1.4, a1: -0.2, top: 24, lean: 2, curl: 2 }] },
  { name: "gold", c: [26, 107], r: [18, 22], roof: 18, hi: 32, lean: [0, -1], bulge: 0.05, ph: 1.7,
    fold: [Math.PI * 0.95, Math.PI * 1.2], clad: ["yellow_concrete", "gold_block"],
    sheets: [{ a0: 2.0, a1: 2.9, top: 32, lean: 3, curl: 3 }, { a0: 3.1, a1: 4.1, top: 30, lean: 3, curl: 3 },
      { a0: -2.0, a1: -0.9, top: 27, lean: 3, curl: 3 }, { a0: 0.2, a1: 1.3, top: 24, lean: 2, curl: 2 }] },
  { name: "magenta", c: [70, 126], r: [19, 20], roof: 17, hi: 26, lean: [-1, 0], bulge: 0.04, ph: 0.9,
    fold: [Math.PI * 0.5, Math.PI * 0.3], clad: ["magenta_concrete", "magenta_terracotta"],
    sheets: [{ a0: -0.9, a1: 0.4, top: 26, lean: 2, curl: 3 }, { a0: 0.6, a1: 1.7, top: 24, lean: 2, curl: 3 },
      { a0: 2.4, a1: 3.6, top: 22, lean: 1, curl: -2 }, { a0: -2.3, a1: -1.2, top: 21, lean: 0, curl: -2 }] },
  { name: "silverB", c: [29, 139], r: [15, 12], roof: 16, hi: 22, lean: [1, 0], bulge: 0.04, ph: 2.3,
    fold: null, clad: ["light_gray_concrete", "iron_block"], seam: 3,
    sheets: [{ a0: -0.4, a1: 1.0, top: 22, lean: 0, curl: -2, ridge: 3 }, { a0: 1.2, a1: 2.4, top: 20, lean: 1, curl: 2, ridge: 3 }] },
  // the blue bridge over the monorail: over the street (x 43..51) it only starts at the soffit, y 18
  { name: "bridge", c: [47, 78], r: [15, 13], roof: 30, hi: 33, lean: [0, 0], bulge: 0.04, ph: 1.4, over: 18,
    fold: null, clad: ["light_blue_concrete", "cyan_terracotta"], sheets: [] },
];
const CREASE = "gray_concrete";   // where two masses meet
const ROOF = "polished_andesite";  // the low grey roofs between and behind the sheets
const SLOT = "tinted_glass";       // dark slots in the walls where a sheet ends

// Cells no form fills: the monorail street, the entrance landing in front of L1, the door fronts of D7
const blocked = (x, y, z, m = {}) => (x >= 43 && x <= 51 && !(m.over && y >= m.over)) || !inFootprint(x, z)
  || (x >= 26 && x <= 42 && z <= 21 && y <= 7) || (x <= 8 && z >= 72 && z <= 75 && y <= 3);
// D7, the red's west garden door (x 9, z 73..74): its cells stay open for the door
const isD7 = (x, y, z) => x === 9 && z >= 73 && z <= 74 && y <= 2;
// Lobby boxes (y1..7): count as inside (the forms open into them) but are never written
const LOBBIES = [[26, 22, 42, 36], [36, 56, 42, 94], [52, 22, 56, 60], [40, 110, 42, 148], [52, 108, 54, 142]];
const inLobby = (x, y, z) => y >= 1 && y <= 7 && LOBBIES.some(([a, b, c, d]) => x >= a && x <= c && z >= b && z <= d);

// The section of mass m at height y: normalised radius d (1 = the wall), angle th, and the local radius in blocks.
// It leans and bulges a little with height, wobbles (the crumple) and pinches into the folds.
function shape(m, x, y, z) {
  const t = Math.min(1, (y - 1) / m.hi);
  const f = 1 + m.bulge * Math.sin(Math.PI * Math.min(1, t * 1.25)) ** 2;
  const lx = m.c[0] + 1.5 * m.lean[0] * t * t, lz = m.c[1] + 1.5 * m.lean[1] * t * t;
  const u = (x - lx) / (m.r[0] * f), v = (z - lz) / (m.r[1] * f);
  const th = Math.atan2(v, u);
  const d0 = Math.hypot(u, v);
  let d = d0 * (1 + 0.06 * Math.sin(2 * th + 0.14 * y + m.ph) + 0.035 * Math.sin(5 * th - 0.11 * y + 2 * m.ph));
  const folds = m.fold ? [m.fold, [m.fold[0] + 2.4, m.fold[0] + 2.4 - (m.fold[1] - m.fold[0]) * 1.5]] : [[m.ph + 1, m.ph + 1.5]];
  const R = Math.min(m.r[0], m.r[1]) * f;
  for (const fl of folds) {
    const tf = fl[0] + (fl[1] - fl[0]) * t;
    let dth = Math.abs(th - tf) % (2 * Math.PI); if (dth > Math.PI) dth = 2 * Math.PI - dth;
    d += (2.2 / R) * Math.exp(-(((dth * R) / 1.6) ** 2));
  }
  const rl = d0 > 1e-6 ? Math.hypot(x - lx, z - lz) / d : R;   // blocks per unit of d along this direction
  return { d, th, rl, lx, lz };
}

// The body: inside the wall, under a flat, gently curved grey roof (1.5 higher at the middle than at the eaves)
function inMass(m, x, y, z) {
  const { d } = shape(m, x, y, z);
  return d <= 1 && y <= m.roof + 1.5 * (1 - d * d);
}

// A sheet's top along its arc (high in the middle, falling into the roof at both ends, with zig-zag ridges)
function sheetTop(m, sh, th) {
  let a = th; while (a < sh.a0) a += 2 * Math.PI;
  if (a > sh.a1) return null;
  const k = (a - sh.a0) / (sh.a1 - sh.a0);
  const R = Math.min(m.r[0], m.r[1]);
  const tri = sh.ridge ? sh.ridge * (Math.abs(((a * R / 5) % 2 + 2) % 2 - 1) - 0.5) : 0;
  return { k, H: m.roof + (sh.top - m.roof) * Math.sin(Math.PI * k) ** 0.35 + tri };
}

// Is (x, y, z) in one of mass m's sheets? The sheet stands on the wall line (leaning out by sh.lean * s^2 blocks at
// the top), then its lip rolls through a circle of radius |curl| toward the side it curls to and hangs down past it.
function inSheet(m, x, y, z) {
  if (!m.sheets.length) return false;
  const { d, th, rl, lx, lz } = shape(m, x, y, z);
  const e = (d - 1) * rl;                                   // blocks outside the wall line
  const rr = Math.hypot(x - lx, z - lz) || 1, ux = (x - lx) / rr, uz = (z - lz) / rr;
  for (const sh of m.sheets) {
    const st = sheetTop(m, sh, th);
    if (!st) continue;
    const H = Math.min(st.H, 45);
    const C = Math.min(Math.abs(sh.curl), Math.max(0, (H - m.roof - 1) / 1.6));
    let lean = sh.lean, sign = Math.sign(sh.curl) || 1;
    // an outward sheet whose lip would leave the footprint (or cross the street) stands straight and rolls in instead
    if (lean > 0 || sign > 0) {
      const reach = Math.max(0, lean) + (sign > 0 ? 2 * C : 0) + 1 - e;
      const px = Math.round(x + ux * reach), pz = Math.round(z + uz * reach);
      if (!inFootprint(px, pz) || (px >= 43 && px <= 51 && !m.over)) { lean = 0; sign = -1; }
    }
    const Hw = H - C;
    if (y > H + 0.5) continue;
    const s = Math.max(0, Math.min(1, (y - 1) / Math.max(1, Hw - 1)));
    if (y <= Hw && Math.abs(e - lean * s * s) <= 0.85) return true;
    if (C >= 1 && y >= Hw - 1) {
      const o = (e - lean) * sign, dy = y - Hw;
      const phi = Math.atan2(dy, C - o);
      if (Math.abs(Math.hypot(o - C, dy) - C) <= 0.85 && phi >= -0.2 && phi <= 2.7) return true;
    }
  }
  return false;
}

// Near the end of a sheet (within a block of its arc end): the wall there gets a dark slot
function atSheetEnd(m, x, y, z) {
  const { th, rl } = shape(m, x, y, z);
  return m.sheets.some((sh) => [sh.a0, sh.a1].some((a) => {
    let dth = Math.abs(th - a) % (2 * Math.PI); if (dth > Math.PI) dth = 2 * Math.PI - dth;
    return dth * rl <= 0.8;
  }));
}

let FIELD = null;
// owner[i] = 1 + mass index of the first mass whose body holds the cell (0 = outside); lobby cells count as inside,
// unowned (-1). sheet[i] = 1 + mass index of the sheet in the cell (outside every body, or on a body's skin).
function field() {
  if (FIELD) return FIELD;
  const owner = new Int8Array(W * H * D), sheet = new Int8Array(W * H * D);
  const box = (m, fn) => {
    const ex = Math.max(m.r[0], m.r[1]) * (1 + m.bulge) + 10;
    for (let x = Math.max(0, Math.floor(m.c[0] - ex)); x <= Math.min(W - 1, Math.ceil(m.c[0] + ex)); x++)
      for (let z = Math.max(0, Math.floor(m.c[1] - ex)); z <= Math.min(D - 1, Math.ceil(m.c[1] + ex)); z++)
        for (let y = 1; y <= H - 2; y++) fn(x, y, z);
  };
  MASSES.forEach((m, mi) => box(m, (x, y, z) => {
    const i = idx(x, y, z);
    if (y > m.roof + 2 || owner[i] || blocked(x, y, z, m)) return;
    if (inMass(m, x, y, z)) owner[i] = mi + 1;
  }));
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) for (let y = 1; y <= 7; y++)
    if ((inLobby(x, y, z) || isD7(x, y, z)) && !blocked(x, y, z)) owner[idx(x, y, z)] = -1;
  const inside = (x, y, z) => x >= 0 && y >= 1 && z >= 0 && x < W && y < H && z < D && owner[idx(x, y, z)] !== 0;
  // faces and edges (18 neighbours): a skin stepping diagonally stays face-connected, never a dangling cell
  const N6 = [];
  for (const dx of [-1, 0, 1]) for (const dy of [-1, 0, 1]) for (const dz of [-1, 0, 1]) {
    const n = Math.abs(dx) + Math.abs(dy) + Math.abs(dz);
    if (n === 1 || n === 2) N6.push([dx, dy, dz]);
  }
  const skin = new Uint8Array(W * H * D);
  for (let y = 1; y < H; y++) for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    const o = owner[idx(x, y, z)];
    if (o <= 0) continue;
    if (N6.some(([dx, dy, dz]) => (y + dy) >= 1 && !inside(x + dx, y + dy, z + dz))) skin[idx(x, y, z)] = 1;
  }
  // the sheets: in the open air outside every body (or on a body's own skin), first mass first (later ones tuck behind)
  MASSES.forEach((m, mi) => box(m, (x, y, z) => {
    const i = idx(x, y, z);
    if (sheet[i] || blocked(x, y, z, m) || y > 45) return;
    if (owner[i] === -1 || (owner[i] > 0 && !skin[i])) return;
    if (owner[i] > 0 && owner[i] !== mi + 1) return;
    if (inSheet(m, x, y, z)) sheet[i] = mi + 1;
  }));
  // drop sheet cells not joined (by faces) to the ground through skin or sheet: no floating lips
  const solid = (i) => skin[i] || sheet[i];
  const seen = new Uint8Array(W * H * D), q = [];
  for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) { const i = idx(x, 1, z); if (solid(i)) { seen[i] = 1; q.push(i); } }
  while (q.length) {
    const i = q.pop(), x = i % W, z = Math.floor(i / W) % D, y = Math.floor(i / (W * D));
    for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
      const X = x + dx, Y = y + dy, Z = z + dz;
      if (X < 0 || Y < 1 || Z < 0 || X >= W || Y >= H || Z >= D) continue;
      const j = idx(X, Y, Z);
      if (!seen[j] && solid(j)) { seen[j] = 1; q.push(j); }
    }
  }
  for (let i = 0; i < sheet.length; i++) if (sheet[i] && !seen[i]) sheet[i] = 0;
  FIELD = { owner, skin, sheet, inside };
  return FIELD;
}

/** True for a cell inside the forms that is not their skin (floors are clipped to it). */
export function formInterior(x, y, z) {
  const { owner, skin } = field();
  if (x < 0 || z < 0 || y < 1 || x >= W || y >= H || z >= D) return false;
  const i = idx(x, y, z);
  return owner[i] > 0 && !skin[i];
}

/** Write the named masses: the body's walls (main block, a seam course every 4th y, a crease where another colour
 *  meets it, a dark slot where a sheet ends), its grey roof, and its sheets in the same cladding. */
export function writeForms(g, names) {
  const { owner, skin, sheet } = field();
  const want = new Set(names.map((n) => MASSES.findIndex((m) => m.name === n) + 1));
  const N = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  const at = (a, x, y, z) => (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D ? 0 : a[idx(x, y, z)]);
  const clad = (m, y) => (y % (m.seam ?? 4) === 0 ? m.clad[1] : m.clad[0]);
  let placed = 0;
  for (let y = 1; y < H; y++) for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    const i = idx(x, y, z), o = sheet[i] || (skin[i] ? owner[i] : 0);
    if (!o || !want.has(o)) continue;
    const m = MASSES[o - 1];
    const meets = N.some(([dx, dy, dz]) => {
      const p = at(sheet, x + dx, y + dy, z + dz) || (at(skin, x + dx, y + dy, z + dz) ? at(owner, x + dx, y + dy, z + dz) : 0);
      return p > 0 && MASSES[p - 1].clad[0] !== m.clad[0] && p < o;
    });
    let block;
    if (sheet[i]) block = meets ? CREASE : clad(m, y);
    else {
      const open = (dx, dy, dz) => !at(owner, x + dx, y + dy, z + dz) && !at(sheet, x + dx, y + dy, z + dz);
      const roof = y >= m.roof - 1 && open(0, 1, 0);
      if (roof) block = (x % 9 === 4 && z % 9 === 4) || (x % 9 === 0 && z % 9 === 0) ? "sea_lantern" : ROOF;
      else if (meets) block = CREASE;
      else if (y >= 2 && y <= m.roof - 3 && atSheetEnd(m, x, y, z)) block = SLOT;
      else block = clad(m, y);
    }
    g.set(x, y, z, block);
    placed++;
  }
  return placed;
}
