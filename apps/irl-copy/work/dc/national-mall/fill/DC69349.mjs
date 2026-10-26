// DC69349: a three-storey brick commercial block with a stone base, quartz cornice and a shopfront on the low (z=7) side.
// Footprint 4 x 8. Lidar roof: 6 over the main body, 4 on the south row (the downhill step). Storeys are 2 blocks:
// ground y1-2, upper y3-4, cornice y5. The roof and floors are one flat tier; the south row steps down to a 4-high cornice.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC69349.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..3, z 0..7

// per-cell ground (lidar, as given) and roof (smoothed: 5 is noise on the 6 tier, so 5 and 6 both become 6; 4 stays the south step)
const G = new Map(), R = new Map();
for (const [x, z, g, r] of cells) { G.set(`${x},${z}`, g); R.set(`${x},${z}`, r >= 5 ? 6 : 4); }
const ground = (x, z) => G.get(`${x},${z}`), roof = (x, z) => R.get(`${x},${z}`);

// the main body's south wall stands above the lower row, so it is exterior at y >= the row's roof
const exposedSouth = (x, y, z) => z === 6 && y >= roof(x, 7);
const shell = (x, y, z) => x === 0 || x === 3 || z === 0 || z === 7 || exposedSouth(x, y, z);
// window bays: two-cell bays on the long sides, the middle two on the north and the exposed south, shopfront on z 7
const windowAt = (x, y, z) => (x === 0 || x === 3) ? [1, 2, 4, 5].includes(z) : (z === 0 || exposedSouth(x, y, z)) ? [1, 2].includes(x) : false;
const pane = (x, z) => (x === 0 || x === 3) ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const DOOR = { facing: "south", hinge: "left", open: "false", powered: "false" };

const g = new Voxels([4, 18, 8]);

// the cell's block at (x, y, z), or null for air (a floor's interior air, the sky)
function blockAt(x, y, z) {
  const gr = ground(x, z), r = roof(x, z);
  if (y >= r) return null;                                    // above the roof
  if (y < gr) return ["stone_bricks"];                        // foundation: solid from y 0 up to the cell's ground
  if (y === 0) return ["stone_bricks"];                       // base course on a low cell, a plinth on the rest
  if (!shell(x, y, z)) {                                      // interior: floor slabs, roof deck, a few lights; the rest is air
    if (y === 1 || y === 3) return ["oak_planks"];
    if (y === 5) return ["stone_bricks"];                     // roof deck inside the cornice
    if (y === 2 && (x === 1 && z === 1 || x === 1 && z === 5 || x === 2 && z === 2)) return ["lantern", { hanging: "false", waterlogged: "false" }];
    if (y === 4 && (x === 1 && z === 2 || x === 2 && z === 5)) return ["glowstone"];
    return null;
  }
  if (z === 7) {                                              // the shopfront row, the entrance on the low side
    if (y === 1) return x === 0 ? ["smooth_stone"] : x === 1 ? ["dark_oak_door", { ...DOOR, half: "lower" }] : ["glass"];
    if (y === 2) return x === 0 ? ["bricks"] : x === 1 ? ["dark_oak_door", { ...DOOR, half: "upper" }] : ["glass_pane", pane(x, z)];
    if (y === 3) return x <= 2 ? ["green_concrete"] : ["smooth_quartz"];   // the entrance's green awning, the cornice beside it
    return ["smooth_stone"];                                  // y 0 handled above; y 1 handled; keep the row solid
  }
  if (y === 1) return ["smooth_stone"];                       // base course
  if (y === 3) return ["smooth_quartz"];                      // storey line (the sills and heads)
  if (y === 5) return ["smooth_quartz"];                      // cornice
  if ((y === 2 || y === 4) && windowAt(x, y, z)) return ["glass_pane", pane(x, z)];
  return ["bricks"];                                          // the piers and the wall between windows
}

for (let z = 0; z < 8; z++) for (let x = 0; x < 4; x++) {
  if (!G.has(`${x},${z}`)) continue;
  for (let y = 0; y < 18; y++) {
    const b = blockAt(x, y, z);
    if (b) g.set(x, y, z, b[0], b[1]);
  }
}
// roof plant: two light-grey boxes on the roof deck, behind the cornice
g.set(1, 6, 2, "light_gray_concrete"); g.set(2, 6, 2, "light_gray_concrete");

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC69349.nbt");
