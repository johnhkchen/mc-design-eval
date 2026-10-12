// The eight h2 helpers from plan.md VOCABULARY: stringCourse, flatArch, porticoColumn, townHallLetters, belfryOpening,
// dormer, stairFlight, flagpole. Same contract as h1: each takes the build grid first (a Grid, or a guard/runParts view),
// then the position the plan gives it (facing where it has one), then an optional { over }. Coordinates are absolute,
// inclusive, x east, y up, z south. Walls are named by face: the plane is the wall's z (north/south) or x (east/west),
// and a run along the wall is x0..x1 (z0..z1 on east/west). Every write goes through place(): it lands only into air,
// so a helper can't cut into an earlier part's cells or the ground under it. { over: true } writes into anything inside
// the helper's own cells instead (a flush arch laid into a built wall, an opening carved through one). Each returns
// { placed, skipped, box }, where box is the footprint it wrote into.
import { Grid, DIRS, OPPOSITE, B, plaque } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// Writes a plan of [x, y, z, [block, state, nbt]] cells. Each cell lands only where it is air (or anywhere with over).
function place(g, cells, { over = false } = {}) {
  if (!(g instanceof Grid)) throw new TypeError("h2 helpers take the build grid (Grid or a guard/runParts view) first");
  const out = { placed: 0, skipped: [], box: boxOf(cells) };
  for (const [x, y, z, [block, state, nbt]] of cells) {
    if (g.inBounds(x, y, z) && (over || g.isAir(x, y, z))) { g.set(x, y, z, block, state, nbt); out.placed++; }
    else out.skipped.push([x, y, z, block]);
  }
  return out;
}

// The inclusive box [x0, y0, z0, x1, y1, z1] around a list of cells (or of points).
function boxOf(cells) {
  if (!cells.length) return null;
  const xs = cells.map((c) => c[0]), ys = cells.map((c) => c[1]), zs = cells.map((c) => c[2]);
  return [Math.min(...xs), Math.min(...ys), Math.min(...zs), Math.max(...xs), Math.max(...ys), Math.max(...zs)];
}

// A cell in a wall: plane = its z (north/south) or x (east/west), a = its position along the wall, out = steps outward.
function wallCell(face, plane, a, y, out = 0) {
  const n = face === "north" || face === "south" ? 2 : 0, along = n === 2 ? 0 : 2;
  const p = [0, y, 0];
  p[n] = plane + out * DIRS[face][n];
  p[along] = a;
  return p;
}

// The stairs facing that points along the wall: sign < 0 is toward the low end of the run, else toward the high end.
function alongDir(face, sign) {
  const [low, high] = face === "north" || face === "south" ? ["west", "east"] : ["north", "south"];
  return sign < 0 ? low : high;
}

const lohi = (a, b) => [Math.min(a, b), Math.max(a, b)];

/**
 * stringCourse(g, face, plane, x0, x1, y = 10): smooth_quartz across the run at y, flush with the wall. On the front
 * (north, the default for proud) a quartz_slab top half sits one block proud of the course. Writes into air only.
 */
export function stringCourse(g, face, plane, x0, x1, y = 10, { proud = face === "north", over = false } = {}) {
  const [lo, hi] = lohi(x0, x1), cells = [];
  for (let a = lo; a <= hi; a++) {
    cells.push([...wallCell(face, plane, a, y), B.block("smooth_quartz")]);
    if (proud) cells.push([...wallCell(face, plane, a, y, 1), B.slab("quartz", "top")]);
  }
  return place(g, cells, { over });
}

/**
 * flatArch(g, face, plane, x0, x1, y): the flat arch over an opening, flush in the wall at y. The two ends are upside-down
 * quartz_stairs facing outward (away from the centre); an odd span gets a chiseled_quartz_block keystone in the middle.
 * The arch sits in the wall the shell built, so the dressing part passes { over: true } to lay it on the brick.
 */
export function flatArch(g, face, plane, x0, x1, y, { over = false } = {}) {
  const [lo, hi] = lohi(x0, x1), mid = (lo + hi) / 2, odd = (hi - lo) % 2 === 0, cells = [];
  for (let a = lo; a <= hi; a++) {
    if (odd && a === mid) cells.push([...wallCell(face, plane, a, y), B.block("chiseled_quartz_block")]);
    else if (a === lo || a === hi) cells.push([...wallCell(face, plane, a, y), B.stairs("quartz", alongDir(face, a === lo ? -1 : 1), "top")]);
    else cells.push([...wallCell(face, plane, a, y), B.block("quartz_block")]);
  }
  return place(g, cells, { over });
}

/**
 * porticoColumn(g, x, z, { base = 4, top = 14 }): one portico column on the front plane at (x, z). A chiseled_quartz_block
 * base at y = base, a quartz_pillar (axis y) from base + 1 to top. Writes into air only (the porch is open).
 */
export function porticoColumn(g, x, z, { base = 4, top = 14, over = false } = {}) {
  const cells = [[x, base, z, B.block("chiseled_quartz_block")]];
  for (let y = base + 1; y <= top; y++) cells.push([x, y, z, B.pillar("quartz_pillar", "y")]);
  return place(g, cells, { over });
}

/**
 * townHallLetters(g, face, plane, x0, x1, y0, { text, height = 2 }): the lettering on the entablature face, a 1-row wall
 * sign centred on the band (plan's "sign writer" fallback). The band is 2 rows, too short for block letters, and the
 * banner style would repaint the band's quartz, so the sign goes on the wall in front of it and the band keeps its
 * blocks. The sign is air-only in front of the wall; its back block must already be there.
 */
export function townHallLetters(g, face, plane, x0, x1, y0, { text = "TOWN HALL", height = 2 } = {}) {
  const [lo, hi] = lohi(x0, x1);
  // plaque's `at` is the band's bottom-left as seen from outside; from outside the north and east walls that is the high end.
  const left = face === "north" || face === "east" ? hi : lo;
  const r = plaque(g, text, { at: wallCell(face, plane, left, y0), face, width: hi - lo + 1, height, style: "sign", material: null, frame: null, cap: false });
  const box = boxOf([wallCell(face, plane, lo, y0, 1), wallCell(face, plane, hi, y0 + height - 1)]);
  return { placed: r.cells, skipped: r.skipped, notes: r.notes, box };
}

/**
 * belfryOpening(g, face, plane, x0, x1, y0 = 32, { over }): a belfry opening on one face, cleared to air at y0..y0+1 across
 * the run, with the centre cell at y0+2 also clear (the bell hangs behind it). Upside-down quartz_stairs over the two ends
 * at y0+2 make the arch. Carving the shaft wall takes { over: true }.
 */
export function belfryOpening(g, face, plane, x0, x1, y0 = 32, { over = false } = {}) {
  const [lo, hi] = lohi(x0, x1), cells = [];
  for (let a = lo; a <= hi; a++) {
    for (let dy = 0; dy < 2; dy++) cells.push([...wallCell(face, plane, a, y0 + dy), B.block("air")]);
    const arch = a === lo || a === hi;
    cells.push([...wallCell(face, plane, a, y0 + 2), arch ? B.stairs("quartz", alongDir(face, a === lo ? -1 : 1), "top") : B.block("air")]);
  }
  return place(g, cells, { over });
}

/**
 * dormer(g, face, plane, cx, y, { over }): the front of a gable dormer centred on cx, its window bottom at y. A 3 x 2
 * glass_pane window, deepslate_tiles cheeks two out on each side, and a quartz_stairs hood (upside-down, lip toward the
 * street) across the top at y + 2. The dormer is one plane deep: the roof round it is the roof part's. Air only unless over.
 */
export function dormer(g, face, plane, cx, y, { over = false } = {}) {
  const glass = face === "north" || face === "south" ? { north: "false", south: "false", east: "true", west: "true" }
    : { north: "true", south: "true", east: "false", west: "false" };
  const cells = [];
  for (let dy = 0; dy < 2; dy++) {
    for (let d = -2; d <= 2; d++) {
      const p = wallCell(face, plane, cx + d, y + dy);
      if (Math.abs(d) === 2) cells.push([...p, B.block("deepslate_tiles")]);
      else cells.push([...p, ["glass_pane", glass]]);
    }
  }
  for (let d = -2; d <= 2; d++) cells.push([...wallCell(face, plane, cx + d, y + 2), B.stairs("quartz", OPPOSITE[face], "top")]);
  return place(g, cells, { over });
}

/**
 * stairFlight(g, x0, x1, z0, y0, { dir, steps, rail }): a straight flight across x0..x1 that climbs toward dir (north or
 * south). Step i is stone_brick_stairs at (x, y0 + i, z0 + i * step), facing dir; each step is backed by bricks down to
 * the floor. rail: "east" or "west" puts a dark_oak_fence post one above each step on that edge, the open side, and
 * leaves the other column as a clear lane. Air only unless over.
 */
export function stairFlight(g, x0, x1, z0, y0, { dir = "north", steps = 7, rail = "none", over = false } = {}) {
  if (dir !== "north" && dir !== "south") throw new RangeError("stairFlight: dir must be north or south (the flight runs along z)");
  const [lo, hi] = lohi(x0, x1), dz = DIRS[dir][2], cells = [];
  for (let i = 0; i < steps; i++) {
    const z = z0 + i * dz, y = y0 + i;
    for (let x = lo; x <= hi; x++) {
      cells.push([x, y, z, B.stairs("stone_brick", dir, "bottom")]);
      for (let j = y0; j < y; j++) cells.push([x, j, z, B.block("bricks")]);
    }
    if (rail !== "none") cells.push([rail === "west" ? lo : hi, y + 1, z, B.fence("dark_oak")]);
  }
  return place(g, cells, { over });
}

/**
 * flagpole(g, x, z, { base = 1, top = 10 }): a flagpole on the front plane at (x, z). A stone_brick_wall foot at base, a
 * dark_oak_fence shaft from base + 1 to top, and a standing blue_banner on the top post. Air only unless over.
 */
export function flagpole(g, x, z, { base = 1, top = 10, over = false } = {}) {
  const cells = [[x, base, z, B.wall("stone_brick")]];
  for (let y = base + 1; y <= top; y++) cells.push([x, y, z, B.fence("dark_oak")]);
  cells.push([x, top + 1, z, B.block("blue_banner")]);
  return place(g, cells, { over });
}
