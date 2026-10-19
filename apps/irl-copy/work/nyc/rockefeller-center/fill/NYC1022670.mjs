// 146 West 47th Street: a 1920 Diamond District loft-office block. A 28-deep, 6-wide lot, four storeys on the street
// (roof 14 blocks), stepping down to a three-storey rear wing and a low yard wall. Brick walls on a stone plinth,
// stone string courses at each storey line, steel-sash windows set in the brick, a shopfront and a lobby door on
// the 47th Street (north, z 0) front, and a stone parapet. The envelope is one brick thick with an air gap behind
// every window; floor slabs at each storey line and a solid roof cap. Built only on the lot's cells.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1022670.cells.json`, "utf8"));

const W = 6, D = 28, Y = 26;
const FLOORS = [2, 5, 8, 11];                      // storey lines (stone string courses), 3 blocks apart
const WINDOW = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };

// Lidar roof tiers (roof height above y 0). The main mass reads 13-14 (tier 14, four storeys); the rear wing
// from row 22 reads 9-12 (tier 11, three storeys); the yard wall at row 27 reads 8; the front east end is a
// one-storey shop at 5. The west column reads 14 throughout (lidar dips at z 0, 10, 12, 13, 16 are noise).
function tier(x, z) {
  if (z === D - 1) return x === 0 ? 0 : 8;          // yard wall; the west corner is open ground
  if (x === 0) return 14;                           // west side: a full-height party wall, not the lidar dips
  if (z === 0 && x >= 4) return 5;                  // one-storey shop at the east end of the front
  if (z >= 22) return 11;                           // rear wing
  return 14;
}
const built = (x, z) => x >= 0 && x < W && z >= 0 && z < D && tier(x, z) > 0;

// Every cell is solid from y 0 up (foundation and plinth, lidar ground 0-2), so each storey stands on what is below.

const g = new Voxels([W, Y, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!built(x, z)) continue;
  const top = tier(x, z) - 1;
  // A block is exterior where a neighbour is missing or stands lower, so the lot's edge and every setback face is wall.
  const exposed = (y) => [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]]
    .some(([nx, nz]) => !built(nx, nz) || tier(nx, nz) - 1 < y);
  const front = z === 0, rear = z === D - 1;
  const pier = x === 0 || x === W - 1;

  for (let y = 0; y <= top; y++) {
    const edge = exposed(y);

    if (y === top) { put(x, y, z, edge ? "stone_bricks" : "smooth_stone"); continue; }   // parapet / roof cap

    if (y < 2) {                                    // foundation and plinth
      if (edge) put(x, y, z, "stone_bricks");
      else if (y === 1 && z === D - 2 && x >= 1 && x <= W - 2) { /* basement light area behind the rear windows */ }
      else put(x, y, z, "stone");
      if (edge && rear && y === 1 && x >= 1 && x <= W - 2) put(x, y, z, "glass_pane", WINDOW);
      continue;
    }

    if (!edge) {                                    // interior: a floor slab per storey, air elsewhere
      if (FLOORS.includes(y)) put(x, y, z, "stone");
      continue;
    }

    if (FLOORS.includes(y)) { put(x, y, z, "smooth_stone"); continue; }   // string course / sill

    const glassRow = FLOORS.some((b) => y === b + 1 || y === b + 2);
    if ((front || rear) && pier) { put(x, y, z, "stone_bricks"); continue; }
    if (front && y <= 4) {                          // shopfront and lobby door
      if (x === 1 && y === 3) put(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      else if (x === 1 && y === 4) put(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      else if (y === 3) put(x, y, z, "glass");
      else put(x, y, z, "stone_bricks");            // transom
      continue;
    }
    if ((front || rear) && glassRow) {              // steel-sash windows: panes at the ends, iron mullions between
      if (x === 2 || x === 3) put(x, y, z, "iron_bars", WINDOW);
      else put(x, y, z, "glass_pane", WINDOW);
      continue;
    }
    put(x, y, z, "bricks");
  }
}

// Warm light behind some glass (air sits behind every window): shopfront, upper storeys, rear.
put(3, 4, 1, "glowstone");
put(2, 7, 1, "glowstone");
put(4, 10, 1, "glowstone");
put(3, 12, 1, "glowstone");
put(2, 6, D - 2, "shroomlight");
put(3, 9, D - 2, "shroomlight");

// Roof: a stone penthouse on the main roof and a plant unit on the rear wing's roof, each standing on the cap.
for (const [x, z] of [[1, 4], [2, 4], [1, 5], [2, 5]]) put(x, 14, z, "stone_bricks");
for (const [x, z] of [[1, 4], [2, 4], [1, 5], [2, 5]]) put(x, 15, z, "stone_bricks");
put(2, 11, 23, "iron_block"); put(3, 11, 23, "iron_block"); put(2, 12, 23, "iron_block");

const out = g.save(`${DIR}/NYC1022670.nbt`);
console.log(out);
