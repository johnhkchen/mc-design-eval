// 2.5-D projected surface grid — Path P, the PAINT CANVAS (T-078-01, story S-078, epic E-23).
//
// Hand the LLM a VIEW, not 57k voxels (`twodee-interaction-sector`). This module projects an occupancy
// to a 2-D cell grid where each cell carries the FRONT-MOST surface voxel along its view ray PLUS its
// depth and exposed face normal. This is the canvas S-079 spray-paints, and the back-projection here is
// UNAMBIGUOUS — which is exactly why paint-back is scoped to ortho + 45° (the AC). Arbitrary-oblique
// paint-back is explicitly OUT and rejected with a throw.
//
// WHY A PURE LATTICE PROJECTION, NOT THE GL RENDER. A perspective render's pixel→voxel inverse is
// ambiguous (foreshortening, occlusion, sub-pixel blocks). An ORTHOGRAPHIC, lattice-aligned projection
// is a bijection on surface voxels: every cell stores its source `[x,y,z]`, so `backProject` is a
// stored-voxel read, never a re-derivation from depth. That is the load-bearing invariant the round-trip
// test pins. The GL multi-angle reader (multi-angle.mjs) is the separate READ path for any angle.
//
// PURE — no GL, no I/O, no Date/random — exercised by `src/**/*.test.mjs` on synthetic occupancy.

/** Camera-facing normal → (col axis U, row axis V, depth axis W) table for the 6 orthographic views.
 *  `near:'max'` ⇒ camera on the +axisW side (front-most = max coord); `'min'` ⇒ −side (front = min).
 *  U/V orientation is chosen so side views read y-up with row 0 at the top; it affects layout only —
 *  correctness (the round-trip) is independent of it because cells store their source voxel. */
export const ORTHO_DIRS = Object.freeze([
  { name: "+x", normal: [1, 0, 0], axisW: 0, near: "max", axisU: 2, signU: 1, axisV: 1, signV: -1 },
  { name: "-x", normal: [-1, 0, 0], axisW: 0, near: "min", axisU: 2, signU: -1, axisV: 1, signV: -1 },
  { name: "+z", normal: [0, 0, 1], axisW: 2, near: "max", axisU: 0, signU: -1, axisV: 1, signV: -1 },
  { name: "-z", normal: [0, 0, -1], axisW: 2, near: "min", axisU: 0, signU: 1, axisV: 1, signV: -1 },
  { name: "+y", normal: [0, 1, 0], axisW: 1, near: "max", axisU: 0, signU: 1, axisV: 2, signV: 1 },
  { name: "-y", normal: [0, -1, 0], axisW: 1, near: "min", axisU: 0, signU: 1, axisV: 2, signV: -1 },
]);

/** The four 45° GROUND diagonals (x/z plane), named by their two camera-facing axis signs. */
export const DIAG_DIRS = Object.freeze([
  { name: "+x+z", signX: 1, signZ: 1 },
  { name: "+x-z", signX: 1, signZ: -1 },
  { name: "-x+z", signX: -1, signZ: 1 },
  { name: "-x-z", signX: -1, signZ: -1 },
]);

const ORTHO_BY_NAME = new Map(ORTHO_DIRS.map((d) => [d.name, d]));
const DIAG_BY_NAME = new Map(DIAG_DIRS.map((d) => [d.name, d]));

/** Resolve a dir name (or a dir object) to its spec, classifying ortho vs diag. Throws on anything else
 *  — arbitrary-oblique paint-back is OUT of Path P (AC), enforced not just documented. */
export function resolveDir(dir) {
  const name = typeof dir === "string" ? dir : dir && dir.name;
  if (ORTHO_BY_NAME.has(name)) return { kind: "ortho", spec: ORTHO_BY_NAME.get(name) };
  if (DIAG_BY_NAME.has(name)) return { kind: "diag", spec: DIAG_BY_NAME.get(name) };
  throw new Error(
    `surface-grid: dir "${name}" is not an orthographic (${ORTHO_DIRS.map((d) => d.name).join(",")}) ` +
      `or 45° diagonal (${DIAG_DIRS.map((d) => d.name).join(",")}) view — arbitrary-oblique paint-back is out of scope`,
  );
}

/**
 * @typedef {{ block:string, depth:number, voxel:number[], normal:number[] }} SurfaceCell
 * @typedef {Object} SurfaceGrid
 * @property {string} dir
 * @property {"ortho"|"diag"} kind
 * @property {number} n columns
 * @property {number} m rows
 * @property {(SurfaceCell|null)[][]} cells m rows × n cols
 * @property {number} filled
 * @property {number} air
 */

function worldOnAxis(min, max, sign, idx) {
  return sign > 0 ? min + idx : max - idx;
}

/** Project an occupancy to a 2.5-D surface grid along an ortho dir. */
function projectOrtho(occ, spec) {
  const { min, max } = occ.bounds;
  const { axisU, signU, axisV, signV, axisW, near } = spec;
  const n = max[axisU] - min[axisU] + 1;
  const m = max[axisV] - min[axisV] + 1;
  const cells = Array.from({ length: m }, () => new Array(n).fill(null));
  let filled = 0;
  const wLo = min[axisW];
  const wHi = max[axisW];
  for (let v = 0; v < m; v++) {
    const wv = worldOnAxis(min[axisV], max[axisV], signV, v);
    for (let u = 0; u < n; u++) {
      const wu = worldOnAxis(min[axisU], max[axisU], signU, u);
      // March from the camera side (near plane) toward the far side; first occupied = surface.
      let found = null;
      if (near === "max") {
        for (let w = wHi; w >= wLo; w--) {
          if (probe(occ, axisU, wu, axisV, wv, axisW, w)) { found = w; break; }
        }
      } else {
        for (let w = wLo; w <= wHi; w++) {
          if (probe(occ, axisU, wu, axisV, wv, axisW, w)) { found = w; break; }
        }
      }
      if (found === null) continue;
      const pos = [0, 0, 0];
      pos[axisU] = wu; pos[axisV] = wv; pos[axisW] = found;
      const depth = near === "max" ? wHi - found : found - wLo;
      cells[v][u] = { block: occ.block(pos[0], pos[1], pos[2]), depth, voxel: pos, normal: spec.normal };
      filled++;
    }
  }
  return { dir: spec.name, kind: "ortho", n, m, cells, filled, air: n * m - filled };
}

function probe(occ, axisU, wu, axisV, wv, axisW, w) {
  const p = [0, 0, 0];
  p[axisU] = wu; p[axisV] = wv; p[axisW] = w;
  return occ.has(p[0], p[1], p[2]);
}

/** Exposed ortho face normal of a diagonal surface voxel: whichever of the two camera-facing ortho
 *  neighbours is air (fallback: the X face). Tells the splat which wall it paints. */
function diagNormal(occ, x, y, z, signX, signZ) {
  if (!occ.has(x + signX, y, z)) return [signX, 0, 0];
  if (!occ.has(x, y, z + signZ)) return [0, 0, signZ];
  return [signX, 0, 0];
}

/** Project an occupancy to a 2.5-D surface grid along a 45° ground diagonal. Column = the perpendicular
 *  ground diagonal `signX·x − signZ·z` (⟂ to the view diagonal), row = y; per (col,row) keep the
 *  front-most voxel (max `signX·x + signZ·z`). `(viewScore,col,y) ↔ (x,y,z)` is a bijection, so storing
 *  the source voxel keeps back-projection exact. */
function projectDiag(occ, spec) {
  const { min, max } = occ.bounds;
  const { signX, signZ } = spec;
  const colOf = (x, z) => signX * x - signZ * z;
  const viewOf = (x, z) => signX * x + signZ * z;
  // column range over the footprint corners
  const corners = [
    colOf(min[0], min[2]), colOf(min[0], max[2]), colOf(max[0], min[2]), colOf(max[0], max[2]),
  ];
  const colLo = Math.min(...corners);
  const colHi = Math.max(...corners);
  const n = colHi - colLo + 1;
  const m = max[1] - min[1] + 1;
  const cells = Array.from({ length: m }, () => new Array(n).fill(null));
  const best = Array.from({ length: m }, () => new Array(n).fill(null)); // {viewScore} per cell
  let maxView = -Infinity;
  for (const [keyX, blk] of occ.cells) {
    const [x, y, z] = keyX.split(",").map(Number);
    const v = max[1] - y; // row 0 = top
    const u = colOf(x, z) - colLo;
    const vs = viewOf(x, z);
    if (vs > maxView) maxView = vs;
    const cur = best[v][u];
    if (cur === null || vs > cur.vs) {
      best[v][u] = { vs };
      cells[v][u] = { block: blk, depth: 0, voxel: [x, y, z], normal: diagNormal(occ, x, y, z, signX, signZ) };
    }
  }
  let filled = 0;
  for (let v = 0; v < m; v++) {
    for (let u = 0; u < n; u++) {
      const c = cells[v][u];
      if (c === null) continue;
      c.depth = maxView - best[v][u].vs;
      filled++;
    }
  }
  return { dir: spec.name, kind: "diag", n, m, cells, filled, air: n * m - filled };
}

/**
 * Project an occupancy to a 2.5-D surface grid along `dir` (one of {@link ORTHO_DIRS} or
 * {@link DIAG_DIRS}). Front-most surface voxel per cell + depth + exposed-face normal. PURE.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {string|{name:string}} dir
 * @returns {SurfaceGrid}
 */
export function projectSurface(occ, dir) {
  const { kind, spec } = resolveDir(dir);
  if (!occ.bounds) return { dir: spec.name, kind, n: 0, m: 0, cells: [], filled: 0, air: 0 };
  return kind === "ortho" ? projectOrtho(occ, spec) : projectDiag(occ, spec);
}

/**
 * Resolve a dir to its ORTHOGRAPHIC spec, throwing on a diagonal or arbitrary-oblique dir. Sealing /
 * hole-back-projection (S-084) is ortho-only — the +y roof and the four side faces — because a hole has no
 * stored voxel and we synthesize its world pos from the spec's axis map. PURE.
 * @param {string|{name:string}} dir
 * @returns {typeof ORTHO_DIRS[number]} the ortho spec
 */
export function orthoSpec(dir) {
  const { kind, spec } = resolveDir(dir);
  if (kind !== "ortho") {
    throw new Error(`surface-grid: orthoSpec("${spec.name}") — only orthographic dirs carry an axis map; diagonals are out`);
  }
  return spec;
}

/**
 * World `[x,y,z]` for a grid cell `(u,v)` on an ortho face at a given WORLD depth coordinate `w` (the
 * axis-W value, not an index). The inverse of {@link projectOrtho}'s cell→pos mapping, exposed so the
 * S-084 seal ops can place a voxel at a HOLE cell (which carries no stored `SurfaceCell.voxel`). For a
 * filled cell `c`, `cellWorldPos(occ, spec, u, v, c.voxel[spec.axisW])` reproduces `c.voxel`. PURE.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {typeof ORTHO_DIRS[number]} spec  from {@link orthoSpec}
 * @param {number} u column index
 * @param {number} v row index
 * @param {number} w world coordinate on the depth axis (axisW)
 * @returns {number[]} [x,y,z]
 */
export function cellWorldPos(occ, spec, u, v, w) {
  const { min, max } = occ.bounds;
  const { axisU, signU, axisV, signV, axisW } = spec;
  const pos = [0, 0, 0];
  pos[axisU] = worldOnAxis(min[axisU], max[axisU], signU, u);
  pos[axisV] = worldOnAxis(min[axisV], max[axisV], signV, v);
  pos[axisW] = w;
  return pos;
}

/**
 * Back-project a surface grid to its surface voxel set: each non-null cell's stored `voxel` + `block`.
 * The round-trip `backProject(projectSurface(occ,dir))` is the per-column front-most surface set — an
 * identity the AC pins. PURE.
 * @param {SurfaceGrid} grid
 * @returns {{pos:number[], block:string}[]}
 */
export function backProject(grid) {
  const out = [];
  for (const row of grid.cells) {
    for (const c of row) {
      if (c) out.push({ pos: c.voxel, block: c.block });
    }
  }
  return out;
}

/**
 * Binary fill mask of a surface grid (filled cell → 1) in form-fidelity `{w,h,data}` convention. Used
 * by the structural read's opening detector and for visual debug. PURE.
 * @param {SurfaceGrid} grid
 * @returns {{w:number,h:number,data:Uint8Array}}
 */
export function gridMaskOf(grid) {
  const w = grid.n;
  const h = grid.m;
  const data = new Uint8Array(w * h);
  for (let v = 0; v < h; v++) {
    for (let u = 0; u < w; u++) {
      if (grid.cells[v][u]) data[v * w + u] = 1;
    }
  }
  return { w, h, data };
}
