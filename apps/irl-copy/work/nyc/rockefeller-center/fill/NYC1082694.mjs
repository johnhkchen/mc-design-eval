// 19 West 46th Street (NYC 1082694), 1920 mixed residential and commercial: a narrow brick front on the lidar's
// 17-block tall wall (x 0, the street face), with shopfront ground floor, four windowed storeys over a stone string
// course, a stone cornice, and a one-storey rear wing (x 1..2) with a roof and a bulkhead. The lidar reads 0 over the
// rear and single 17 spikes at x 2: those are smoothed to the rear wing, so the roof is clean flat tiers.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1082694.cells.json`, "utf8"));   // [x, z, ground, roof]

const REAR = 3;             // one storey behind the street wall: the lidar's 0 and stray spikes, smoothed
const STREET_X = 0;         // the 19-long street face (faces -x)
const DOOR_Z = 9;
// warm lights: glass cells behind which a glowstone stands in the wall plane (lit panes)
const LIT = new Set(["5,5", "8,13", "11,1", "14,9", "5,17", "2,13"]);   // "y,z"; y=2 is the shop

const g = new Voxels([3, 29, 19]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

const door = (y, half) => ({ facing: "west", half, hinge: "left", open: "false", powered: "false" });

// Street face, x = 0: plinth, shopfront, string courses, window bays with brick piers, cornice
function street(y, z) {
  if (y === 0) return ["polished_granite"];                       // plinth
  if (y === 1 || y === 2) {                                        // shopfront
    if (z === DOOR_Z) return ["oak_door", door(y === 1 ? "lower" : "upper")];
    if (z % 4 === 0) return ["polished_granite"];                  // shop piers
    return LIT.has(`${y},${z}`) ? ["glowstone"] : ["glass"];
  }
  if (y === 3 || y === 4 || y === 7 || y === 10 || y === 13 || y === 16) return ["smooth_stone"];   // band, string courses, cornice
  // window rows of the four upper storeys: 5-6, 8-9, 11-12, 14-15
  if (z % 4 === 0) return ["bricks"];                              // brick piers
  if (z % 4 === 3) return ["dark_oak_planks"];                     // sash frame
  return LIT.has(`${y},${z}`) ? ["glowstone"] : ["glass"];
}

// Rear wing, x 1..2: brick walls, a stone roof membrane, a coping at the parapet, one bulkhead on the roof
function rear(x, y, z) {
  if (y === 2) return ["stone_bricks"];                            // roof membrane
  if (y === 3 && x === 2) return ["smooth_stone"];                 // parapet coping
  if (y >= 3 && y <= 4 && x >= 1 && z >= 5 && z <= 7) return ["stone_bricks"];   // stair and elevator bulkhead
  return ["bricks"];
}

// Projecting brick piers at x 1 over each pier column (z % 4 === 0): they stand on the rear wing's roof and carry a
// stone corbel under the cornice, so the window bays sit in recesses and the street face has relief from the air
const isPier = (x, z) => x === 1 && z % 4 === 0;

for (const [x, z, ground, roof] of cells) {
  // The lidar's roof is the street wall at x 0 (17 blocks); every other cell is the one-storey rear wing.
  const top = x === STREET_X ? Math.max(roof, 17) : isPier(x, z) ? 17 : REAR;
  for (let y = 0; y < top; y++) {
    if (x === STREET_X) {
      const [b, s] = street(y, z);
      put(x, y, z, b, s);
    } else if (isPier(x, z) && y >= 3) {
      put(x, y, z, y === 16 ? "smooth_stone" : "bricks");          // pier shaft, cornice corbel
    } else {
      put(x, y, z, rear(x, y, z)[0]);
    }
  }
}

const stats = g.save(`${DIR}/NYC1082694.nbt`);
console.log(stats);
