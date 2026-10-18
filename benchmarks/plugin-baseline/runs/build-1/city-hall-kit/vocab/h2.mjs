// VOCABULARY part 2 of plan.md: fset, rusticatedBase, entablature, plainWall, triglyphs, baseWindowDressing,
// atticPanel, pedimentRelief, leadDome, hangingLantern. Each takes its position as arguments and writes only into
// air. A cell that is not air is left alone and reported in g.refused, the same list guard() keeps.
// Frame helpers take F, a faceFrame object from plan.md rule 1: F.at(u, d) -> [x, z], F.dir(token) -> compass.
import { Grid, dome, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const FACING_TOKENS = ["out", "in", "left", "right"];

// The one place a write lands. Returns 1 when placed, 0 when refused.
function put(g, x, y, z, block, state) {
  if (!g.isAir(x, y, z)) {
    (g.refused ??= []).push([x, y, z, block]);
    return 0;
  }
  g.set(x, y, z, block, state);
  return 1;
}

// Triglyphs stand where u mod 4 is 0 or 3 (the same pattern on every plot).
const isTriglyph = (u) => [0, 3].includes(((u % 4) + 4) % 4);

// One write through the face frame. Facing tokens (out | in | left | right) are turned into compass directions.
export function fset(g, F, u, d, y, block, state) {
  const [x, z] = F.at(u, d);
  const s = state && FACING_TOKENS.includes(state.facing) ? { ...state, facing: F.dir(state.facing) } : state;
  return put(g, x, y, z, block, s);
}

// Rule 5. Plinth polished_andesite at y 1, d p-1. Granite body y 2..9, d p..p+2: quartz string course at y 9 (d p),
// channel joints at y 4 and 7 (d p left out, diorite at d p+1). Each opening {u0, u1, y0, y1} stays open for the
// glazier (d p..p+2 all empty). A door opening also leaves out the plinth.
export function rusticatedBase(g, F, u0, u1, p, { openings = [] } = {}) {
  const inOpening = (u, y) => openings.some((o) => u >= o.u0 && u <= o.u1 && y >= o.y0 && y <= o.y1);
  const doorAt = (u) => openings.some((o) => o.door && u >= o.u0 && u <= o.u1);
  let n = 0;
  for (let u = u0; u <= u1; u++) {
    if (!doorAt(u)) n += fset(g, F, u, p - 1, 1, "polished_andesite");
    for (let y = 2; y <= 9; y++) {
      if (inOpening(u, y)) continue;
      const joint = y === 4 || y === 7;
      if (!joint) n += fset(g, F, u, p, y, y === 9 ? "smooth_quartz" : "polished_diorite");
      n += fset(g, F, u, p + 1, y, joint ? "diorite" : "polished_diorite");
      n += fset(g, F, u, p + 2, y, "polished_diorite");
    }
  }
  return n;
}

// Rule 8. Architrave smooth_quartz y 34, frieze calcite y 35, crown smooth_quartz y 36, each from d p to p+5.
// Triglyph cells (y 35, d p) are left empty for triglyphs(). Inside plainFrom..plainTo the frieze at d p is
// smooth_quartz with no triglyphs.
export function entablature(g, F, u0, u1, p, { plainFrom, plainTo } = {}) {
  const plain = (u) => plainFrom != null && u >= plainFrom && u <= plainTo;
  let n = 0;
  for (let u = u0; u <= u1; u++) {
    for (let d = p; d <= p + 5; d++) {
      n += fset(g, F, u, d, 34, "smooth_quartz");
      const triglyphGap = d === p && isTriglyph(u) && !plain(u);
      if (!triglyphGap) n += fset(g, F, u, d, 35, d === p && plain(u) ? "smooth_quartz" : "calcite");
      n += fset(g, F, u, d, 36, "smooth_quartz");
    }
  }
  return n;
}

// Rule 11. Polished_diorite ashlar over the box [x0, y0, z0, x1, y1, z1] (inclusive), with a flush smooth_quartz
// band on the bandY courses (lo..hi inclusive).
export function plainWall(g, box, bandY = [34, 36]) {
  const [ax, ay, az, bx, by, bz] = box;
  let n = 0;
  for (let x = Math.min(ax, bx); x <= Math.max(ax, bx); x++)
    for (let y = Math.min(ay, by); y <= Math.max(ay, by); y++)
      for (let z = Math.min(az, bz); z <= Math.max(az, bz); z++)
        n += put(g, x, y, z, y >= bandY[0] && y <= bandY[1] ? "smooth_quartz" : "polished_diorite");
  return n;
}

// Rule 14. Chiseled_quartz_block triglyphs at y 35, d p, where u mod 4 is 0 or 3. Cells in skipFrom..skipTo are left out.
export function triglyphs(g, F, u0, u1, p, { skipFrom, skipTo } = {}) {
  let n = 0;
  for (let u = u0; u <= u1; u++) {
    if (!isTriglyph(u)) continue;
    if (skipFrom != null && u >= skipFrom && u <= skipTo) continue;
    n += fset(g, F, u, p, 35, "chiseled_quartz_block");
  }
  return n;
}

// Rule 17. Polished_diorite_slab (bottom) sill at y 2, d p-1, over 2 cells from u0. Chiseled_quartz_block keystones at
// y 8, d p. The keystone cell must be left open in the base's openings (y up to 8), or it is refused.
export function baseWindowDressing(g, F, u0, p) {
  let n = 0;
  for (const u of [u0, u0 + 1]) {
    n += fset(g, F, u, p - 1, 2, ...B.slab("polished_diorite", "bottom"));
    n += fset(g, F, u, p, 8, "chiseled_quartz_block");
  }
  return n;
}

// Rule 20. Chiseled_quartz_block border ring u0..u1 x y0..y1 standing 1 proud at d-1, with a calcite field at d inside it.
export function atticPanel(g, F, u0, u1, d, y0 = 38, y1 = 41) {
  let n = 0;
  for (let u = u0; u <= u1; u++)
    for (let y = y0; y <= y1; y++) {
      const border = u === u0 || u === u1 || y === y0 || y === y1;
      n += border ? fset(g, F, u, d - 1, y, "chiseled_quartz_block") : fset(g, F, u, d, y, "calcite");
    }
  return n;
}

// Rule 23. Pediment relief at z, on the tympanum. x0 is the plot's west edge (plot 1: 64); the plot mirrors X <-> 63 - X.
// A cell sits no higher than 2 under its rake pair (y <= h - 2), so the figures are cut off where the rake drops.
export function pedimentRelief(g, { x0, z = 1 }) {
  const mirror = (x) => 2 * x0 + 63 - x;
  const rake = (x) => 37 + Math.floor((Math.min(x - x0, 63 - (x - x0)) - 9) / 2);
  const cell = (x, y, block) => (y <= rake(x) - 2 ? put(g, x, y, z, block) : 0);
  const both = (x, y, block) => cell(x, y, block) + cell(mirror(x), y, block);
  let n = 0;
  // Centre: a seated figure, its own mirror.
  for (let x = 94; x <= 97; x++) for (const y of [38, 39]) n += cell(x, y, "quartz_bricks");
  for (const x of [95, 96]) for (const y of [40, 41, 42]) n += cell(x, y, "chiseled_quartz_block");
  for (const x of [94, 97]) n += cell(x, 41, "quartz_bricks");
  for (const x of [95, 96]) n += cell(x, 43, "chiseled_quartz_block");
  // Each side (mirrored): a standing figure, a kneeling figure, a reclining figure.
  for (let x = 90; x <= 91; x++) {
    for (let y = 38; y <= 41; y++) n += both(x, y, "quartz_bricks");
    n += both(x, 42, "chiseled_quartz_block");
  }
  for (let x = 85; x <= 86; x++) {
    for (const y of [38, 39]) n += both(x, y, "quartz_bricks");
    n += both(x, 40, "chiseled_quartz_block");
  }
  for (let x = 77; x <= 82; x++) {
    n += both(x, 38, "polished_diorite");
    n += both(x, 39, x === 78 ? "chiseled_quartz_block" : "quartz_bricks");
  }
  return n;
}

// Rule 26. The dome (base layer y0, axis cx/cz, radius 20.5, 30 high, hollow 2 thick, polished_tuff, stair edges) is
// built in a scratch grid and copied into g once, swapping as it goes:
//  - gold_block on the outer shell at y0 and at y0+29;
//  - 16 polished_andesite meridians: on each layer y0+1..y0+29, the outer cell nearest each k * 22.5 degrees;
//    the cell at y0+2 becomes gold_block (the cartouche);
//  - glowstone on every 3rd inner cell of the rings y0+3, +7 .. +27, staggered by one per ring.
// The outer shell is a solid cell with an air neighbour above or outward; the inner face has solid on both sides.
export function leadDome(g, { cx, cz, y0 }) {
  const scratch = new Grid(g.size, { dataVersion: g.dataVersion });
  dome(scratch, { center: [cx, y0, cz], radius: 20.5, height: 30, profile: "hemisphere", hollow: true, thickness: 2, block: "polished_tuff", edge: "stairs" });
  const hd = (x, z) => Math.hypot(x - cx, z - cz);
  const angle = (x, z) => { const a = Math.atan2(x - cx, -(z - cz)); return a < 0 ? a + 2 * Math.PI : a; };
  const angDiff = (a, b) => { const d = Math.abs(a - b) % (2 * Math.PI); return Math.min(d, 2 * Math.PI - d); };
  const key = (x, y, z) => `${x},${y},${z}`;
  const outward = [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0]];
  const isOuter = (x, y, z) => outward.some(([a, b, e]) => {
    const nx = x + a, ny = y + b, nz = z + e;
    if (scratch.inBounds(nx, ny, nz) && !scratch.isAir(nx, ny, nz)) return false;
    return b > 0 || (b === 0 && hd(nx, nz) > hd(x, z) + 1e-9);
  });
  const solids = scratch.solids().map((c) => ({ ...c, out: isOuter(...c.pos) }));

  const role = new Map();
  for (let y = y0 + 1; y <= y0 + 29; y++) {
    const ring = solids.filter((c) => c.out && c.pos[1] === y);
    for (let k = 0; k < 16; k++) {
      const m = (k * Math.PI) / 8;
      let best = null;
      for (const c of ring) {
        const d = angDiff(angle(c.pos[0], c.pos[2]), m);
        if (!best || d < best.d) best = { c, d };
      }
      if (best) role.set(key(...best.c.pos), y === y0 + 2 ? "gold" : "rib");
    }
  }
  [3, 7, 11, 15, 19, 23, 27].forEach((off, j) => {
    const ring = solids
      .filter((c) => !c.out && c.pos[1] === y0 + off && c.block === "minecraft:polished_tuff")
      .sort((a, b) => angle(a.pos[0], a.pos[2]) - angle(b.pos[0], b.pos[2]));
    ring.forEach((c, i) => { if ((i + j) % 3 === 0) role.set(key(...c.pos), "glow"); });
  });

  let n = 0;
  for (const c of solids) {
    const [x, y, z] = c.pos;
    const r = role.get(key(x, y, z));
    if ((y === y0 || y === y0 + 29) && c.out) n += put(g, x, y, z, "gold_block");
    else if (r === "gold") n += put(g, x, y, z, "gold_block");
    else if (r === "rib") n += put(g, x, y, z, c.block.replace("polished_tuff", "polished_andesite"), c.state);
    else if (r === "glow") n += put(g, x, y, z, "glowstone");
    else n += put(g, x, y, z, c.block, c.state);
  }
  return n;
}

// Rule 29. A chain (axis y) of `chain` cells above a lantern hanging: true. The lantern hangs from a solid block
// directly above the chain, so with nothing solid there it throws instead of floating.
export function hangingLantern(g, x, y, z, chain = 0) {
  if (g.isAir(x, y + chain + 1, z)) throw new Error(`hangingLantern at ${x},${y},${z}: no solid block above it to hang from`);
  let n = 0;
  for (let i = 1; i <= chain; i++) n += put(g, x, y + i, z, ...B.chain("y", false));
  n += put(g, x, y, z, ...B.lantern(true));
  return n;
}
