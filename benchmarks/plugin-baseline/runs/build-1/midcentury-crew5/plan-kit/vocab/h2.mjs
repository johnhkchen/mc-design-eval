// Vocabulary helpers (h2): one exported function per name in plan.md's VOCABULARY, placed through the build library.
// Every helper takes its position (and facing) as arguments. Each writes only its own footprint, only into air, and never
// below it (ground, sand and floors belong to earlier parts). `over` lists the block ids a helper may replace: joint_row
// over the driveway's smooth_stone, for example. fascia_ring only swaps the roof's own slabs.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const bare = (id) => id.replace(/^minecraft:/, "");
const FACING = ["north", "south", "east", "west"];

// place one [block, state] at [x, y, z] if the cell is air or holds a block named in `over`
function set(g, [x, y, z], [block, state], over = []) {
  if (!g.isAir(x, y, z) && !over.includes(bare(g.blockAt(x, y, z)))) return;
  g.set(x, y, z, block, state);
}
const span = (a, b) => Array.from({ length: Math.abs(b - a) + 1 }, (_, i) => Math.min(a, b) + i);
const need = (v, list, what) => {
  if (!list.includes(v)) throw new Error(`${what} must be one of ${list.join(", ")}, got ${v}`);
  return v;
};
// deterministic per-cell value in [0, 1): the same seed and cell always give the same fleck
function hash01(x, z, seed) {
  let h = (Math.imul(x, 374761393) + Math.imul(z, 668265263) + Math.imul(seed, 2147483647)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

// ---- exterior -----------------------------------------------------------------------------------------------------

/** dark_oak_planks over the rectangle x0..x1 x z0..z1 at height y, skipping the beam-line columns (x = 10, 13, ..., 31) so
 *  the roof's logs go there. */
export function header_course(g, x0, z0, x1, z1, y, { over = [] } = {}) {
  const beamLine = (x) => x >= 10 && x <= 31 && (x - 10) % 3 === 0;
  for (const x of span(x0, x1)) {
    if (beamLine(x)) continue;
    for (const z of span(z0, z1)) set(g, [x, y, z], ["dark_oak_planks"], over);
  }
}

/** Clerestory strip at height y, row z: glass in x0..x0+2, x0+4..x0+5 and x0+7..x0+8, dark_oak_log mullions (axis y) at
 *  x0+3 and x0+6. (x0 = 22 gives plan.md's strip: glass 22..24, 26..27, 29..30; mullions 25, 28.) */
export function clerestory(g, x0, z, y, { over = [] } = {}) {
  for (const dx of [0, 1, 2, 4, 5, 7, 8]) set(g, [x0 + dx, y, z], B.pane(), over);
  for (const dx of [3, 6]) set(g, [x0 + dx, y, z], B.log("dark_oak", "y"), over);
}

/** Fascia: the roof's outermost ring and the edge of each hole (roof.holes: [{x0,z0,x1,z1}]) are dark_oak_slab, keeping the
 *  half of the roof slab already there. Only smooth_stone_slab cells in y0..y1 are swapped; nothing else is written. */
export function fascia_ring(g, { x0, x1, z0, z1, holes = [] }, y0, y1) {
  const inHole = (x, z) => holes.some((h) => x >= h.x0 && x <= h.x1 && z >= h.z0 && z <= h.z1);
  const nextToHole = (x, z) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => inHole(x + dx, z + dz));
  for (const x of span(x0, x1)) for (const z of span(z0, z1)) {
    if (inHole(x, z)) continue;
    if (!(x === x0 || x === x1 || z === z0 || z === z1 || nextToHole(x, z))) continue;
    for (const y of span(y0, y1)) {
      const cell = g.get(x, y, z);
      if (cell?.block !== "minecraft:smooth_stone_slab") continue;
      g.set(x, y, z, "dark_oak_slab", { type: cell.state?.type ?? "bottom", waterlogged: "false" });
    }
  }
}

/** light_gray_concrete joint across the driveway: x0..x1 along row z at height y (0 = the paving). Pass
 *  { over: ["smooth_stone"] } to cut the joint into a driveway already laid. */
export function joint_row(g, x0, x1, z, y, { over = [] } = {}) {
  for (const x of span(x0, x1)) set(g, [x, y, z], ["light_gray_concrete"], over);
}

/** Saguaro at (x, z): cactus trunk from y=1 to y=h; with h = 3, an arm on the west side (x-1) at y=2..3. The sand under it
 *  is the site's ground, so nothing is written at y=0. */
export function saguaro(g, x, z, h, { over = [] } = {}) {
  for (let y = 1; y <= h; y++) set(g, [x, y, z], ["cactus"], over);
  if (h === 3) for (const y of [2, 3]) set(g, [x - 1, y, z], ["cactus"], over);
}

// ---- patio and interior ---------------------------------------------------------------------------------------------

/** Two-cell lounger on the patio at height y=1: the foot cell (x, z) is a smooth_quartz slab, the head is the next cell along
 *  axis ("x" or "z") and is a smooth_quartz stair facing the foot. */
export function lounger(g, x, z, axis, { over = [] } = {}) {
  need(axis, ["x", "z"], "axis");
  const [hx, hz] = axis === "x" ? [x + 1, z] : [x, z + 1];
  const facing = axis === "x" ? "west" : "north";
  set(g, [x, 1, z], B.slab("smooth_quartz", "bottom"), over);
  set(g, [hx, 1, hz], B.stairs("smooth_quartz", facing, "bottom"), over);
}

/** Terrazzo floor under a room box [x0,y0,z0,x1,y1,z1]: the floor is the layer under the room's air (y0 - 1). Smooth_stone
 *  with ~12% light_gray_concrete and ~6% white_concrete flecks, each cell from the seed. */
export function terrazzo_floor(g, [x0, y0, z0, x1, , z1], { seed = 1, over = [] } = {}) {
  const y = y0 - 1;
  for (const x of span(x0, x1)) for (const z of span(z0, z1)) {
    const r = hash01(x, z, seed);
    const block = r < 0.06 ? "white_concrete" : r < 0.18 ? "light_gray_concrete" : "smooth_stone";
    set(g, [x, y, z], [block], over);
  }
}

/** Sideboard of len cells from (x, z) along axis ("x" or "z"), fronts facing `facing`: closed birch trapdoors in the top half of
 *  y=2 as the cabinet fronts, a birch slab counter at y=3 on them. */
export function sideboard(g, x, z, len, axis, facing, { over = [] } = {}) {
  need(axis, ["x", "z"], "axis");
  need(facing, FACING, "facing");
  for (let i = 0; i < len; i++) {
    const [cx, cz] = axis === "x" ? [x + i, z] : [x, z + i];
    set(g, [cx, 2, cz], B.trapdoor("birch", facing, "top", false), over);
    set(g, [cx, 3, cz], B.slab("birch", "bottom"), over);
  }
}

/** Dining set for six, table cells x..x+1 by z..z+2: spruce fence legs at the four corners (y=2) and a spruce slab top (y=3);
 *  birch stair chairs, three on each long side (x-1 and x+2), facing the table; a hanging lantern at (x+1, 4, z+1) when a block
 *  is above it (a beam). Footprint x-1..x+2 by z..z+2, y=2..4. */
export function dining_set(g, x, z, { over = [] } = {}) {
  for (const [lx, lz] of [[x, z], [x + 1, z], [x, z + 2], [x + 1, z + 2]]) set(g, [lx, 2, lz], B.fence("spruce"), over);
  for (const tx of [x, x + 1]) for (const tz of span(z, z + 2)) set(g, [tx, 3, tz], B.slab("spruce", "bottom"), over);
  for (const cz of span(z, z + 2)) {
    set(g, [x - 1, 2, cz], B.stairs("birch", "east", "bottom"), over);
    set(g, [x + 2, 2, cz], B.stairs("birch", "west", "bottom"), over);
  }
  if (!g.isAir(x + 1, 5, z + 1)) set(g, [x + 1, 4, z + 1], B.lantern(true), over);
}

/** Bath fit for a 2x3 room at (x, z), its back wall on the `back` side ("north" or "south"): a cauldron basin on the back row
 *  (y=2), a glass mirror above it (y=3..4), a quartz stair WC beside it facing into the room. The other two rows stay clear. */
export function bath_fit(g, x, z, back = "north", { over = [] } = {}) {
  need(back, ["north", "south"], "back");
  const row = back === "north" ? z : z + 2;
  const into = back === "north" ? "south" : "north";
  set(g, [x, 2, row], ["cauldron"], over);
  for (const y of [3, 4]) set(g, [x, y, row], B.pane(), over);
  set(g, [x + 1, 2, row], B.stairs("quartz", into, "bottom"), over);
}
