// Helpers for plan.md VOCABULARY (part H3): stringCourse, cantedBay, doorFit, chimneyStack, atticLadder,
// gardenWall, lampPost. Coordinates are plan.md's: x along the street, y up, z from the street (north) to the garden.
//
// Every helper takes its position (and facing, where it has one) as arguments and writes through the build
// library's Grid (g.set). It writes only inside its own footprint, and only into air, unless { over: true } says
// it may replace what an earlier part placed. A blocked cell is never thrown: it comes back in `refused` with the
// reason. Group writes (doors, ladders, posts) are all-or-nothing, so a door is never half placed.
import { DIRS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// Pane connections for a glass row in a wall plane that runs along x (front) or along z (cants).
const PANE_X = { north: "false", east: "true", south: "false", west: "true" };
const PANE_Z = { north: "true", east: "false", south: "true", west: "false" };
const SLAB_BOTTOM = { type: "bottom" };

/** One writer per helper call. Footprint boxes are inclusive [x0, y0, z0, x1, y1, z1]. */
function writer(g, boxes, over) {
  const placed = [];
  const refused = [];
  const reason = (x, y, z) => {
    if (!boxes.some(([x0, y0, z0, x1, y1, z1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1)) return "outside footprint";
    if (!over && !g.isAir(x, y, z)) return `not air: ${g.blockAt(x, y, z)}`;
    return null;
  };
  const put = (x, y, z, block, state) => {
    const why = reason(x, y, z);
    if (why) return refused.push([x, y, z, block, why]);
    g.set(x, y, z, block, state);
    placed.push([x, y, z]);
  };
  // cells: [x, y, z, block, state?]; all of them or none.
  const group = (cells) => {
    const whys = cells.map(([x, y, z]) => reason(x, y, z));
    if (whys.some(Boolean)) return cells.forEach(([x, y, z, block], i) => refused.push([x, y, z, block, whys[i] ?? "group blocked"]));
    cells.forEach(([x, y, z, block, state]) => put(x, y, z, block, state));
  };
  return { put, group, report: () => ({ placed, refused }) };
}

function assertFacing(facing, allowed = Object.keys(DIRS)) {
  if (!allowed.includes(facing)) throw new Error(`facing ${facing}: expected ${allowed.join("|")}`);
}

/**
 * String course: one full-block band at height y along x0..x1 at depth z (cut_sandstone on A/C, smooth_quartz over
 * B's x11..19 via { block, over: true }). sides: { xs: [3, 27], zTo: 24 } returns the band round the side faces
 * from z+1 to zTo.
 */
export function stringCourse(g, x0, x1, y, z, { block = "cut_sandstone", sides = null, over = false } = {}) {
  const boxes = [[x0, y, z, x1, y, z]];
  const side = [];
  if (sides) for (const x of sides.xs) {
    boxes.push([x, y, z + 1, x, y, sides.zTo]);
    for (let zz = z + 1; zz <= sides.zTo; zz++) side.push([x, zz]);
  }
  const w = writer(g, boxes, over);
  for (let x = x0; x <= x1; x++) w.put(x, y, z, block);
  for (const [x, zz] of side) w.put(x, y, zz, block);
  return w.report();
}

/**
 * Canted bay, front row z (A z=10 cells x0+1..x0+2; cants at z+1, x0 and x0+3). Body smooth_sandstone with glazing
 * (panes) at base+2..4 and base+7..9, cut_sandstone band at base+6, quartz_slab edge + smooth_stone_slab deck at
 * base+11. The cant cells at the front row (x0, x0+3, z) stay air, and the room (x0+1..x0+2, z+1) stays air.
 */
export function cantedBay(g, x0, z = 10, { base = 1, over = false } = {}) {
  const x1 = x0 + 3;
  const front = [x0 + 1, x0 + 2];
  const cants = [x0, x1];
  const deck = base + 11;
  const w = writer(g, [[x0, base, z, x1, deck, z + 1]], over);
  const wall = (y, pane) => {
    if ((y >= base + 2 && y <= base + 4) || (y >= base + 7 && y <= base + 9)) return ["glass_pane", pane];
    if (y === base + 6) return ["cut_sandstone"];
    return ["smooth_sandstone"];
  };
  for (let y = base; y < deck; y++) {
    for (const x of front) w.put(x, y, z, ...wall(y, PANE_X));
    for (const x of cants) w.put(x, y, z + 1, ...wall(y, PANE_Z));
  }
  for (const x of front) w.put(x, deck, z, "quartz_slab", SLAB_BOTTOM);
  for (const x of cants) w.put(x, deck, z + 1, "quartz_slab", SLAB_BOTTOM);
  for (const x of front) w.put(x, deck, z + 1, "smooth_stone_slab", SLAB_BOTTOM);
  return w.report();
}

/**
 * Door at (x, z) facing `facing` (out to the street): both halves, hinge left, and a glass transom one above the
 * top half. Lower half at y (default 3), upper at y+1, transom at y+2. The door is written all or none.
 */
export function doorFit(g, x, z, block, facing, { y = 3, over = false } = {}) {
  if (!block.endsWith("_door")) throw new Error(`doorFit: ${block} is not a door block`);
  assertFacing(facing);
  const w = writer(g, [[x, y, z, x, y + 2, z]], over);
  const door = (half, yy) => [x, yy, z, block, { facing, half, hinge: "left", open: "false" }];
  w.group([door("lower", y), door("upper", y + 1), [x, y + 2, z, "glass_pane", PANE_X]]);
  return w.report();
}

/**
 * Chimney stack for the flue at x0+1, depth z0..z0+1: brick sides at x0 and x0+2 from y5 to y27 (band of
 * deepslate_bricks at y26), a stepped stone_brick_slab cap at y28 one out on every side, and two lit campfires in
 * the flue top at (x0+1, 28, z0..z0+1). Fireboxes (y3..4), the flue (x0+1, y5..27) and the footing stay air or
 * owned by other parts, so they are not written here.
 */
export function chimneyStack(g, x0, z0, { over = false } = {}) {
  const w = writer(g, [[x0, 5, z0, x0 + 2, 27, z0 + 1], [x0 - 1, 28, z0 - 1, x0 + 3, 28, z0 + 2]], over);
  for (let y = 5; y <= 27; y++) for (const x of [x0, x0 + 2]) for (let z = z0; z <= z0 + 1; z++) {
    w.put(x, y, z, y === 26 ? "deepslate_bricks" : "bricks");
  }
  for (let x = x0 - 1; x <= x0 + 3; x++) for (let z = z0 - 1; z <= z0 + 2; z++) {
    if (x === x0 + 1 && z >= z0 && z <= z0 + 1) continue;
    w.put(x, 28, z, "stone_brick_slab", SLAB_BOTTOM);
  }
  for (let z = z0; z <= z0 + 1; z++) w.put(x0 + 1, 28, z, "campfire", { facing: "north", lit: "true" });
  return w.report();
}

/**
 * Ladder on the wall at (x, z), facing east or west off that wall (A: x=4 facing east, C: x=26 facing west), from
 * y0 to y1 (default 18..20). The attic floor cell is the shell's and is not written.
 */
export function atticLadder(g, x, z, facing, { y0 = 18, y1 = 20, over = false } = {}) {
  assertFacing(facing, ["east", "west"]);
  const w = writer(g, [[x, y0, z, x, y1, z]], over);
  const cells = [];
  for (let y = y0; y <= y1; y++) cells.push([x, y, z, "ladder", { facing }]);
  w.group(cells);
  return w.report();
}

/**
 * Brick garden wall from (x0, z0) to (x1, z1), one thick and along x or z, `height` high from y with a
 * stone_brick_slab coping on top. gates: [[x, z], ...] cells that get a spruce_fence_gate at y instead of brick
 * (gateFacing north|south for a wall along x). A corner belongs to whichever run writes it first.
 */
export function gardenWall(g, x0, z0, x1, z1, { y = 1, height = 2, gates = [], gateFacing = "north", block = "bricks", over = false } = {}) {
  assertFacing(gateFacing, ["north", "south"]);
  const w = writer(g, [[x0, y, z0, x1, y + height, z1]], over);
  const gated = new Set(gates.map(([gx, gz]) => `${gx},${gz}`));
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (gated.has(`${x},${z}`)) {
      w.put(x, y, z, "spruce_fence_gate", { facing: gateFacing, in_wall: "false", open: "false" });
      continue;
    }
    for (let yy = y; yy < y + height; yy++) w.put(x, yy, z, block);
    w.put(x, y + height, z, "stone_brick_slab", SLAB_BOTTOM);
  }
  return w.report();
}

/**
 * Lamp post at (x, z): three polished_blackstone_wall posts from y (default 1) to y+2 and a standing lantern on top
 * at y+3. The post is written all or none.
 */
export function lampPost(g, x, z, { y = 1, over = false } = {}) {
  const w = writer(g, [[x, y, z, x, y + 3, z]], over);
  const cells = [];
  for (let i = 0; i < 3; i++) cells.push([x, y + i, z, "polished_blackstone_wall", { up: "true" }]);
  cells.push([x, y + 3, z, "lantern", { hanging: "false" }]);
  w.group(cells);
  return w.report();
}
