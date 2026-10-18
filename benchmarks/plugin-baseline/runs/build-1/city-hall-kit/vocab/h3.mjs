// H3 vocabulary for the City Hall kit (plan.md VOCABULARY, items 3, 6, 8, 12, 15, 18, 21, 24, 27, 30): ground,
// terraceAndFloor, attic, doricColumn, cornice, upperSills, archedDoorway, drumWindow, lanternTemple, lampStandard.
// Every position and facing is an argument, every write is air-only (an earlier part's cell is left alone), and a
// helper writes only inside the cells its arguments name. Positions in the plan's absolute coordinates; the dome
// centre (cx, cz) is a half-integer, 31.5 in the plan.
import { Grid, dome } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const clear = (g, x, y, z) => g.inBounds(x, y, z) && g.isAir(x, y, z);
const solid = (g, x, y, z) => g.inBounds(x, y, z) && !g.isAir(x, y, z);

// One air-only write. Returns 1 if placed, 0 if the cell is outside the grid or already filled.
function put(g, x, y, z, block, state, over = false) {
  if (!g.inBounds(x, y, z) || (!over && !g.isAir(x, y, z))) return 0;
  g.set(x, y, z, block, state);
  return 1;
}

// Compass direction of a step (vx, vz) in the world; ties go to the north-south axis.
const vecDir = (vx, vz) => (Math.abs(vx) > Math.abs(vz) ? (vx > 0 ? "east" : "west") : vz > 0 ? "south" : "north");

// Face frame tokens: out = toward the street, in = into the building, left/right = along the face (u decreasing / increasing).
const STEP = { out: [0, -1], in: [0, 1], left: [-1, 0], right: [1, 0] };

// Compass direction of a step (du along the face, dd in from the edge) on frame F (faceFrame: F.at(u, d) -> [x, z]).
function compass(F, du, dd) {
  const [x0, z0] = F.at(0, 0), [x1, z1] = F.at(du, dd);
  return vecDir(x1 - x0, z1 - z0);
}

// Turns facing tokens into compass names; compass names pass through.
const resolve = (F, state) => (state && STEP[state.facing] ? { ...state, facing: compass(F, ...STEP[state.facing]) } : state);

// One write through the face frame (plan rule 2): u along the face, d in from the edge, y the world height.
function fset(g, F, u, d, y, block, state, over) {
  const [x, z] = F.at(u, d);
  return put(g, x, y, z, block, resolve(F, state), over);
}

// glassRun connections (plan rule 19): the two along-face sides connect, the other two stay apart.
function paneStates(F) {
  const along = [compass(F, 1, 0), compass(F, -1, 0)];
  return Object.fromEntries(["north", "east", "south", "west"].map((c) => [c, String(along.includes(c))]));
}

/** ground(g, x0, z0, x1, z1): smooth_stone at y 0 over the plot. */
export function ground(g, x0, z0, x1, z1) {
  let n = 0;
  for (const x of range(x0, x1)) for (const z of range(z0, z1)) n += put(g, x, 0, z, "smooth_stone");
  return n;
}

/** terraceAndFloor(g, F, u0, u1, p, dBack, y): one smooth_stone course at y, from d p to dBack. The front cell (d p) is
 *  the string course rusticatedBase already placed, so the air-only write leaves it. */
export function terraceAndFloor(g, F, u0, u1, p, dBack, y) {
  let n = 0;
  for (const u of range(u0, u1)) for (const d of range(p, dBack)) n += fset(g, F, u, d, y, "smooth_stone");
  return n;
}

/** attic(g, F, u0, u1, a, y0, y1, { windows, wy, over }): polished_diorite at d a..a+1, y0..y1. windows: [[u0, u1], ...]
 *  open at the rows wy ([lo, hi]); an open cell leaves d a air and d a+1 empty for the glass. over lets it replace filled cells. */
export function attic(g, F, u0, u1, a, y0, y1, { windows = [], wy = [], over = false } = {}) {
  const [wLo, wHi] = Array.isArray(wy) ? wy : [wy, wy];
  let n = 0;
  for (const u of range(u0, u1)) for (const y of range(y0, y1)) {
    const open = windows.some(([a0, a1]) => u >= a0 && u <= a1) && y >= wLo && y <= wHi;
    if (!open) for (const d of [a, a + 1]) n += fset(g, F, u, d, y, "polished_diorite", null, over);
  }
  return n;
}

/** doricColumn(g, x0, z0, y0, y1): a 2x2 column on x0..x0+1, z0..z0+1: polished_diorite foot at y0, quartz_pillar shafts
 *  (axis y) to y1-1, smooth_quartz capital at y1. */
export function doricColumn(g, x0, z0, y0, y1) {
  let n = 0;
  for (const x of [x0, x0 + 1]) for (const z of [z0, z0 + 1]) {
    n += put(g, x, y0, z, "polished_diorite");
    for (const y of range(y0 + 1, y1 - 1)) n += put(g, x, y, z, "quartz_pillar", { axis: "y" });
    n += put(g, x, y1, z, "smooth_quartz");
  }
  return n;
}

/** cornice(g, F, u0, u1, d, y, { shapes }): smooth_quartz_stairs, half top, facing into the wall, along u at depth d.
 *  shapes: { [u]: "outer_left" | "outer_right" } for a corner cell where two faces meet. */
export function cornice(g, F, u0, u1, d, y, { shapes = {} } = {}) {
  let n = 0;
  for (const u of range(u0, u1)) n += fset(g, F, u, d, y, "smooth_quartz_stairs", { facing: "in", half: "top", shape: shapes[u] ?? "straight" });
  return n;
}

/** upperSills(g, F, u0, w, yLo, yHi): two cells from u0 at d w-1: a bottom slab at yLo (on the terrace) and a top slab at yHi. */
export function upperSills(g, F, u0, w, yLo, yHi) {
  let n = 0;
  for (const u of [u0, u0 + 1]) {
    n += fset(g, F, u, w - 1, yLo, "polished_diorite_slab", { type: "bottom" });
    n += fset(g, F, u, w - 1, yHi, "polished_diorite_slab", { type: "top" });
  }
  return n;
}

/** archedDoorway(g, F, u0, yG): one arch, u0..u0+3 by d 0..3, with its landing at yG (the ground, 1 in the plan).
 *  Two pairs of dark_oak_door (hinges left, right, left, right) at d 3, y yG+1..yG+2; transom glass at y yG+3..yG+6; a
 *  smooth_quartz head course over the passage at yG+7 with chiseled keystones. The passage above the landing stays air. */
export function archedDoorway(g, F, u0, yG) {
  const us = range(u0, u0 + 3);
  const glass = paneStates(F);
  let n = 0;
  for (const u of us) {
    n += fset(g, F, u, 0, yG, "polished_diorite_slab", { type: "bottom" });
    for (const d of [1, 2, 3]) n += fset(g, F, u, d, yG, "polished_diorite");
  }
  for (const u of us) for (const [half, dy] of [["lower", 1], ["upper", 2]]) {
    n += fset(g, F, u, 3, yG + dy, "dark_oak_door", { facing: "out", half, hinge: (u - u0) % 2 === 0 ? "left" : "right", open: "false" });
  }
  for (const u of us) for (const dy of [3, 4, 5]) n += fset(g, F, u, 3, yG + dy, "gray_stained_glass_pane", glass);
  for (const u of [u0 + 1, u0 + 2]) n += fset(g, F, u, 3, yG + 6, "gray_stained_glass_pane", glass);
  for (const d of [1, 2]) {
    n += fset(g, F, u0, d, yG + 6, "smooth_quartz_stairs", { facing: "left", half: "top" });
    n += fset(g, F, u0 + 3, d, yG + 6, "smooth_quartz_stairs", { facing: "right", half: "top" });
  }
  for (const u of us) for (const d of [1, 2]) {
    const keystone = d === 1 && u > u0 && u < u0 + 3;
    n += fset(g, F, u, d, yG + 7, keystone ? "chiseled_quartz_block" : "smooth_quartz");
  }
  return n;
}

// Round a lantern or chain up to the ring test: a < r <= b (plan convention).
const inRing = (r, lo, hi) => r > lo && r <= hi;

// A lantern hanging at y on `chain` chain cells above it, under a solid block (plan rule 29). Writes nothing if the chain
// or the block above is missing, so the lane under the lantern is never blocked.
function hangingLantern(g, x, y, z, chain = 0) {
  const cells = [y, ...range(y + 1, y + chain)];
  if (!cells.every((cy) => clear(g, x, cy, z)) || !solid(g, x, y + chain + 1, z)) return 0;
  let n = 0;
  for (const cy of range(y + 1, y + chain)) n += put(g, x, cy, z, "chain", { axis: "y" });
  return n + put(g, x, y, z, "lantern", { hanging: "true" });
}

/** drumWindow(g, cx, cz, angleDeg, width, yG = 44): one window in the drum (plan rule 24). Axis at angleDeg (0 = north,
 *  clockwise), cells within ±width/2 of it. Glass on the inner wall cells for y yG..yG+13 (outer cells stay air), a sill
 *  at yG-1, a round head at yG+14 on the edge cells, a pediment hood at yG+15 with a slab over the middle at yG+16. */
export function drumWindow(g, cx, cz, angleDeg, width, yG = 44) {
  const a = (angleDeg * Math.PI) / 180;
  const ux = Math.sin(a), uz = -Math.cos(a);             // outward along the axis
  const nx = uz, nz = -ux;                              // the direction the signed side distance grows in
  const side = (dx, dz) => dx * uz - dz * ux;
  const half = width / 2, EPS = 1e-9;
  const band = [];                                      // cells in the window band, rings 18.5..21.5
  for (let x = Math.floor(cx - 22); x <= Math.ceil(cx + 22); x++) for (let z = Math.floor(cz - 22); z <= Math.ceil(cz + 22); z++) {
    const dx = x - cx, dz = z - cz, r = Math.hypot(dx, dz), p = side(dx, dz);
    if (inRing(r, 18.5, 21.5) && Math.abs(p) <= half + EPS) band.push({ x, z, r, p });
  }
  const glass = band.filter((c) => c.r <= 19.5);
  const glassKeys = new Set(glass.map((c) => `${c.x},${c.z}`));
  const solidWall = (x, z) => {
    const dx = x - cx, dz = z - cz;
    return inRing(Math.hypot(dx, dz), 18.5, 20.5) && Math.abs(side(dx, dz)) > half + EPS;
  };
  const link = (x, z) => glassKeys.has(`${x},${z}`) || solidWall(x, z);
  let n = 0;
  for (const c of glass) {
    const panes = { north: String(link(c.x, c.z - 1)), south: String(link(c.x, c.z + 1)), west: String(link(c.x - 1, c.z)), east: String(link(c.x + 1, c.z)) };
    for (let y = yG; y <= yG + 13; y++) n += put(g, c.x, y, c.z, "gray_stained_glass_pane", panes);
  }
  for (const c of band) {
    if (c.r > 20.5) n += put(g, c.x, yG - 1, c.z, "smooth_quartz_slab", { type: "bottom" });
  }
  for (const c of band) {
    if (c.r <= 20.5 && Math.abs(c.p) > half - 1 + EPS) {
      const s = Math.sign(c.p);                        // the outermost cells: head faces away from the opening
      n += put(g, c.x, yG + 14, c.z, "smooth_quartz_stairs", { facing: vecDir(s * nx, s * nz), half: "top" });
    }
  }
  for (const c of band) {
    if (c.r <= 20.5) continue;
    if (Math.abs(c.p) < EPS) n += put(g, c.x, yG + 15, c.z, "smooth_quartz_slab", { type: "bottom" });
    else {
      const s = Math.sign(c.p);                        // the hood rises to the middle of the opening
      n += put(g, c.x, yG + 15, c.z, "smooth_quartz_stairs", { facing: vecDir(-s * nx, -s * nz), half: "bottom" });
    }
    if (Math.abs(c.p) < 1) n += put(g, c.x, yG + 16, c.z, "smooth_quartz_slab", { type: "bottom" });
  }
  return n;
}

/** lanternTemple(g, cx, cz, yP): the lantern temple (plan rule 27) on the platform at yP (101 in the plan): platform,
 *  eight posts with gold capitals, a glass ring, a ceiling, a gilded cupola and a finial. Hanging lanterns under the ceiling. */
export function lanternTemple(g, cx, cz, yP) {
  let n = 0;
  const posts = [[-2.5, -4.5], [2.5, -4.5], [4.5, -2.5], [4.5, 2.5], [2.5, 4.5], [-2.5, 4.5], [-4.5, 2.5], [-4.5, -2.5]];
  const glassRing = (x, z) => inRing(Math.hypot(x - cx, z - cz), 3.5, 4.5);
  const panes = (x, z) => ({ north: String(glassRing(x, z - 1)), south: String(glassRing(x, z + 1)), west: String(glassRing(x - 1, z)), east: String(glassRing(x + 1, z)) });
  for (const x of range(Math.floor(cx - 7), Math.ceil(cx + 7))) for (const z of range(Math.floor(cz - 7), Math.ceil(cz + 7))) {
    const r = Math.hypot(x - cx, z - cz);
    if (r <= 5.5) {
      n += put(g, x, yP, z, "smooth_quartz");
      n += put(g, x, yP + 8, z, "smooth_quartz");
      n += put(g, x, yP + 10, z, "gold_block");
    }
    if (glassRing(x, z)) {
      n += put(g, x, yP + 1, z, "smooth_quartz");
      for (let y = yP + 2; y <= yP + 6; y++) n += put(g, x, y, z, "gray_stained_glass_pane", panes(x, z));
    }
    if (inRing(r, 3.5, 5.5)) n += put(g, x, yP + 9, z, "smooth_quartz");
    if (inRing(r, 5.5, 6.5)) n += put(g, x, yP + 9, z, "smooth_quartz_stairs", { facing: vecDir(cx - x, cz - z), half: "top" });
  }
  for (const [dx, dz] of posts) {
    const x = cx + dx, z = cz + dz;
    for (let y = yP + 1; y <= yP + 6; y++) n += put(g, x, y, z, "quartz_pillar", { axis: "y" });
    n += put(g, x, yP + 7, z, "gold_block");
  }
  // the cupola goes into a scratch grid, then its cells are copied in air-only
  const scratch = new Grid(g.size, { dataVersion: g.dataVersion });
  dome(scratch, { center: [cx, yP + 11, cz], radius: 3.5, height: 7, block: "gold_block", edge: "none" });
  for (const c of scratch.solids()) n += put(g, c.pos[0], c.pos[1], c.pos[2], c.block, c.state);
  for (const x of [cx - 0.5, cx + 0.5]) for (const z of [cz - 0.5, cz + 0.5]) {
    for (let y = yP + 18; y <= yP + 23; y++) n += put(g, x, y, z, y === yP + 20 ? "smooth_quartz" : "gold_block");
    n += put(g, x, yP + 24, z, "lightning_rod", { facing: "up" });
  }
  n += hangingLantern(g, cx - 0.5, yP + 7, cz - 0.5);
  n += hangingLantern(g, cx + 0.5, yP + 7, cz + 0.5);
  return n;
}

/** lampStandard(g, x, y, z): a 1x1 lamp on the floor at y: polished_diorite foot, diorite_wall shaft at y+1..y+2 and a
 *  standing lantern at y+3. Writes only its own column, so the cells beside it stay clear for a 2-high lane. */
export function lampStandard(g, x, y, z) {
  if (!solid(g, x, y - 1, z) || ![0, 1, 2, 3].every((i) => clear(g, x, y + i, z))) return 0;
  let n = put(g, x, y, z, "polished_diorite");
  n += put(g, x, y + 1, z, "diorite_wall", { up: "true" });
  n += put(g, x, y + 2, z, "diorite_wall", { up: "true" });
  return n + put(g, x, y + 3, z, "lantern", { hanging: "false" });
}
