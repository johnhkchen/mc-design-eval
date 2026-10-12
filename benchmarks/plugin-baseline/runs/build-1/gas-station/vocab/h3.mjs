// Helpers for the gas station (plan.md VOCABULARY): pump_island, centre_dashes, glass_double_door, logo_panel, hvac_unit,
// parking_stall, ice_chest, birch_tree. Each takes the grid (a runParts view or a Grid) first, then the plan's position
// arguments (and facing where it has one), then an optional { over } (default false: write only into air). Coordinates
// are absolute, x east, y up, z south. A helper writes only its own footprint and never below y=1, so the ground (y=0)
// and the floors belong to earlier parts. The two paint helpers (centre_dashes, parking_stall) are the one exception:
// they lay their stripes on the y=0 surface, and that surface is the asphalt, so they may replace gray_concrete_powder
// there and nothing else. A cell that is not air is skipped and listed in `skipped`, never overwritten.
// Each returns { placed, skipped }.
import { B, DIRS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const ASPHALT = "minecraft:gray_concrete_powder";

/** Is this cell writable? Air always; asphalt only for the paint helpers; anything else only with over. */
function open(g, x, y, z, { over, paint }) {
  if (over || g.isAir(x, y, z)) return true;
  return paint && g.blockAt(x, y, z) === ASPHALT;
}

/**
 * Write [x, y, z, block, state] cells. Every cell is checked against the bounds and the floor first. With `atomic` (a unit
 * such as a door or a chest) one blocked cell means nothing is written; otherwise each free cell is written on its own.
 * Cells are written in order, so a later cell that repeats an earlier one is skipped, not doubled.
 */
function place(g, cells, { over = false, atomic = false, paint = false, floor = 1 } = {}) {
  for (const [x, y, z] of cells) {
    if (!g.inBounds(x, y, z)) throw new Error(`refusing to write out of bounds at ${x},${y},${z}`);
    if (y < floor) throw new Error(`refusing to write at y=${y}: this helper stands at y >= ${floor}`);
  }
  const opt = { over, paint };
  if (atomic) {
    const skipped = cells.filter(([x, y, z]) => !open(g, x, y, z, opt)).map(([x, y, z]) => [x, y, z]);
    if (skipped.length) return { placed: 0, skipped };
  }
  const skipped = [];
  let placed = 0;
  for (const [x, y, z, block, state] of cells) {
    if (!open(g, x, y, z, opt)) { skipped.push([x, y, z]); continue; }
    g.set(x, y, z, block, state);
    placed++;
  }
  return { placed, skipped };
}

const lo = (a, b) => Math.min(a, b), hi = (a, b) => Math.max(a, b);

// ---- pump islands (curb, bollards) -----------------------------------------------------------------------------------
/**
 * A raised pump-island curb at x..x+1, z0..z1 (polished_andesite, y=1) with a yellow bollard on each corner of the two
 * end rows (y=2). The plan's smooth_stone_slab caps sit on the same end cells as the bollards, so the bollards win.
 */
export function pump_island(g, x, z0, z1, opts = {}) {
  const [za, zb] = [lo(z0, z1), hi(z0, z1)];
  const cells = [];
  for (let dx = 0; dx <= 1; dx++) for (let z = za; z <= zb; z++) cells.push([x + dx, 1, z, "polished_andesite"]);
  for (const z of [za, zb]) for (let dx = 0; dx <= 1; dx++) cells.push([x + dx, 2, z, "yellow_concrete"]);
  return place(g, cells, opts);
}

// ---- road paint -------------------------------------------------------------------------------------------------------
/** The yellow centre line along z (default z=2) from x0 to x1: 3 on, 3 off, starting on at x0, on the asphalt at y=0. */
export function centre_dashes(g, x0, x1, z = 2, opts = {}) {
  const cells = [];
  for (let x = lo(x0, x1); x <= hi(x0, x1); x++) if ((x - lo(x0, x1)) % 6 < 3) cells.push([x, 0, z, "yellow_concrete"]);
  return place(g, cells, { ...opts, paint: true, floor: 0 });
}

/** The white stall lines of one parking stall: a 4-long stripe along x from x0 at z0 and at z1, on the asphalt at y=0. */
export function parking_stall(g, x0, z0, z1, opts = {}) {
  const cells = [];
  for (const z of [z0, z1]) for (let dx = 0; dx <= 3; dx++) cells.push([x0 + dx, 0, z, "white_concrete"]);
  return place(g, cells, { ...opts, paint: true, floor: 0 });
}

// ---- glass double door (entrance) ---------------------------------------------------------------------------------------
/**
 * A double door in a wall on the given facing: two iron_door leaves (lower and upper halves, y=1..2) side by side with
 * mirrored hinges (left leaf hinge left, right leaf hinge right), and light_blue glass transom panes over both (y=3..4).
 * The pair runs along x for a north or south facing wall and along z for an east or west one; (x, z) is the first leaf.
 * All or nothing: one blocked cell and the door is not written.
 */
export function glass_double_door(g, x, z, facing, opts = {}) {
  if (!DIRS[facing]) throw new Error(`glass_double_door: facing is north, south, east or west, got ${facing}`);
  const along = facing === "north" || facing === "south";
  const [ax, az] = along ? [1, 0] : [0, 1];
  const [pos, neg] = along ? ["east", "west"] : ["south", "north"];
  const cells = [];
  for (let i = 0; i <= 1; i++) {
    const cx = x + ax * i, cz = z + az * i, hinge = i === 0 ? "left" : "right";
    cells.push([cx, 1, cz, ...B.door("iron", facing, "lower", hinge)]);
    cells.push([cx, 2, cz, ...B.door("iron", facing, "upper", hinge)]);
    // a transom pane joins its neighbour along the wall only: the first pane connects forward, the second back
    const pane = { north: "false", east: "false", south: "false", west: "false", [i ? neg : pos]: "true" };
    for (const y of [3, 4]) cells.push([cx, y, cz, "light_blue_stained_glass_pane", pane]);
  }
  return place(g, cells, { ...opts, atomic: true });
}

// ---- sign panel --------------------------------------------------------------------------------------------------------
/** The brand logo: a 2 wide x 3 tall red_concrete panel at x..x+1, y..y+2 in the plane z, with a white dot on the middle row, left column. */
export function logo_panel(g, x, y, z, opts = {}) {
  const cells = [];
  for (let dx = 0; dx <= 1; dx++) for (let dy = 0; dy <= 2; dy++) {
    const dot = dx === 0 && dy === 1;
    cells.push([x + dx, y + dy, z, dot ? "white_concrete" : "red_concrete"]);
  }
  return place(g, cells, { ...opts, atomic: true });
}

// ---- rooftop unit ------------------------------------------------------------------------------------------------------
/** A rooftop HVAC unit: a 2x2 iron_block body at y=9 at x..x+1, z..z+1, with a closed iron_trapdoor lid on each cell at y=10. */
export function hvac_unit(g, x, z, opts = {}) {
  const cells = [];
  for (let dx = 0; dx <= 1; dx++) for (let dz = 0; dz <= 1; dz++) {
    cells.push([x + dx, 9, z + dz, "iron_block"]);
    cells.push([x + dx, 10, z + dz, ...B.trapdoor("iron", "north", "top", false)]);
  }
  return place(g, cells, { ...opts, atomic: true });
}

// ---- ice chest ---------------------------------------------------------------------------------------------------------
/** An ice chest: a 3 wide x 1 deep white_concrete box at y=1 at x..x+2 in the plane z, with a smooth_quartz_slab lid at y=2. */
export function ice_chest(g, x, z, opts = {}) {
  const cells = [];
  for (let dx = 0; dx <= 2; dx++) {
    cells.push([x + dx, 1, z, "white_concrete"]);
    cells.push([x + dx, 2, z, ...B.slab("smooth_quartz", "bottom")]);
  }
  return place(g, cells, { ...opts, atomic: true });
}

// ---- birch tree ---------------------------------------------------------------------------------------------------------
/**
 * A birch tree rooted on the grass at (x, 0, z): a birch_log trunk on y=1..5 and a persistent birch_leaves crown, 5x5
 * with the corners cut at y=4..6 and 3x3 at y=7. The crown skips the trunk cells, which are already logs.
 */
export function birch_tree(g, x, z, opts = {}) {
  const cells = [];
  for (let y = 1; y <= 5; y++) cells.push([x, y, z, "birch_log", { axis: "y" }]);
  const leaf = { persistent: "true" };
  for (let y = 4; y <= 6; y++) for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++)
    if (!(Math.abs(dx) === 2 && Math.abs(dz) === 2)) cells.push([x + dx, y, z + dz, "birch_leaves", leaf]);
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) cells.push([x + dx, 7, z + dz, "birch_leaves", leaf]);
  return place(g, cells, opts);
}
