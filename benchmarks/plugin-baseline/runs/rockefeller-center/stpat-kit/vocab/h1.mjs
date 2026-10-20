// Helpers from plan.md's VOCABULARY, batch h1: marble_wall, pointed_head, louvre_opening, pierced_parapet, lucarne,
// tracery_window, lean_to, lamp_post, house_window. Every position is an argument. Faces are compass names for the way a
// wall looks out (west = -x, east = +x, north = -z, south = +z). `at` is the wall plane: x for west/east walls, z for
// north/south walls. Each helper writes only into air: a cell that is not air is refused and counted, never overwritten.
// Each returns { placed: [[x, y, z], ...], refused: n }.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const OUT = { west: [-1, 0, 0], east: [1, 0, 0], north: [0, 0, -1], south: [0, 0, 1] };
// the axis a wall runs along: west/east walls run along z, north/south walls along x
const RUN = { west: "z", east: "z", north: "x", south: "x" };
// facing for the low and high end of a run (an arch rib rises toward its centre)
const LOW_RUN = { z: "north", x: "west" }, HIGH_RUN = { z: "south", x: "east" };
// a free wall post: its side connections keep the default (none)
const WALL = { up: "true" };

const check = (face) => { if (!OUT[face]) throw new Error(`face must be west, east, north or south; got ${face}`); };
// +1 or -1: the step from the wall plane toward the outside of the face
const sgn = (face) => OUT[face][0] + OUT[face][2];
const runFacing = (run, side) => (side < 0 ? LOW_RUN : HIGH_RUN)[run];
// the cell at run coordinate r and height y, on the plane at (d = 1 steps out from the face, d = -1 steps inside)
const wallCell = (face, at, r, y, d = 0) => {
  const p = at + d * sgn(face);
  return RUN[face] === "z" ? [p, y, r] : [r, y, p];
};
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;
// lancet colours: blue 50 %, red 18 %, purple 17 %, yellow 15 %
const glassBlock = (p) => (p < 50 ? "blue" : p < 68 ? "red" : p < 85 ? "purple" : "yellow") + "_stained_glass_pane";
// a pane connects along the wall's run; its other sides stay at the default (false)
const glassState = (run, block) => ({ block, state: run === "z" ? { north: "true", south: "true" } : { east: "true", west: "true" } });

function writer(g) {
  const res = { placed: [], refused: 0 };
  const put = (x, y, z, block, state) => {
    if (!g.inBounds(x, y, z) || !g.isAir(x, y, z)) { res.refused++; return; }
    g.set(x, y, z, block, state);
    res.placed.push([x, y, z]);
  };
  return { put, res };
}
const absorb = (res, sub) => { res.placed.push(...sub.placed); res.refused += sub.refused; return res; };

/**
 * A solid marble mass over the inclusive box [x0, y0, z0, x1, y1, z1]: calcite, polished diorite and diorite, hashed by
 * position (55/30/15 above y 3, diorite heavier below it). `faces` is accepted for the plan's signature; the plan does not
 * say what it changes, so it is not used.
 */
export function marble_wall(g, [x0, y0, z0, x1, y1, z1], faces) {
  const { put, res } = writer(g);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const p = hash(x, y, z) % 100;
    const block = y < 3
      ? (p < 35 ? "calcite" : p < 60 ? "polished_diorite" : "diorite")
      : (p < 55 ? "calcite" : p < 85 ? "polished_diorite" : "diorite");
    put(x, y, z, block);
  }
  return res;
}

/**
 * The pointed head over a w-wide opening: upside-down polished diorite stairs on each side, meeting at a keystone when w is
 * odd. cx is the centre cell along the wall (the left centre cell when w is even); y is the springing row, the top row of the
 * opening's jambs; the head is written above it, in air only.
 */
export function pointed_head(g, cx, y, face, w, at) {
  check(face);
  const { put, res } = writer(g);
  const run = RUN[face], W = (w - 1) / 2, first = cx - Math.floor(W);
  for (let i = 0; i < w; i++) {
    const r = first + i, d = Math.abs(i - W);
    if (d === 0) put(...wallCell(face, at, r, y + W + 1), "polished_diorite");
    else put(...wallCell(face, at, r, y + (W - d) + 1), ...B.stairs("polished_diorite", runFacing(run, i - W), "top"));
  }
  return res;
}

/**
 * A 2-wide louvre opening: top-half polished diorite slabs across the two cells at every other course from y0 to y1, air
 * between, and a pointed head over y1. cx is the left cell of the pair.
 */
export function louvre_opening(g, cx, y0, y1, face, at) {
  check(face);
  const { put, res } = writer(g);
  for (let y = y0; y <= y1; y += 2) for (const r of [cx, cx + 1]) put(...wallCell(face, at, r, y), ...B.slab("polished_diorite", "top"));
  return absorb(res, pointed_head(g, cx, y1, face, 2, at));
}

/**
 * A pierced parapet along the straight line [x0, z0, x1, z1] (same z, or same x) at row y: diorite wall posts on every other
 * cell with air between, and a polished diorite slab coping on row y + 1 over the whole line.
 */
export function pierced_parapet(g, [x0, z0, x1, z1], y) {
  if (z0 !== z1 && x0 !== x1) throw new Error("pierced_parapet: the line must run along x or along z");
  const { put, res } = writer(g);
  const alongX = z0 === z1;
  const a = alongX ? Math.min(x0, x1) : Math.min(z0, z1), b = alongX ? Math.max(x0, x1) : Math.max(z0, z1);
  const cell = (r, yy) => (alongX ? [r, yy, z0] : [x0, yy, r]);
  for (let r = a; r <= b; r++) {
    if ((r - a) % 2 === 0) put(...cell(r, y), "diorite_wall", WALL);
    put(...cell(r, y + 1), ...B.slab("polished_diorite", "bottom"));
  }
  return res;
}

/**
 * A 3-wide gabled dormer on an octagon face at plane `at`, its front one block proud of the face: polished diorite jambs,
 * a blue lancet pane in the centre, a gable of quartz stairs rising to a diorite centre and a quartz cap. cx is the centre
 * cell along the face and y the bottom row. The dormer is 5 rows tall above y.
 */
export function lucarne(g, cx, y, face, at) {
  check(face);
  const { put, res } = writer(g);
  const run = RUN[face];
  const c = (r, yy) => wallCell(face, at, r, yy, 1);
  const pane = glassState(run, "blue_stained_glass_pane");
  for (let yy = y; yy <= y + 2; yy++) {
    put(...c(cx - 1, yy), "polished_diorite");
    put(...c(cx + 1, yy), "polished_diorite");
    put(...c(cx, yy), pane.block, pane.state);
  }
  put(...c(cx - 1, y + 3), ...B.stairs("smooth_quartz", runFacing(run, 1), "bottom"));
  put(...c(cx + 1, y + 3), ...B.stairs("smooth_quartz", runFacing(run, -1), "bottom"));
  put(...c(cx, y + 3), "polished_diorite");
  put(...c(cx, y + 4), ...B.slab("smooth_quartz", "bottom"));
  return res;
}

/**
 * A 9-wide tracery window in the one-cell-thick wall box [x0, y0, z0, x1, y1, z1] (the plane is the box's thin side): stained
 * glass panes with diorite wall mullions every 2 cells, and a pointed head over the top W + 1 rows, where W = (width - 1) / 2.
 * The width must be odd, and the box must be at least W + 2 rows tall.
 */
export function tracery_window(g, [x0, y0, z0, x1, y1, z1], face) {
  check(face);
  const { put, res } = writer(g);
  const run = RUN[face];
  const lo = run === "z" ? Math.min(z0, z1) : Math.min(x0, x1), hi = run === "z" ? Math.max(z0, z1) : Math.max(x0, x1);
  const n = hi - lo + 1;
  if (n < 3 || n % 2 === 0) throw new Error(`tracery_window: width must be odd and at least 3, got ${n}`);
  const W = (n - 1) / 2, mid = lo + W, s = y1 - W - 1;  // s: the springing row
  if (s < y0) throw new Error(`tracery_window: box too short for a pointed head (needs ${W + 2} rows)`);
  const at = run === "z" ? x0 : z0;
  for (let r = lo; r <= hi; r++) for (let yy = y0; yy <= s; yy++) {
    const cell = wallCell(face, at, r, yy);
    if (r !== lo && r !== hi && (r - mid) % 2 === 0) put(...cell, "diorite_wall", WALL);
    else {
      const pane = glassState(run, glassBlock(hash(r, yy, at) % 100));
      put(...cell, pane.block, pane.state);
    }
  }
  return absorb(res, pointed_head(g, mid, s, face, n, at));
}

/**
 * A lean-to (shed) roof over the footprint [x0, z0, x1, z1]: it rises from `low` at the far edge to `high` at the wall on the
 * `toward` side. Deepslate tile stairs where the surface steps up toward the wall, bottom slabs on the flat runs. Only the
 * roof surface is written; the wall it leans on belongs to the caller.
 */
export function lean_to(g, [x0, z0, x1, z1], low, high, toward) {
  check(toward);
  if (high < low) throw new Error("lean_to: high must be at or above low");
  const { put, res } = writer(g);
  const spanX = toward === "east" || toward === "west";
  const lo = spanX ? Math.min(x0, x1) : Math.min(z0, z1), hi = spanX ? Math.max(x0, x1) : Math.max(z0, z1);
  const cLo = spanX ? Math.min(z0, z1) : Math.min(x0, x1), cHi = spanX ? Math.max(z0, z1) : Math.max(x0, x1);
  const n = hi - lo + 1;
  const ascending = toward === "east" || toward === "south";  // i = 0 is the far edge; i rises toward the wall
  const span = (i) => (ascending ? lo + i : hi - i);
  const height = (i) => (n === 1 ? high : low + Math.round((i * (high - low)) / (n - 1)));
  for (let i = 0; i < n; i++) {
    const s = span(i), y = height(i), rising = i + 1 < n && height(i + 1) > y;
    for (let c = cLo; c <= cHi; c++) {
      const cell = spanX ? [s, y, c] : [c, y, s];
      if (rising) put(...cell, ...B.stairs("deepslate_tile", toward, "bottom"));
      else put(...cell, ...B.slab("deepslate_tile", "bottom"));
    }
  }
  return res;
}

/** A lamp post: three polished blackstone wall posts at x, y..y+2, z, and a standing lantern on top at y+3. */
export function lamp_post(g, x, y, z) {
  const { put, res } = writer(g);
  for (let yy = y; yy <= y + 2; yy++) put(x, yy, z, "polished_blackstone_wall", WALL);
  put(x, y + 3, z, ...B.lantern(false));
  return res;
}

/**
 * A 2 x 2 house window in the wall plane. (x, y, z) is the cell at its low run end and its lower row; the plane is x or z
 * according to `face`. Glass panes at rows y and y+1, a sill slab proud of the wall at y-1, and either a pointed head at
 * y+2 (pointed) or a proud lintel slab at y+2. About half get an ochre froglight just inside the glass, chosen by position.
 */
export function house_window(g, x, y, z, pointed, face) {
  check(face);
  const { put, res } = writer(g);
  const run = RUN[face];
  const at = run === "z" ? x : z, r0 = run === "z" ? z : x;
  const pane = glassState(run, "glass_pane");
  for (const r of [r0, r0 + 1]) {
    for (const yy of [y, y + 1]) put(...wallCell(face, at, r, yy), pane.block, pane.state);
    put(...wallCell(face, at, r, y - 1, 1), ...B.slab("polished_diorite", "top"));
    if (!pointed) put(...wallCell(face, at, r, y + 2, 1), ...B.slab("polished_diorite", "bottom"));
  }
  if (pointed) absorb(res, pointed_head(g, r0, y + 1, face, 2, at));
  if (hash(x, y, z) % 2 === 0) put(...wallCell(face, at, r0, y, -1), "ochre_froglight", { axis: "y" });
  return res;
}
