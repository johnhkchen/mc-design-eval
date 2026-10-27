// Way 912170773, Eden Terrace / Mt Eden edge: a two-storey Edwardian brick shop-house on a sloping corner. Footprint is
// the lidar cell list; roof heights snap to three flat tiers (7 = a lower rear wing, 9 = a step, 10 = the main roof with
// a parapet and coping, about 11 blocks to the top). Walls are a one-block shell with hollow storeys behind the glass;
// every storey stands on a floor slab and every roof on the walls below it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170773.cells.json", "utf8"));

const FOOT = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inF = (x, z) => FOOT.has(`${x},${z}`);
// lidar roof heights snapped to the three tiers the massing uses
const tier = (roof) => (roof >= 10 ? 10 : roof >= 9 ? 9 : 7);

const BRICK = "bricks", STONE = "stone_bricks", TRIM = "smooth_stone", SILL = "white_concrete";
const GLASS = "glass_pane", AWNING = "green_terracotta", FLOOR = "oak_planks", DECK = "stone";
const DOOR_X = 3, DOOR_Z = 7;   // the entrance on the south (downhill) face, a pier between two shop bays
const LAMPS_GROUND = [[2, 2], [5, 5]], LAMPS_UPPER = [[2, 5], [5, 2]];

const g = new Voxels([8, 23, 8]);
const glass = [];   // glass pane cells, connected once the walls are in place

function put(x, y, z, block, state) {
  g.set(x, y, z, block, state);
  if (block === GLASS) glass.push([x, y, z]);
}

for (const [key, { ground, roof }] of FOOT) {
  const [x, z] = key.split(",").map(Number);
  const r = tier(roof), t = r - 1;                   // t = the top solid course; the roof surface is at r
  const exN = !inF(x, z - 1), exS = !inF(x, z + 1), exW = !inF(x - 1, z), exE = !inF(x + 1, z);
  const shell = exN || exS || exW || exE;
  const corner = (exW || exE) && (exN || exS);
  // a pier at each end of a 4-block bay: windows on the middle two cells of every four along the face
  const u = exN || exS ? x : z;
  const bay = !corner && [1, 2].includes(u % 4);
  const door = x === DOOR_X && z === DOOR_Z;
  const lampG = LAMPS_GROUND.some(([a, b]) => a === x && b === z);
  const lampU = LAMPS_UPPER.some(([a, b]) => a === x && b === z);

  for (let y = 0; y <= t + 2; y++) {
    if (y < ground) { put(x, y, z, STONE); continue; }
    if (y === ground) { put(x, y, z, STONE); continue; }           // base course on the shell, floor slab inside
    if (!shell) {                                                  // hollow interior: floor slabs, air, lamps, deck
      if (y === 4) put(x, y, z, FLOOR);
      else if (y === t) put(x, y, z, DECK);
      else if (y === 3 && lampG) put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      else if (y === t - 1 && lampU && t - 1 > 4) put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      if (r === 10 && (y === t + 1 || y === t + 2)) {              // roof plant over the interior, on the deck
        if (x >= 4 && x <= 5 && z >= 3 && z <= 4 && y === t + 1) put(x, y, z, "light_gray_concrete");
        if (x === 4 && z === 4 && y === t + 2) put(x, y, z, "iron_block");
      }
      continue;
    }
    // shell: the face from the base to the cornice
    if (y === t) { put(x, y, z, TRIM); continue; }                 // cornice / head of the top storey
    if (r === 10 && y === t + 1) { put(x, y, z, BRICK); continue; } // parapet
    if (r === 10 && y === t + 2) { put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); continue; }
    if (corner) { put(x, y, z, TRIM); continue; }                  // quoins
    if (y === 4) { put(x, y, z, TRIM); continue; }                 // storey line / string course
    if (y < 4) {                                                   // ground floor: the shop bays
      if (y === 3) { put(x, y, z, bay || door ? AWNING : BRICK); continue; }
      if (door && y <= 2) { // the entrance: a door, lower half and upper half
        put(x, y, z, "oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      put(x, y, z, bay ? GLASS : BRICK);
      continue;
    }
    // upper storey: sill, glazing, lintel
    if (y === 5 && r >= 9) { put(x, y, z, bay ? SILL : BRICK); continue; }
    if (r === 10 && y === t - 1) { put(x, y, z, bay ? SILL : BRICK); continue; }
    put(x, y, z, bay ? GLASS : BRICK);
  }
}

// glass panes connect to the solid neighbours in their own plane, as a window wall reads in the game
const SOLID = new Set(["minecraft:bricks", "minecraft:smooth_stone", "minecraft:white_concrete", "minecraft:stone_bricks",
  "minecraft:green_terracotta", "minecraft:glass_pane"]);
for (const [x, y, z] of glass) {
  const side = (dx, dz) => { const n = g.get(x + dx, y, z + dz); return n && SOLID.has(n.block) ? "true" : "false"; };
  const st = { north: side(0, -1), south: side(0, 1), east: side(1, 0), west: side(-1, 0), waterlogged: "false" };
  g.set(x, y, z, GLASS, st);
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170773.nbt";
const info = g.save(out);
console.log(`saved ${out}: ${info.blocks} blocks, palette ${info.palette}`);
