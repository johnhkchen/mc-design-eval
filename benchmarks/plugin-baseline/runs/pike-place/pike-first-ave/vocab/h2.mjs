// plan.md VOCABULARY, part two: groundColumn, shopGlow, quoin, awning, archGate, azaleaPlanter, steppedCrest, pergola.
// Plot-local coordinates everywhere (y is the build's y). Shapes the callers pass:
//   plot   = { ground } where ground[z >> 1][x >> 1] is the GROUND value of that 2x2 cell (null where the map has '.')
//   tread  = { cells: [[x, z], ...], face: "N" | "S" | "E" | "W" }   ring-1 wall cells, in order along the face
//   riser  = [[x, z], ...] (or { cells }), ring-0 cells in order
//   window = { x, z, floor, face }                                   ring-1 cell of the window and its outward face
// Writes go to air only, unless an option says otherwise; every helper returns the number of cells it wrote.

import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const OUT = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };   // (x, z) step out of the wall
const NAME = { N: "north", S: "south", E: "east", W: "west" };

const faceKey = (f) => String(f).toUpperCase()[0];
const faceOf = ([dx, dz]) => Object.keys(OUT).find((k) => OUT[k][0] === dx && OUT[k][1] === dz);
// ring k of the cell (x, z) on a wall whose outward face is f: ring 1 is the cell itself, ring 0 one step out
const ringCell = (x, z, f, k) => [x + (1 - k) * OUT[f][0], z + (1 - k) * OUT[f][1]];

// one placed block (pair = [block, state] from B.* or a literal); air-only unless `over`
const put = (g, x, y, z, [block, state = {}], over = false) => {
  if (!over && !g.isAir(x, y, z)) return 0;
  g.set(x, y, z, block, state);
  return 1;
};

/** GROUND value of a cell; a '.' (null) takes the nearest cell that has one. */
export function groundAt(plot, x, z) {
  const rows = plot.ground, r0 = z >> 1, c0 = x >> 1;
  for (let d = 0; d < rows.length + rows[0].length; d++)
    for (let r = r0 - d; r <= r0 + d; r++)
      for (let c = c0 - d; c <= c0 + d; c++) {
        if (Math.max(Math.abs(r - r0), Math.abs(c - c0)) !== d) continue;
        const v = rows[r]?.[c];
        if (typeof v === "number") return v;
      }
  throw new Error(`groundAt: no GROUND value near ${x},${z}`);
}

/** One column of the shell from the ground up to `top`; nothing below G. */
export function groundColumn(g, plot, { x, z, top, block }) {
  let n = 0;
  for (let y = groundAt(plot, x, z); y <= top; y++) n += put(g, x, y, z, [block]);
  return n;
}

/** The lit counter, candle and hanging lantern behind one L1 shop window (ring 2), and a shelf on ring 3. Only the
 *  window's own column is written, so the 2-high lane beside the counter stays clear. */
export function shopGlow(g, { x, z, floor, face: f }) {
  const F = faceKey(f);
  const c2 = ringCell(x, z, F, 2), c3 = ringCell(x, z, F, 3);
  const at = (c, y, pair) => put(g, c[0], y, c[1], pair);
  let n = 0;
  n += at(c2, floor + 1, B.slab("spruce", "top"));                    // counter
  n += at(c2, floor + 2, ["candle", { candles: "3", lit: "true" }]);
  n += at(c2, floor + 4, B.slab("smooth_stone", "top"));              // the block the lantern hangs from
  if (!g.isAir(c2[0], floor + 4, c2[1])) n += at(c2, floor + 3, B.lantern(true));
  n += at(c3, floor + 1, B.trapdoor("spruce", NAME[F], "bottom", false)); // closed trapdoor shelf on the floor (an open one floats)
  n += at(c3, floor + 2, B.slab("spruce", "top"));                    // shelf top
  n += (x + z) % 2
    ? at(c3, floor + 3, ["candle", { candles: "1", lit: "true" }])
    : at(c3, floor + 3, ["flower_pot", {}]);
  return n;
}

/** Stones down a riser (ring 0): each course alternates `long` and `short` widths, and the next course starts on the
 *  other width, so the joints stagger. */
export function quoin(g, riser, { y0, y1, long = 2, short = 1, block = "cut_sandstone" }) {
  const cells = Array.isArray(riser) ? riser : riser.cells;
  let n = 0;
  for (let y = y0; y <= y1; y++) {
    let i = 0, s = (y - y0) % 2;
    while (i < cells.length) {
      const width = s === 0 ? long : short;
      for (let w = 0; w < width && i < cells.length; w++, i++) n += put(g, cells[i][0], y, cells[i][1], [block]);
      s = 1 - s;
    }
  }
  return n;
}

/** A wool awning one cell out from each tread cell at y, colours alternating per cell, with a carpet hem at y-1 on the
 *  same outer cell. Depth is ring 0 only, so depth must be 1. */
export function awning(g, tread, { y, colors: [a, b], depth = 1 }) {
  if (depth !== 1) throw new Error("awning: depth is ring 0 only, so depth must be 1");
  const o = OUT[faceKey(tread.face)];
  let n = 0;
  tread.cells.forEach(([x, z], i) => {
    const colour = i % 2 ? b : a, cx = x + o[0], cz = z + o[1];
    n += put(g, cx, y, cz, [`${colour}_wool`]);
    n += put(g, cx, y - 1, cz, [`${colour}_carpet`]);
  });
  return n;
}

/** A passage through the wall: `w` wide, `h` tall from y, `depth` cells in from ring 1 (ring 1 and ring 2 by default).
 *  The wall-plane cell (x, z) is the left end of the opening as seen from outside; `face` is the outward face. Springers
 *  (upside-down stairs facing in) sit at the top corners and a smooth_sandstone lintel row closes the top. With `carve`,
 *  the opening is cut through the wall and the arch overwrites what is there; otherwise only air is written. */
export function archGate(g, { x, z, w = 3, h = 4, y, face: f = "S", depth = 2, carve = false }) {
  const F = faceKey(f), o = OUT[F], inv = [-o[0], -o[1]];
  const along = o[0] ? [0, 1] : [1, 0];   // the wall-plane axis: x on a north or south face, z on east or west
  const at = (i, k) => [x + along[0] * i + inv[0] * k, z + along[1] * i + inv[1] * k];
  const put_ = (cell, dy, pair) => put(g, cell[0], y + dy, cell[1], pair, carve);
  let n = 0;
  if (carve)
    for (let k = 0; k < depth; k++) for (let i = 0; i < w; i++) for (let dy = 0; dy < h; dy++) n += put_(at(i, k), dy, ["air", {}]);
  for (const i of [-1, w]) n += put_(at(i, 0), h - 1, B.stairs("smooth_sandstone", NAME[faceOf(inv)], "top"));
  for (let i = -1; i <= w; i++) n += put_(at(i, 0), h, ["smooth_sandstone"]);
  for (let k = 1; k < depth; k++) for (let i = 0; i < w; i++) n += put_(at(i, k), h, ["smooth_sandstone"]);
  return n;
}

/** A 3x3 planter: spruce trapdoor rim (closed, top half) at y, dirt soil in the centre at y, and a persistent azalea
 *  bush on the soil at y+1. */
export function azaleaPlanter(g, [x, y, z]) {
  let n = 0;
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++)
      if (dx || dz) n += put(g, x + dx, y, z + dz, B.trapdoor("spruce", "north", "top", false));
  n += put(g, x, y, z, ["dirt"]);
  n += put(g, x, y + 1, z, ["flowering_azalea_leaves", { persistent: "true" }]);
  return n;
}

/** Bricks on each cell of a tread (ring 1). The centre rises to y1 and each step away from it drops 1 per 2 cells, down
 *  to y0. Each column is capped by a bottom stone_brick slab at its top cell. */
export function steppedCrest(g, tread, { y0 = 39, y1 = 41 } = {}) {
  const cells = tread.cells, mid = (cells.length - 1) / 2;
  let n = 0;
  cells.forEach(([x, z], i) => {
    const top = Math.max(y0, y1 - Math.floor(Math.abs(i - mid) / 2));
    for (let y = y0; y < top; y++) n += put(g, x, y, z, ["bricks"]);
    n += put(g, x, top, z, B.slab("stone_brick", "bottom"));
  });
  return n;
}

/** A pergola over box [x0, y0, z0, x1, y1, z1]: dark_oak_fence posts on a lattice every 3 cells (box edges included),
 *  posts from y0 up to y1-1, and dark_oak_slab beams (top half) on every lattice line at y1. */
export function pergola(g, [x0, y0, z0, x1, y1, z1]) {
  const lattice = (a, b) => { const v = []; for (let p = a; p < b; p += 3) v.push(p); v.push(b); return v; };
  const xs = lattice(x0, x1), zs = lattice(z0, z1);
  let n = 0;
  for (const x of xs) for (const z of zs) for (let y = y0; y < y1; y++) n += put(g, x, y, z, B.fence("dark_oak"));
  for (let x = x0; x <= x1; x++)
    for (let z = z0; z <= z1; z++)
      if (xs.includes(x) || zs.includes(z)) n += put(g, x, y1, z, B.slab("dark_oak", "top"));
  return n;
}
