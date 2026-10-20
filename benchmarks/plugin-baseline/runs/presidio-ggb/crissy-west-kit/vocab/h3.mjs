// Named helpers from plan.md VOCABULARY (this file's share): floorDeck, tallWindow, doorPair, awning, doorStep,
// smallTree, eaveLantern. Each takes its position (and facing, where it has one) as arguments; plan.md's numbers are
// only what the caller passes in. Every helper writes only the cells of the footprint its arguments define, and only
// into air: a cell an earlier part built (wall, ground, floor) is skipped and reported, never overwritten. The one
// exception is tallWindow's quartz jambs, which replace the wall beside the opening (plan.md's window frame).
// Each returns { placed, refused, skipped } (lists of [x, y, z]) so a caller can report what did not land.
import { B, DIRS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const span = (a, b) => Array.from({ length: Math.abs(b - a) + 1 }, (_, i) => Math.min(a, b) + i);
const entry = (pos, [block, state], extra = {}) => ({ pos, block, state, ...extra });
const wallRunsNS = (face) => face === "north" || face === "south";

// A cell on a wall. `fixed` is the wall's row (z on a north/south face) or column (x on an east/west face); `a` runs
// along the wall; `depth` steps outward from the wall (negative = inside the building).
function wallCell(face, fixed, a, y, depth = 0) {
  const [ox, , oz] = DIRS[face];
  return wallRunsNS(face) ? [a, y, fixed + depth * oz] : [fixed + depth * ox, y, a];
}

// Writes a plan of {pos, block, state, nbt, replace} entries in order. A cell that isn't air is refused unless the
// entry says replace. `inside` ([x0, z0, x1, z1]) and `cap` (top y) mark the plot limits: cells outside are skipped.
function commit(g, plan, { inside, cap } = {}) {
  const out = { placed: [], refused: [], skipped: [] };
  const [x0, z0, x1, z1] = inside ?? [0, 0, g.size[0] - 1, g.size[2] - 1];
  for (const { pos, block, state, nbt, replace } of plan) {
    const [x, y, z] = pos;
    if (!g.inBounds(x, y, z) || x < x0 || x > x1 || z < z0 || z > z1 || (cap !== undefined && y > cap)) {
      out.skipped.push(pos);
      continue;
    }
    if (!replace && !g.isAir(x, y, z)) {
      out.refused.push(pos);
      continue;
    }
    const before = g.refused?.length ?? 0;
    g.set(x, y, z, block, state, nbt);
    (g.refused?.length ?? 0) > before ? out.refused.push(pos) : out.placed.push(pos);
  }
  return out;
}

/** Upper-storey deck: birch_planks (or `material`) over the inclusive rect [x0, z0, x1, z1] at height y. */
export function floorDeck(g, [x0, z0, x1, z1], y, material = "birch_planks") {
  const plan = [];
  for (const x of span(x0, x1)) for (const z of span(z0, z1)) plan.push(entry([x, y, z], B.block(material)));
  return commit(g, plan);
}

/**
 * Two-wide, three-high window at y2..4 in a wall. (x, z) is the first cell of the run on the wall: the run goes +x on a
 * north/south face (wall row z), +z on an east/west face (wall column x). Glass fills the opening, quartz_slab top
 * sill sits on the inside row at y1, and quartz_block jambs replace the wall on either side (jambs: false to skip).
 */
export function tallWindow(g, x, z, face, { jambs = true } = {}) {
  const wallNS = wallRunsNS(face);
  const fixed = wallNS ? z : x, a0 = wallNS ? x : z;
  const pane = wallNS ? { north: "false", south: "false", east: "true", west: "true" }
    : { north: "true", south: "true", east: "false", west: "false" };
  const plan = [];
  for (const a of [a0, a0 + 1]) {
    for (let y = 2; y <= 4; y++) plan.push(entry(wallCell(face, fixed, a, y), ["glass_pane", pane]));
    plan.push(entry(wallCell(face, fixed, a, 1, -1), B.slab("quartz", "top")));
  }
  if (jambs) {
    for (const a of [a0 - 1, a0 + 2]) for (let y = 2; y <= 4; y++) plan.push(entry(wallCell(face, fixed, a, y), B.block("quartz_block"), { replace: true }));
  }
  return commit(g, plan);
}

/** A spruce door, both halves, in the opening at (x, z): facing out along `face`, hinge "left" or "right". */
export function doorPair(g, x, z, face, { hinge = "left" } = {}) {
  return commit(g, [1, 2].map((y) => entry([x, y, z], B.door("spruce", face, y === 1 ? "lower" : "upper", hinge))));
}

/** One course of dark_prismarine stairs along x0..x1 at row z, height y. `facing` is the high back (plan: south). */
export function awning(g, x0, x1, z, y, facing = "south") {
  return commit(g, span(x0, x1).map((x) => entry([x, y, z], B.stairs("dark_prismarine", facing, "bottom"))));
}

/**
 * The accessible half step outside a door of width w starting at (x, z) on `face`: bottom smooth_stone_slab at y1 in
 * the cell in front of it. Pass `inside` ([x0, z0, x1, z1]) to keep it on the plot; a door on the plot edge gets none.
 */
export function doorStep(g, x, z, face, w, { inside } = {}) {
  const wallNS = wallRunsNS(face);
  const fixed = wallNS ? z : x, a0 = wallNS ? x : z;
  const plan = span(a0, a0 + w - 1).map((a) => entry(wallCell(face, fixed, a, 1, 1), B.slab("smooth_stone", "bottom")));
  return commit(g, plan, { inside });
}

/**
 * Small tree on the ground at (x, z): oak_log trunk at y1..4, persistent oak_leaves crown (5 wide at y3..4 with the
 * corners off, 3 wide at y5). Pass `inside` and `cap` to keep the crown on the plot and under the cap. Writes no ground.
 */
export function smallTree(g, x, z, { inside, cap } = {}) {
  const plan = [];
  for (let y = 1; y <= 4; y++) plan.push(entry([x, y, z], B.log("oak", "y")));
  const leaves = ["oak_leaves", { persistent: "true", distance: "1", waterlogged: "false" }];
  for (const [y, r] of [[3, 2], [4, 2], [5, 1]]) {
    for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
      if (r === 2 && Math.abs(dx) === r && Math.abs(dz) === r) continue;
      if (y <= 4 && dx === 0 && dz === 0) continue;
      plan.push(entry([x + dx, y, z + dz], leaves));
    }
  }
  return commit(g, plan, { inside, cap });
}

/**
 * Hanging lantern at (x, y, z), under a roof edge. A hanging light hangs from a block above, so it is refused (not
 * placed) when the cell above is air.
 */
export function eaveLantern(g, x, y, z) {
  if (g.isAir(x, y + 1, z)) return { placed: [], refused: [[x, y, z]], skipped: [] };
  return commit(g, [entry([x, y, z], B.lantern(true))]);
}
