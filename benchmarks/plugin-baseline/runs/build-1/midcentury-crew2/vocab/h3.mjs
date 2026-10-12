// H3 helpers from plan.md VOCABULARY: post, orange_entry, beam_line, stepping_pad, barrel_cactus, patio_table,
// panel_wall, coffee_table, galley_kitchen.
// Every helper takes its position (and facing where it has one) as arguments, writes only its own footprint, and writes
// only into air: a cell an earlier part filled is refused, not overwritten. Each returns { placed, refused } so a caller
// can see what did not land. Block states are written as the game's keys (mcd states), not through the B.* helpers,
// which add keys these blocks don't have in this version.
import { DIRS, OPPOSITE } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const start = () => ({ placed: 0, refused: [] });

// one cell, air only: returns nothing, records the outcome in `out`
const put = (g, out, x, y, z, block, state) => {
  if (!g.isAir(x, y, z)) return out.refused.push([x, y, z, block]);
  g.set(x, y, z, block, state);
  out.placed++;
};

const checkFacing = (facing) => {
  if (!DIRS[facing]) throw new Error(`facing must be north|south|east|west, got ${facing}`);
};

/** A dark oak post, vertical, from y0 to y1 at (x, z). */
export function post(g, x, z, y0 = 2, y1 = 4) {
  const out = start();
  for (let y = y0; y <= y1; y++) put(g, out, x, y, z, "dark_oak_log", { axis: "y" });
  return out;
}

/** The orange entry on a wall at row z: door at (x, y..y+1, z) facing `facing` (outward), panels either side, transom above. */
export function orange_entry(g, x, z, facing = "north", y = 2) {
  checkFacing(facing);
  const out = start();
  // panels sit either side of the door along the wall: x±1 on a north/south wall, z±1 on an east/west one
  const [ax, az] = facing === "north" || facing === "south" ? [1, 0] : [0, 1];
  for (const s of [-1, 1]) for (let dy = 0; dy < 3; dy++) put(g, out, x + s * ax, y + dy, z + s * az, "orange_concrete");
  put(g, out, x, y + 2, z, "orange_concrete");
  put(g, out, x, y, z, "acacia_door", { facing, half: "lower", hinge: "left", open: "false" });
  put(g, out, x, y + 1, z, "acacia_door", { facing, half: "upper", hinge: "left", open: "false" });
  return out;
}

/** A dark oak beam along z at (x, y, z0..z1). Its cells sit above the walls, so the header course skips them. */
export function beam_line(g, x, z0, z1, y = 5) {
  const out = start();
  for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) put(g, out, x, y, z, "dark_oak_log", { axis: "z" });
  return out;
}

/** Smooth stone pads along x from x0 to x1 at row z, on the ground layer y. Air only (see the ground-layer note in the summary). */
export function stepping_pad(g, x0, x1, z, y = 0) {
  const out = start();
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) put(g, out, x, y, z, "smooth_stone");
  return out;
}

/** A cactus two high at (x, y..y+1, z). The sand under it is the ground part's; this helper does not place it. */
export function barrel_cactus(g, x, z, y = 1) {
  const out = start();
  for (const dy of [0, 1]) put(g, out, x, y + dy, z, "cactus");
  return out;
}

/**
 * A table on a dark oak fence leg at (x, y, z), a quartz slab top at y+1, and a quartz stair chair either side along
 * `axis` ("x" or "z"). The stair's facing is its high back, so each chair's back faces away from the table.
 * Footprint is 3 cells along the axis; the cells beside it stay clear.
 */
export function patio_table(g, x, z, axis = "x", y = 1) {
  if (axis !== "x" && axis !== "z") throw new Error(`axis must be x or z, got ${axis}`);
  const out = start();
  put(g, out, x, y, z, "dark_oak_fence");
  put(g, out, x, y + 1, z, "smooth_quartz_slab", { type: "bottom" });
  const chairs = axis === "x" ? [[-1, 0, "west"], [1, 0, "east"]] : [[0, -1, "north"], [0, 1, "south"]];
  for (const [dx, dz, facing] of chairs) put(g, out, x + dx, y, z + dz, "smooth_quartz_stairs", { facing, half: "bottom", shape: "straight" });
  return out;
}

/**
 * Open spruce trapdoors in a column at x from y0 to y1 on row z, hung on the wall on the `facing` side (a trapdoor
 * hinges from the side it is named for). Half alternates bottom/top down the column.
 */
export function panel_wall(g, x, y0, y1, z, facing) {
  checkFacing(facing);
  const out = start();
  for (let y = y0; y <= y1; y++) {
    put(g, out, x, y, z, "spruce_trapdoor", { facing, half: (y - y0) % 2 === 0 ? "bottom" : "top", open: "true" });
  }
  return out;
}

/** A low table at (x, y, z): a spruce slab on the floor and a flower pot on it. */
export function coffee_table(g, x, z, y = 2) {
  const out = start();
  put(g, out, x, y, z, "spruce_slab", { type: "bottom" });
  put(g, out, x, y + 1, z, "flower_pot");
  return out;
}

/**
 * A galley run against the wall on row z, from x0 to x1 (at least 5 cells: fridge, counter, appliances), its cook facing
 * `facing` (into the room). The breakfast bar is on row zBar on the room side, with stools on the counter side.
 * Needs at least 3 free rows between the counter and the bar (the cook's and guest's lane).
 */
export function galley_kitchen(g, x0, x1, z, zBar, facing = "south", y = 2) {
  checkFacing(facing);
  if (x1 - x0 < 4) throw new Error(`galley_kitchen needs at least 5 cells, got x ${x0}..${x1}`);
  const sgn = facing === "south" ? 1 : -1;     // +1 when the room lies to the south of the counter wall
  if ((zBar - z) * sgn < 3) throw new Error(`galley_kitchen bar at z ${zBar} is too close to the counter at z ${z}`);
  const out = start();
  // fridge: a tall iron block at the west end
  for (let dy = 0; dy < 3; dy++) put(g, out, x0, y + dy, z, "iron_block");
  // counter along the wall, with upper cabinets above it
  for (let x = x0 + 1; x <= x1; x++) {
    put(g, out, x, y, z, "white_concrete");
    put(g, out, x, y + 2, z, "spruce_trapdoor", { facing: OPPOSITE[facing], half: "top", open: "false" });
  }
  // appliances on the counter: furnace hob, cauldron sink, smoker oven at the east end
  put(g, out, x0 + 2, y + 1, z, "furnace", { facing });
  put(g, out, x0 + 3, y + 1, z, "cauldron");
  put(g, out, x1, y + 1, z, "smoker", { facing });
  // breakfast bar: fence legs at both ends, slab top between them, stools on the counter side
  const zStool = zBar - sgn;
  put(g, out, x0 + 1, y, zBar, "spruce_fence");
  put(g, out, x1 - 1, y, zBar, "spruce_fence");
  for (let x = x0 + 1; x <= x1 - 1; x++) {
    put(g, out, x, y + 1, zBar, "spruce_slab", { type: "bottom" });
    put(g, out, x, y, zStool, "birch_slab", { type: "bottom" });
  }
  return out;
}
