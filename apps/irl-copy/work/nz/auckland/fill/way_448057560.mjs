// Way 448057560: a three-storey brick commercial block with a shopfront and a single-storey rear wing, Auckland,
// c.1920s (Karangahape / Eden Terrace street type). Red brick walls, stone-brick plinth and coping, smooth-stone floor
// bands, cream (quartz) sash frames over glass, dark-oak shopfronts with a door and canopy on the street (z 0) face.
// Footprint 15 x 6 (x 0..14, z 0..5): the tall block is z 0..1 (lidar roof 12-14, smoothed to 12/13 with a corner
// tower and a centre pediment at 13), the wing is z 2..5 (roof 5), and a stair core sits at the wing's east end (7).
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_448057560.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell
const g = new Voxels([15, 27, 6]);

const GLASS_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const isBay = (x) => (x >= 2 && x <= 4) || (x >= 6 && x <= 8) || (x >= 10 && x <= 12);   // three window bays per storey
const isPier = (x) => x === 1 || x === 5 || x === 9 || x === 13;
const door = (x, y, z, half, facing) => put(x, y, z, "dark_oak_door", { facing, half, hinge: "left", open: "false", powered: "false" });

// The tall block (z 0..1), y from its floor up to its roof. Returns [block, state] or null (air).
function tallWall(x, y, z) {
  const corner = x === 0 || x === 14;
  if (y === 12) return corner || z === 0 ? ["stone_bricks"] : ["smooth_stone"];     // the cornice course
  const storey = y <= 3 ? 1 : y <= 7 ? 2 : 3;
  if (z === 1) {                                                     // the room behind the facade
    if (corner) return ["stone_bricks"];
    if (!isBay(x)) return ["bricks"];
    // air gap behind each window; above the wing's roof the back of the room has nothing to stand on, so it is glazed
    return storey === 1 ? null : ["glass_pane", GLASS_EW];
  }
  if (corner) return [y % 2 ? "stone_bricks" : "bricks"];            // quoins
  if (isPier(x)) return ["bricks"];
  if (storey === 1) {                                                // shopfront and entrance
    if (x >= 6 && x <= 8) {
      if (y === 3) return ["dark_oak_stairs", { facing: "north", half: "top", shape: "straight", waterlogged: "false" }];
      return x === 7 ? null : ["dark_oak_planks"];                    // the door is set after the walls
    }
    if (y === 3 || x === 3) return ["dark_oak_planks"];                // fascia and mullion
    return ["glass_pane", GLASS_EW];
  }
  const head = storey === 2 ? 7 : 11;                                // sash: cream head and mullion, glass sides
  if (y === head || x === 3) return ["quartz_block"];
  return ["glass_pane", GLASS_EW];
}

// The wing (z 2..5) and the stair core, y from its floor up to its roof. Returns [block, state] or null.
function wingWall(x, y, z) {
  const side = x === 0 || x === 14;
  if (z === 2) return side ? ["stone_bricks"] : ["bricks"];          // partition against the tall block, and the core
  if (z === 3 || z === 4) return side ? ["bricks"] : null;          // room air
  // z 5, the rear
  if (side) return ["stone_bricks"];
  if (isPier(x)) return ["bricks"];
  if (x >= 6 && x <= 8) return x === 7 ? null : ["bricks"];          // rear door bay
  if (y === 3) return ["quartz_block"];                              // head
  if (x === 3 || x === 11) return ["quartz_block"];                  // mullion
  return ["glass_pane", GLASS_EW];
}

for (const [x, z, gr, raw] of cells) {
  const tall = z <= 1;
  // smoothed roof tiers: the tall block's 12-14 becomes 12, with a 13 corner tower and centre pediment; the wing's 5 and
  // the core's 7 are kept as they are
  const T = tall ? ((x === 0 || (z === 0 && x >= 6 && x <= 8)) ? 13 : 12) : raw === 7 ? 6 : 4;
  const perim = x === 0 || x === 14 || z === 0 || z === 5;
  for (let y = 0; y < gr; y++) put(x, y, z, "cobblestone");       // foundation up to the lidar ground
  for (let y = gr; y <= T; y++) {
    let spec;
    if (y === gr) spec = z === 0 ? ["stone_bricks"] : ["smooth_stone"];          // base course / floor slab
    else if (y === T) spec = perim ? ["stone_bricks"] : ["smooth_stone"];       // coping / roof deck
    else if (y === 4 || (tall && y === 8)) spec = ["smooth_stone"];             // floor slabs and storey band
    else spec = tall ? tallWall(x, y, z) : wingWall(x, y, z);
    if (spec) put(x, y, z, spec[0], spec[1]);
  }
}

// entrance (street face, north) and rear door
door(7, 1, 0, "lower", "north"); door(7, 2, 0, "upper", "north");
door(7, 1, 5, "lower", "south"); door(7, 2, 5, "upper", "south");

// warm light behind the glass (in the room air, not on the facade)
put(2, 2, 1, "glowstone"); put(10, 2, 1, "shroomlight");
put(2, 2, 4, "glowstone"); put(12, 2, 4, "shroomlight");

// roof plant: a pair of condenser boxes on the tall roof, and one on the wing
for (const [x, z] of [[3, 0], [4, 0], [3, 1], [4, 1]]) put(x, 13, z, "light_gray_concrete");
for (const [x, z] of [[9, 3], [10, 3], [9, 4], [10, 4]]) put(x, 5, z, "light_gray_concrete");

const out = `${DIR}/way_448057560.nbt`;
const { blocks, palette } = g.save(out);
console.log(`saved ${out}: ${blocks} blocks, palette ${palette}`);
