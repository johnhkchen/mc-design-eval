// Vocabulary helpers from plan.md's VOCABULARY, as build-library calls. Each takes the grid first, then world
// coordinates (plan.md's own), then its facing where it has one, then `opts` last.
// Rules every helper keeps: it writes only its own footprint; only into air (never over an earlier part's block) unless
// opts.overwrite; and never below its lowest cell (the ground, sand and floor under it belong to earlier parts).
// stepping_pad also replaces ground cover (dirt, grass, sand, gravel) on its own y=0 row: that is the surface it sits on.
// Each helper returns { placed, skipped }, where skipped lists [x, y, z, block] the rule refused.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const AIR = new Set(["minecraft:air", "minecraft:cave_air", "minecraft:void_air"]);
const COVER = new Set(["minecraft:dirt", "minecraft:grass_block", "minecraft:sand", "minecraft:gravel"]);

// One call's writer: at(x, y, z, [block, state, nbt]) places the block only where the rule allows it.
function painter(g, { overwrite = false, ground = false } = {}) {
  const out = { placed: 0, skipped: [] };
  const at = (x, y, z, spec) => {
    const here = g.blockAt(x, y, z);
    if (overwrite || AIR.has(here) || (ground && COVER.has(here))) {
      g.set(x, y, z, ...spec);
      out.placed++;
    } else out.skipped.push([x, y, z, here]);
  };
  return { at, out };
}

/** Dark oak post, axis y, at (x, z) from y0 to y1 (the post and header rhythm: y=2..4). */
export function post(g, x, z, y0 = 2, y1 = 4, opts) {
  const p = painter(g, opts);
  for (let y = y0; y <= y1; y++) p.at(x, y, z, B.log("dark_oak", "y"));
  return p.out;
}

/** The bold entry on the door wall at row z: acacia door (both halves) at column x, orange panels at x-1 and x+1
 *  (y=2..4), orange transom at (x, 4, z). The reveals at x-2 and x+2 are the shell's. */
export function orange_entry(g, x, z, facing = "north", opts) {
  const p = painter(g, opts);
  for (let y = 2; y <= 4; y++) {
    p.at(x - 1, y, z, B.block("orange_concrete"));
    p.at(x + 1, y, z, B.block("orange_concrete"));
  }
  p.at(x, 2, z, B.door("acacia", facing, "lower", "left"));
  p.at(x, 3, z, B.door("acacia", facing, "upper", "left"));
  p.at(x, 4, z, B.block("orange_concrete"));
  return p.out;
}

/** Exposed beam, axis z, along one beam line x from z0 to z1 at height y (plan: y=5, z=5..28). */
export function beam_line(g, x, z0 = 5, z1 = 28, y = 5, opts) {
  const p = painter(g, opts);
  for (let z = z0; z <= z1; z++) p.at(x, y, z, B.log("dark_oak", "z"));
  return p.out;
}

/** Stepping pads: smooth_stone at y=0 from x0 for len cells on row z (plan: len 3). Replaces the sand under them. */
export function stepping_pad(g, x0, z, len = 3, opts) {
  const p = painter(g, { ground: true, ...opts });
  for (let x = x0; x < x0 + len; x++) p.at(x, 0, z, B.block("smooth_stone"));
  return p.out;
}

/** Two-high cactus at (x, z), cells y=1 and y=2. It writes no sand: the surface under it must already be sand. */
export function barrel_cactus(g, x, z, opts) {
  const p = painter(g, opts);
  for (const y of [1, 2]) p.at(x, y, z, B.block("cactus"));
  return p.out;
}

/** Patio table at (x, z) on standing height y (patio y=0, so y=1): dark oak fence leg at y, smooth quartz slab top
 *  (bottom half) at y+1, a smooth quartz stair chair on each side along x. Row z+-1 stays open as the lane. */
export function patio_table(g, x, z, y = 1, opts) {
  const p = painter(g, opts);
  p.at(x, y, z, B.fence("dark_oak"));
  p.at(x, y + 1, z, B.slab("smooth_quartz", "bottom"));
  p.at(x - 1, y, z, B.stairs("smooth_quartz", "west", "bottom"));
  p.at(x + 1, y, z, B.stairs("smooth_quartz", "east", "bottom"));
  return p.out;
}

/** Open spruce trapdoors flat against a wall: column x, from y0 to y1 at row z. facing = the side of the cell the wall
 *  is on. Halves alternate bottom/top up the wall, so the panels read as strips. */
export function panel_wall(g, x, y0, y1, z, facing, opts) {
  const p = painter(g, opts);
  for (let y = y0; y <= y1; y++) p.at(x, y, z, B.trapdoor("spruce", facing, (y - y0) % 2 ? "top" : "bottom", true));
  return p.out;
}

/** Low coffee table on the floor at (x, z), standing height y: spruce slab (bottom half) at (x, y, z) and a flower pot
 *  beside it at (x+1, y, z). A pot cannot stand on a half slab in the same cell, so it sits on the floor. */
export function coffee_table(g, x, z, y = 2, opts) {
  const p = painter(g, opts);
  p.at(x, y, z, B.slab("spruce", "bottom"));
  p.at(x + 1, y, z, B.block("flower_pot"));
  return p.out;
}

/** Galley run along the wall row z, columns x0..x1 (the kitchen box is x=11..15, z=9..13: x0=11, x1=15, z=9).
 *  Fridge: iron block, two high, at x0. Smooth quartz counters at x0+1..x1 with a smoker, a cauldron and a furnace on
 *  them, facing the room. Spruce trapdoor upper cabinets on the wall, row z, y+2. Breakfast bar on row z+3 (spruce
 *  fence legs, spruce slab tops) and birch slab stools on row z+4. Rows z+1 and z+2 stay open as the lane.
 *  Needs x1 - x0 >= 3 for the appliances. */
export function galley_kitchen(g, x0, x1, z, y = 2, opts) {
  const p = painter(g, opts);
  p.at(x0, y, z, B.block("iron_block"));
  p.at(x0, y + 1, z, B.block("iron_block"));
  for (let x = x0 + 1; x <= x1; x++) p.at(x, y, z, B.block("smooth_quartz"));
  p.at(x0 + 1, y + 1, z, ["smoker", { facing: "south", lit: "false" }]);
  p.at(x0 + 2, y + 1, z, B.block("cauldron"));
  p.at(x0 + 3, y + 1, z, ["furnace", { facing: "south", lit: "false" }]);
  for (let x = x0; x <= x1; x++) p.at(x, y + 2, z, B.trapdoor("spruce", "north", "top", true));
  for (let x = x0 + 1; x < x1; x++) {
    p.at(x, y, z + 3, B.fence("spruce"));
    p.at(x, y + 1, z + 3, B.slab("spruce", "bottom"));
    p.at(x, y, z + 4, B.slab("birch", "bottom"));
  }
  return p.out;
}
