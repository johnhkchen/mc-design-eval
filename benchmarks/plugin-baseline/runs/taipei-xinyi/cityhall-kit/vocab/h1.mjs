// Vocabulary helpers, part h1 (plan.md VOCABULARY): plinth, stringCourse, quoin, plantBox, floodCourse,
// canopyLight, slabRamp, flagpole, fountain.
//
// Every helper takes its position (and facing, where it has one) as arguments and writes only inside the footprint
// it is given. It writes only into air unless opts.replace is true, so an earlier part's ground, floor and walls are
// never overwritten. Each returns { placed, refused }: refused counts cells skipped because they were occupied
// (or, with the footprint check, outside the box).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const DIR = { west: [-1, 0], east: [1, 0], north: [0, -1], south: [0, 1] };
const SIDE = DIR;

/** [x0,y0,z0,x1,y1,z1] with each pair ordered low..high. */
function ordered([ax, ay, az, bx, by, bz]) {
  return [Math.min(ax, bx), Math.min(ay, by), Math.min(az, bz), Math.max(ax, bx), Math.max(ay, by), Math.max(az, bz)];
}

/** Call fn(x, y, z) for every cell of the inclusive box. */
function eachCell(box, fn) {
  const [x0, y0, z0, x1, y1, z1] = ordered(box);
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) fn(x, y, z);
}

/** A writer confined to the footprint box: air only unless opts.replace. Counts placed and refused cells. */
function writer(g, box, opts = {}) {
  const [x0, y0, z0, x1, y1, z1] = ordered(box);
  const out = { placed: 0, refused: 0 };
  const set = (x, y, z, block, state, nbt) => {
    const inside = x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1 && g.inBounds(x, y, z);
    if (!inside || (!opts.replace && !g.isAir(x, y, z))) { out.refused++; return; }
    g.set(x, y, z, block, state, nbt);
    out.placed++;
  };
  return { set, out };
}

/** plinth: polished_andesite over the box, from the ground up (ground cells are not air, so they stay as they are). */
export function plinth(g, box, opts = {}) {
  const w = writer(g, box, opts);
  eachCell(box, (x, y, z) => w.set(x, y, z, "polished_andesite"));
  return w.out;
}

/**
 * stringCourse: smooth_sandstone_slab (top), 1 proud of the wall plane (plan: string course at y 7).
 * face: "west" | "east" | "north" | "south", the side the course is on. wall: the wall plane's cell (x for east/west,
 * z for north/south). span: [a, b] along the wall, inclusive (z for east/west, x for north/south).
 */
export function stringCourse(g, face, wall, span, y = 7, opts = {}) {
  return courseRun(g, face, wall, span, y, 1, B.slab("smooth_sandstone", "top"), opts);
}

/**
 * floodCourse: ochre_froglight set flush in the wall plane at y (plan: 62), on the faces the caller names.
 * Flush means inside the wall, so the wall it lies on must be dressed with { replace: true }.
 * Arguments as stringCourse.
 */
export function floodCourse(g, face, wall, span, y = 62, opts = {}) {
  return courseRun(g, face, wall, span, y, 0, ["ochre_froglight", { axis: "y" }], opts);
}

/** A one-cell-deep run along a face: `proud` cells out from the wall plane (0 = flush). */
function courseRun(g, face, wall, [a, b], y, proud, [block, state], opts) {
  const d = DIR[face];
  if (!d) throw new Error(`face must be west, east, north or south, got ${face}`);
  const p = wall + (d[0] + d[1]) * proud;
  const box = d[0] ? [p, y, a, p, y, b] : [a, y, p, b, y, p];
  const w = writer(g, box, opts);
  eachCell(box, (x, yy, z) => w.set(x, yy, z, block, state));
  return w.out;
}

/** quoin: cut_sandstone, 1 wide, flush on a corner, from y0 to y1 (plan: every tower corner). */
export function quoin(g, [x, z], y0, y1, opts = {}) {
  const box = [x, y0, z, x, y1, z];
  const w = writer(g, box, opts);
  eachCell(box, (xx, y, zz) => w.set(xx, y, zz, "cut_sandstone"));
  return w.out;
}

/**
 * plantBox: 5x5 plant box on a roof, centred on (cx, cz), y 68..70 (plan ROOFS / plantBox).
 * Light-gray concrete rim, moss_block soil on the floor, a concrete post in the centre carrying a standing
 * redstone_torch at y 71. Footprint: 5x5, y 68..71.
 */
export function plantBox(g, cx, cz, opts = {}) {
  const box = [cx - 2, 68, cz - 2, cx + 2, 71, cz + 2];
  const w = writer(g, box, opts);
  for (let x = cx - 2; x <= cx + 2; x++) for (let z = cz - 2; z <= cz + 2; z++) {
    const rim = Math.abs(x - cx) === 2 || Math.abs(z - cz) === 2;
    if (rim) for (let y = 68; y <= 70; y++) w.set(x, y, z, "light_gray_concrete");
    else w.set(x, 68, z, "moss_block");
  }
  w.set(cx, 69, cz, "light_gray_concrete");
  w.set(cx, 70, cz, "light_gray_concrete");
  w.set(cx, 71, cz, "redstone_torch", { lit: "true" });
  return w.out;
}

/**
 * canopyLight: sea_lantern flush in the portico canopy underside at (x, 12, z) (plan: every 4 cells).
 */
export function canopyLight(g, x, z, opts = {}) {
  const w = writer(g, [x, 12, z, x, 12, z], opts);
  w.set(x, 12, z, "sea_lantern");
  return w.out;
}

/**
 * slabRamp: bottom polished_andesite slabs over the box (half steps only, no stairs). Plan: a 2-cell-long ramp
 * across the portico width, e.g. [0, 1, 170, 1, 1, 207]. Both spans must be at least 2 cells.
 */
export function slabRamp(g, box, opts = {}) {
  const [x0, , z0, x1, , z1] = ordered(box);
  if (x1 - x0 + 1 < 2 || z1 - z0 + 1 < 2) throw new Error(`slabRamp needs at least 2 cells in x and z, got ${box}`);
  const [block, state] = B.slab("polished_andesite", "bottom");
  const w = writer(g, box, opts);
  eachCell(box, (x, y, z) => w.set(x, y, z, block, state));
  return w.out;
}

/**
 * flagpole: stone base (y 1..2), iron_bars pole (y 3..20), lightning_rod tip (y 21) at (x, z), and one wall banner
 * at y 18 on the `side` of the pole (default west). kind: "national" (red, blue canton) or "city" (white).
 * Footprint: the pole column plus the banner cell.
 */
export function flagpole(g, x, z, kind = "city", side = "west", opts = {}) {
  const d = SIDE[side];
  if (!d) throw new Error(`side must be west, east, north or south, got ${side}`);
  const banner = kind === "national" ? B.banner("red", [["square_top_left", "blue"]], { facing: side })
    : kind === "city" ? B.banner("white", [], { facing: side })
      : null;
  if (!banner) throw new Error(`kind must be national or city, got ${kind}`);
  const box = [x, 1, z, x + d[0], 21, z + d[1]];
  const w = writer(g, box, opts);
  for (let y = 1; y <= 2; y++) w.set(x, y, z, "polished_andesite");
  for (let y = 3; y <= 20; y++) w.set(x, y, z, "iron_bars");
  w.set(x, 21, z, "lightning_rod", { facing: "up", powered: "false" });
  w.set(x + d[0], 18, z + d[1], ...banner);
  return w.out;
}

/**
 * fountain: a basin over the box (plan: CN/CS basins, y 1..2). Quartz walls and rim round the edge, water inside.
 * Arguments: the basin's inclusive box, e.g. [76, 1, 81, 85, 2, 90].
 */
export function fountain(g, box, opts = {}) {
  const [x0, , z0, x1, , z1] = ordered(box);
  const w = writer(g, box, opts);
  eachCell(box, (x, y, z) => {
    const edge = x === x0 || x === x1 || z === z0 || z === z1;
    if (edge) w.set(x, y, z, "smooth_quartz");
    else w.set(x, y, z, "water");
  });
  return w.out;
}
