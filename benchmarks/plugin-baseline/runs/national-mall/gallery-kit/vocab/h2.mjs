// The nine plan.md VOCABULARY helpers: pilaster, nichePanel, pediment, domeRing, skylightStrip, uplight, lampPost,
// towerPrism, darkBand. Each takes its position as arguments and returns the number of blocks it placed.
// Writes go only into air (a solid cell is left as it is) unless an option says replace, and nothing is written
// below a helper's footprint, so the ground, sand and floors stay with the earlier parts. Coordinates are structure
// local: x east, y up, z south. `face` is the way a wall faces out (north = -z).
import { B, DIRS, OPPOSITE } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// One block into the cell if it is in bounds and air (or replace is set). Returns 1 if written, else 0.
function put(g, x, y, z, entry, { replace = false } = {}) {
  if (!g.inBounds(x, y, z) || (!replace && !g.isAir(x, y, z))) return 0;
  const [block, state] = typeof entry === "string" ? [entry] : entry;
  g.set(x, y, z, block, state);
  return 1;
}

// The outward unit vector of a face; throws on anything but north, south, east or west.
function outward(face) {
  if (!DIRS[face]) throw new Error(`face must be north, south, east or west: ${face}`);
  return DIRS[face];
}

/** Pilaster: smooth_quartz column y4..10, one cell proud of the wall at (x, z). */
export function pilaster(g, x, z, face) {
  const [ox, , oz] = outward(face);
  let n = 0;
  for (let y = 4; y <= 10; y++) n += put(g, x + ox, y, z + oz, "smooth_quartz");
  return n;
}

/**
 * Blind niche on a pavilion end face. The panel runs x0..x1 along the face (x for north or south, z for east or west)
 * and y0..y1 at the wall plane `wall` (z or x). The face cells are left empty (recessed one, by exclusion), the back
 * cells one step in are calcite, and a smooth_quartz frame runs round the panel on the wall plane. The shell must
 * leave the frame and the face cells out: a frame cell it already built is refused.
 */
export function nichePanel(g, x0, x1, face, wall, y0 = 5, y1 = 9) {
  const inward = DIRS[OPPOSITE[face]];
  outward(face);
  const along = face === "north" || face === "south";
  const at = (a, y, depth) => (along ? [a, y, wall + depth * inward[2]] : [wall + depth * inward[0], y, a]);
  const frame = (a, y) => { const [x, yy, z] = at(a, y, 0); return put(g, x, yy, z, "smooth_quartz"); };
  let n = 0;
  for (let a = x0 - 1; a <= x1 + 1; a++) n += frame(a, y0 - 1) + frame(a, y1 + 1);
  for (let y = y0; y <= y1; y++) n += frame(x0 - 1, y) + frame(x1 + 1, y);
  for (let a = x0; a <= x1; a++) for (let y = y0; y <= y1; y++) {
    const [x, yy, z] = at(a, y, 1);
    n += put(g, x, yy, z, "calcite");
  }
  return n;
}

/**
 * Plain pediment over a portico: a four-row gable on the plane `plane` (z for a north or south front, x for east or
 * west), spanning a0..a1 along the front, eave row at y0 (the ridge is y0 + 3). The raking edge is smooth_quartz_stairs
 * facing in (lip out), the tympanum is calcite. Only the gable front: the roof behind it is the roof part's.
 */
export function pediment(g, front, a0, a1, plane, y0 = 13) {
  outward(front);
  const along = front === "north" || front === "south";
  const inFacing = along ? ["east", "west"] : ["south", "north"];
  let n = 0;
  for (let k = 0; k < 4; k++) {
    const lo = a0 + 2 * k, hi = a1 - 2 * k;
    for (let s = lo; s <= hi; s++) {
      const [x, y, z] = along ? [s, y0 + k, plane] : [plane, y0 + k, s];
      const entry = lo === hi ? "smooth_quartz"
        : s === lo ? B.stairs("smooth_quartz", inFacing[0], "bottom")
        : s === hi ? B.stairs("smooth_quartz", inFacing[1], "bottom")
        : "calcite";
      n += put(g, x, y, z, entry);
    }
  }
  return n;
}

// Half-widths of the filled circle rows, by distance dz from the centre row (plan.md circle rows).
const CIRCLE = {
  8: [8, 8, 8, 7, 7, 6, 5, 4, 2],
  7: [7, 7, 7, 6, 6, 5, 4, 2],
  6: [6, 6, 6, 5, 4, 3, 2],
  5: [5, 5, 5, 4, 3, 2],
  4: [4, 4, 3, 3, 1],
  1: [1, 0],
};

/**
 * Filled stepped dome ring: the disc of radius r about (cx, cz) at layer y, solid `mat` (a base name such as
 * weathered_cut_copper). edge: true puts `${mat}_stairs` on the outside ring, lip out (the plan's r 7 step).
 */
export function domeRing(g, cx, cz, r, y, mat, { edge = false } = {}) {
  const rows = CIRCLE[r];
  if (!rows) throw new Error(`no circle rows for r ${r}`);
  const inside = (x, z) => Math.abs(z - cz) < rows.length && Math.abs(x - cx) <= rows[Math.abs(z - cz)];
  const sides = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];
  let n = 0;
  for (let z = cz - rows.length + 1; z < cz + rows.length; z++) for (let x = cx - r; x <= cx + r; x++) {
    if (!inside(x, z)) continue;
    const out = sides.find(([ox, oz]) => !inside(x + ox, z + oz));
    n += put(g, x, y, z, edge && out ? B.stairs(mat, OPPOSITE[out[2]], "bottom") : mat);
  }
  return n;
}

/**
 * West skylight strip: glass at y13 over x0..x1 by z0..z1, a raised light_gray_stained_glass row at y14 down the
 * middle, and smooth_stone ribs (y13..14) at every x = 2 mod 4 across the whole strip.
 */
export function skylightStrip(g, x0, x1, z0, z1) {
  const mid = Math.floor((z0 + z1) / 2);
  let n = 0;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (x % 4 === 2) { n += put(g, x, 13, z, "smooth_stone") + put(g, x, 14, z, "smooth_stone"); continue; }
    n += put(g, x, 13, z, "glass");
    if (z === mid) n += put(g, x, 14, z, "light_gray_stained_glass");
  }
  return n;
}

/** Warm uplight: shroomlight flush in a floor or podium cell. It needs replace: true, since that cell is solid. */
export function uplight(g, x, y, z, { replace = false } = {}) {
  return put(g, x, y, z, "shroomlight", { replace });
}

/** Lamp post on a walk at ground y: a 3-high oak fence from y+1, a standing lantern on top at y+4. */
export function lampPost(g, x, y, z) {
  let n = 0;
  for (let k = 1; k <= 3; k++) n += put(g, x, y + k, z, "oak_fence");
  return n + put(g, x, y + 4, z, B.lantern(false));
}

/**
 * Flat-topped tower as a hollow shell. rows: [z, x0, x1] per z row of its footprint. The perimeter is white_terracotta
 * y0..18, a calcite course at y19 and coping at y20; the interior stays open (floors and decks belong to other parts).
 * tips: [x, z] cells that run unbroken white_terracotta y0..20 (the knife-edge prow tip, no trim). replace: write over
 * the body that the same cells were given.
 */
export function towerPrism(g, rows, { replace = false, tips = [] } = {}) {
  const foot = new Set();
  for (const [z, x0, x1] of rows) for (let x = x0; x <= x1; x++) foot.add(`${x},${z}`);
  const tip = new Set(tips.map(([x, z]) => `${x},${z}`));
  let n = 0;
  for (const key of foot) {
    const [x, z] = key.split(",").map(Number);
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dz]) => foot.has(`${x + dx},${z + dz}`))) continue;
    for (let y = 0; y <= 20; y++) {
      const entry = tip.has(key) || y <= 18 ? "white_terracotta" : "calcite";
      n += put(g, x, y, z, entry, { replace });
    }
  }
  return n;
}

/** Dark band of gray_stained_glass flush in a wall at height y. cells: [x0, z0] or [x0, z0, x1, z1] inclusive boxes. */
export function darkBand(g, cells, y, { replace = false } = {}) {
  let n = 0;
  for (const [x0, z0, x1 = x0, z1 = z0] of cells) {
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) {
      n += put(g, x, y, z, "gray_stained_glass", { replace });
    }
  }
  return n;
}
