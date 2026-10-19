// 147 West 46th Street (NYC1022675): a 1920 Midtown loft-office block, four storeys of red brick over a granite base,
// stone belt courses at each floor, a shopfront with a recessed door on the street face (south, z 26), and a two-storey
// rear wing to the north. The lidar gives two flat tiers (roof 14 for z 3..26, roof 8 for z 0..2): smoothed to those.
// Hollow: exterior shell, floor slabs per storey, air behind the glass, lanterns in some windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1022675.cells.json`, "utf8"));   // [x, z, ground, roof]; x 0..4, z 0..26

const X = 5, Z = 27, Y = 26;
const ground = new Map(cells.map(([x, z, g]) => [`${x},${z}`, g]));
// Two lidar tiers after smoothing: the main block to 14, the rear wing to 8 (the noisy 3, 5, 9, 13 and 14 cells read as these).
const top = (z) => (z <= 2 ? 8 : 14);
const inM = (x, y, z) => x >= 0 && x < X && z >= 0 && z < Z && y >= 0 && y < top(z) && ground.has(`${x},${z}`);

// Window rows per storey (storeys are 3 high: belt at 2, 5, 8, 11; the attic has one window row at 12).
const WIN = new Set([3, 4, 6, 7, 9, 10, 12]);
const BELT = new Set([2, 5, 8, 11]);
// Interior air: behind the glass and between the floor slabs. Only the 1..3 columns of the cells off the outer shell.
const isAir = (x, y, z) =>
  x >= 1 && x <= 3 && z >= 1 && z <= 25 && WIN.has(y) && y < top(z) - 1 && inM(x, y, z - 1) && inM(x, y, z + 1);

const g = new Voxels([X, Y, Z]);
const paneState = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };

for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) for (let y = 0; y < top(z); y++) {
  if (!inM(x, y, z) || isAir(x, y, z)) continue;
  const t = top(z);
  if (y === t - 1) {                                                   // roof: a stone coping on the outer edge, tar between
    const edge = x === 0 || x === 4 || z === 0 || z === 26 || z === 3;
    g.set(x, y, z, edge ? "stone_bricks" : "stone");
    continue;
  }
  if (y <= 1) { g.set(x, y, z, "polished_granite"); continue; }        // base course and foundation
  if (BELT.has(y)) { g.set(x, y, z, "smooth_stone"); continue; }       // floor slab and belt course, every storey
  // Walls: window rows on the street face (z 26), the rear wing (z 0), the north face above the wing (z 3), piers elsewhere.
  if (z === 26 && y === 2 && x === 2) { g.set(x, y, z, "stone_brick_stairs", { facing: "south", half: "bottom", shape: "straight", waterlogged: "false" }); continue; }
  if (z === 26 && x === 2 && (y === 3 || y === 4)) {                   // the door, recessed in the shopfront
    g.set(x, y, z, "dark_oak_door", { facing: "south", half: y === 3 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
    continue;
  }
  if (z === 26 && (x === 1 || x === 3) && y === 3) { g.set(x, y, z, "dark_oak_planks"); continue; }   // shopfront bulkhead
  const windowFace = (z === 26 && y > 2) || (z === 0 && WIN.has(y)) || (z === 3 && WIN.has(y) && !inM(x, y, z - 1));
  if (windowFace && (x === 1 || x === 3)) { g.set(x, y, z, "glass_pane", paneState); continue; }
  g.set(x, y, z, "bricks");
}

// Warm light behind the glass, standing on a floor slab or hung from the one above it.
const lantern = (hanging) => ({ hanging: String(hanging), waterlogged: "false" });
g.set(3, 4, 25, "lantern", lantern(true));
g.set(1, 6, 25, "lantern", lantern(false));
g.set(3, 9, 25, "lantern", lantern(false));
g.set(1, 12, 25, "lantern", lantern(false));

// Roof equipment: a stair and lift bulkhead on the main roof, bricks with a stone cap.
for (let x = 1; x <= 3; x++) for (let z = 5; z <= 7; z++) {
  g.set(x, 14, z, "bricks"); g.set(x, 15, z, "bricks"); g.set(x, 16, z, "stone_bricks");
}

const { blocks, palette } = g.save(`${DIR}/NYC1022675.nbt`);
console.log(`NYC1022675.nbt: ${blocks} blocks, ${palette} palette entries`);
