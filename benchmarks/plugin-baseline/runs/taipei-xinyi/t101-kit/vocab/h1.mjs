// vocab/h1.mjs: the part helpers from plan.md VOCABULARY (notchRing, stepCourse, litBand, ruyi, hallGlazing, shopBay,
// mallSign, planter, aircraftLight). Coordinates are the grid's own (plot-local). Faces: "north" | "south" | "east" | "west".
// Writes go only into air inside the helper's own footprint; `over: true` replaces what is there, still inside it.
// Each writer returns { placed, refused }; refused lists [x, y, z] cells skipped because they were not air.
import { plaque } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// outward step across each wall, and whether the wall runs along x (north, south) or along z (east, west)
const WALL = {
  north: { step: -1, alongX: true },
  south: { step: 1, alongX: true },
  east: { step: 1, alongX: false },
  west: { step: -1, alongX: false },
};
// the leaves state set tools/src/terrain.mjs writes; persistent so they never decay
const LEAVES = { persistent: "true", distance: "1", waterlogged: "false" };

const tally = () => ({ placed: 0, refused: [] });

function put(g, t, [x, y, z], block, { state, over = false } = {}) {
  if (!over && !g.isAir(x, y, z)) return void t.refused.push([x, y, z]);
  g.set(x, y, z, block, state);
  t.placed++;
}

// a cell on a wall: `along` runs along the wall, `plane` is the wall's coordinate across it, `y` is height
const faceCell = (face, along, plane, y) => (WALL[face].alongX ? [along, y, plane] : [plane, y, along]);

// the wall plane of a module box (box = [x0, z0, x1, z1], the outer square) at inset k
const wallPlane = (box, face, k) =>
  face === "north" ? box[1] + k : face === "south" ? box[3] - k : face === "west" ? box[0] + k : box[2] - k;

/** Plan ring of a band: the square x0..x1, z0..z1 with the double-sawtooth notch at each corner (cells with (a<2 && b<4)
 *  or (a<4 && b<2) left out, a and b counted from that corner). Returns [[x, z], ...]: the cells of the notched plan that
 *  have a 4-neighbour outside it, so noses sit at (4,0), (2,2), (0,4) from each corner. */
export function notchRing(x0, z0, x1, z1) {
  const inPlan = (x, z) => {
    if (x < x0 || x > x1 || z < z0 || z > z1) return false;
    return ![[x - x0, z - z0], [x1 - x, z - z0], [x - x0, z1 - z], [x1 - x, z1 - z]].some(
      ([a, b]) => (a < 2 && b < 4) || (a < 4 && b < 2),
    );
  };
  const out = [];
  for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
    if (inPlan(x, z) && (!inPlan(x - 1, z) || !inPlan(x + 1, z) || !inPlan(x, z - 1) || !inPlan(x, z + 1))) out.push([x, z]);
  }
  return out;
}

/** Step course at height y where the band steps: the new ring (inset insetNew of box) and the ring below it are
 *  dark_prismarine, which closes the soffit. taper (pedestal, stepping in): the ring below is the outer cell, a bottom
 *  dark_prismarine_slab sill. box = [x0, z0, x1, z1], the module's outer square. */
export function stepCourse(g, { box, insetNew, y, taper = false, over = false }) {
  const t = tally(), ring = (k) => notchRing(box[0] + k, box[1] + k, box[2] - k, box[3] - k);
  const below = taper ? insetNew - 1 : insetNew + 1;
  if (below < 0) throw new Error("stepCourse: a taper step needs insetNew >= 1");
  for (const [x, z] of ring(insetNew)) put(g, t, [x, y, z], "dark_prismarine", { over });
  for (const [x, z] of ring(below)) {
    if (taper) put(g, t, [x, y, z], "dark_prismarine_slab", { state: { type: "bottom" }, over });
    else put(g, t, [x, y, z], "dark_prismarine", { over });
  }
  return t;
}

/** Lit band at height y: light_blue_stained_glass on the ring of `ring` = [x0, z0, x1, z1], sea_lantern on the ring
 *  one cell inside it. */
export function litBand(g, { y, ring: box, over = false }) {
  const t = tally();
  for (const [x, z] of notchRing(...box)) put(g, t, [x, y, z], "light_blue_stained_glass", { over });
  for (const [x, z] of notchRing(box[0] + 1, box[1] + 1, box[2] - 1, box[3] - 1)) put(g, t, [x, y, z], "sea_lantern", { over });
  return t;
}

// plan.md's ruyi, row y0 first (X = block, E = eye: gray_concrete)
const RUYI = ["..XXXX..", "...XX...", "...XX...", "..XXXX..", ".XXXXXX.", "XXXXXXXX", "XXXEEXXX", ".XXXXXX.", "..XXXX.."];

/** Ruyi ornament on a face, 8 wide: cells center-4 .. center+3 along the wall (so plan.md's 34..41 is center 38). Its foot
 *  is at y0 (default 0, a segment's foot) and its lower part sits one cell proud of the wall, at z0 (or x0 on east and
 *  west); the head (y 6..8) steps one further out. Smooth_quartz outlines the head, iron_block fills the rest. */
export function ruyi(g, face, center, z0, { y0 = 0, over = false } = {}) {
  const t = tally(), { step } = WALL[face];
  const solid = (r, c) => r >= 0 && r < RUYI.length && c >= 0 && c < 8 && RUYI[r][c] !== ".";
  RUYI.forEach((row, r) => {
    for (let c = 0; c < 8; c++) {
      if (row[c] === ".") continue;
      const edge = !solid(r - 1, c) || !solid(r + 1, c) || !solid(r, c - 1) || !solid(r, c + 1);
      const block = row[c] === "E" ? "gray_concrete" : r >= 5 && edge ? "smooth_quartz" : "iron_block";
      put(g, t, faceCell(face, center - 4 + c, r >= 6 ? z0 + step : z0, y0 + r), block, { over });
    }
  });
  return t;
}

/** Tower hall glazing on a face: glass across range = [a, b] (along the wall) for y0..y1, with light_gray_concrete
 *  mullions every 2 (on the module's parity, like the grid), a door gap left open up to gapTop, and an ochre_froglight one
 *  cell inside every 3rd cell (every 3rd row too). box = the module's outer square; insetAt(y) is the taper inset at
 *  height y (default 0, a straight wall). Replacing the tower's own glass needs over: true. */
export function hallGlazing(g, face, [a, b], y0, y1, { box, insetAt = () => 0, gap = null, gapTop = 8, over = false } = {}) {
  if (!box) throw new Error("hallGlazing: pass box, the module's outer square [x0, z0, x1, z1]");
  const t = tally(), { step, alongX } = WALL[face], along0 = alongX ? box[0] : box[1];
  for (let y = y0; y <= y1; y++) {
    const plane = wallPlane(box, face, insetAt(y));
    for (let c = a; c <= b; c++) {
      if (gap && c >= gap[0] && c <= gap[1] && y <= gapTop) continue;
      const mullion = (c - along0) % 2 === 1;
      put(g, t, faceCell(face, c, plane, y), mullion ? "light_gray_concrete" : "glass", { over });
      if ((c - a) % 3 === 0 && (y - y0) % 3 === 0) put(g, t, faceCell(face, c, plane - step, y), "ochre_froglight", { over });
    }
  }
  return t;
}

/** Ground-floor shopfront bay: glass y3..10 on the wall plane across range = [a, b], one ochre_froglight one cell inside the
 *  middle, smooth_quartz fascia y11..12. bay = { face, range, plane, over? }. */
export function shopBay(g, { face, range: [a, b], plane, over = false }) {
  const t = tally(), { step } = WALL[face], mid = Math.floor((a + b) / 2);
  for (let c = a; c <= b; c++) {
    for (let y = 3; y <= 10; y++) put(g, t, faceCell(face, c, plane, y), "glass", { over });
    for (let y = 11; y <= 12; y++) put(g, t, faceCell(face, c, plane, y), "smooth_quartz", { over });
  }
  put(g, t, faceCell(face, mid, plane - step, 5), "ochre_froglight", { over });
  return t;
}

/** Sign band on a face of the mall: gray_concrete across range = [a, b] for y0..y1 on the wall plane, with `text` in
 *  sea_lantern block letters centred on it (plaque). The band is the sign writer's own cells, so it replaces what is there. */
export function mallSign(g, { face, range: [a, b], y0, y1, plane, text = "TAIPEI 101 MALL", letter = "sea_lantern" }) {
  const t = tally();
  for (let c = a; c <= b; c++) for (let y = y0; y <= y1; y++) put(g, t, faceCell(face, c, plane, y), "gray_concrete", { over: true });
  const at = faceCell(face, Math.floor((a + b) / 2), plane, Math.floor((y0 + y1) / 2));
  // material null: the letters recolour the band; no frame, so nothing is written outside it
  const p = plaque(g, text, { at, face, width: b - a + 1, height: y1 - y0 + 1, letter, material: null, frame: null, style: "block" });
  return { placed: t.placed + p.cells, refused: t.refused, notes: p.notes };
}

/** Planter: a smooth_quartz box over box = [x0, z0, x1, z1] at height y, with a smooth_quartz rim at y + 1 and persistent
 *  oak_leaves inside it. Two high with the leaves, so keep the lane clear past it. */
export function planter(g, [x0, z0, x1, z1], y, { over = false } = {}) {
  const t = tally();
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    put(g, t, [x, y, z], "smooth_quartz", { over });
    const inner = x > x0 && x < x1 && z > z0 && z < z1;
    put(g, t, [x, y + 1, z], inner ? "oak_leaves" : "smooth_quartz", { state: inner ? LEAVES : undefined, over });
  }
  return t;
}

/** Aircraft warning light at [x, y, z]. kind "2x2": a 2x2 sea_lantern (x..x+1, z..z+1) ringed by 12 red_stained_glass.
 *  kind "1x1": a sea_lantern at [x, y, z] with red_stained_glass on its 4 sides. centre: the block for the lit cells;
 *  null leaves them alone (an end rod already there). The spire's own cells need over: true. */
export function aircraftLight(g, [x, y, z], kind, { over = false, centre = "sea_lantern" } = {}) {
  const t = tally();
  if (kind === "2x2") {
    for (let dx = -1; dx <= 2; dx++) for (let dz = -1; dz <= 2; dz++) {
      const lit = dx >= 0 && dx <= 1 && dz >= 0 && dz <= 1;
      if (!lit) put(g, t, [x + dx, y, z + dz], "red_stained_glass", { over });
      else if (centre) put(g, t, [x + dx, y, z + dz], centre, { over });
    }
  } else if (kind === "1x1") {
    if (centre) put(g, t, [x, y, z], centre, { over });
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) put(g, t, [x + dx, y, z + dz], "red_stained_glass", { over });
  } else throw new Error(`aircraftLight: kind must be "2x2" or "1x1", got ${kind}`);
  return t;
}
