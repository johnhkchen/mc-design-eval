// Way 912170777: a two-storey plaster shop-top block with an attic and a parapet, 1920s-30s commercial,
// on flat ground (lidar: ground 0 everywhere, roof 10). Storeys: shopfront 0-3, first floor 4-7, attic 8-10.
// The shell is one block thick on the footprint's outer cells; interior cells are air except floor slabs,
// so the glass has an air gap behind it. Cream plaster walls, stone bands at each storey line and a stone
// parapet; a timber fascia over the shopfront; a plant box on the roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170777.cells.json", "utf8"));

const fp = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const grounds = new Set(cells.map(([, , g]) => g)), roofs = new Set(cells.map(([, , , r]) => r));
if (grounds.size !== 1 || roofs.size !== 1) throw new Error("this massing assumes flat ground and one roof height");
const ROOF = [...roofs][0];                                  // 10: the top course, 11 layers above y 0
if (ROOF !== 10) throw new Error(`layout is drawn for roof 10, got ${ROOF}`);

const inFp = (x, z) => fp.has(`${x},${z}`);
const STEP = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// the sides of a cell that face outside the footprint (its street or garden side); none = interior
const outward = (x, z) => Object.keys(STEP).filter((d) => !inFp(x + STEP[d][0], z + STEP[d][1]));

// Street front: the south edge (z 8), x 1..4. Shopfront glass at x 2, door at x 3, piers at the corners.
const DOOR = [3, 8];
// Warm light behind the glass: glowstone on the first-floor and shop floors; a hanging lantern in the shop.
const GLOW = new Set(["2,2,5", "4,5,5", "1,2,5"]);
const SHOP_LANTERN = "2,7,3";
// Roof plant box: a 2x2 housing on the roof's inner cells, rising 3 blocks.
const PLANT = new Set(["3,5", "4,5", "3,6", "4,6"]);

const DOOR_STATE = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });

// What sits in cell (x, y, z) of the massing: [block, state] or null for air.
function blockAt(x, y, z) {
  if (!inFp(x, z)) return null;
  const o = outward(x, z);
  const shell = o.length > 0, corner = o.length > 1;
  if (y === 0) return ["stone_bricks"];                                    // base course and ground floor slab
  if (y === ROOF) return shell ? ["smooth_stone"] : ["deepslate_tiles"];   // parapet cap, roof covering
  if (y > ROOF) {                                                          // roof plant box, 3 high
    if (!PLANT.has(`${x},${z}`)) return null;
    return y === ROOF + 3 ? ["smooth_stone"] : ["smooth_quartz"];
  }
  if (!shell) {                                                            // interior: air gap, floor slabs only
    if (y === 4 || y === 8) return ["smooth_stone"];
    if (GLOW.has(`${x},${y},${z}`)) return ["glowstone"];
    if (`${x},${y},${z}` === SHOP_LANTERN) return ["lantern", { hanging: "true" }];
    return null;
  }
  if (y === 4 || y === 8) return ["smooth_stone"];                         // storey lines
  if (corner) return ["smooth_quartz"];                                    // piers frame every bay
  if (y === 3) return ["dark_oak_planks"];                                 // timber shop fascia
  if (y === 7) return ["smooth_quartz"];                                   // lintel over the first-floor windows
  if (x === DOOR[0] && z === DOOR[1] && (y === 1 || y === 2)) {            // street door
    return ["oak_door", DOOR_STATE(y === 1 ? "lower" : "upper")];
  }
  return ["glass_pane"];                                                   // windows: shop glass, first floor, attic
}

// Panes join the glass and walls beside them, not the air, doors or lanterns.
function paneState(x, y, z) {
  const join = (dx, dz) => {
    const n = blockAt(x + dx, y, z + dz);
    return n && !/door|lantern/.test(n[0]) ? "true" : "false";
  };
  return { north: join(0, -1), south: join(0, 1), east: join(1, 0), west: join(-1, 0) };
}

const g = new Voxels([6, 23, 9]);
let placed = 0;
for (let z = 0; z < 9; z++) for (let x = 0; x < 6; x++) for (let y = 0; y <= ROOF + 3; y++) {
  const b = blockAt(x, y, z);
  if (!b) continue;
  const [block, state] = b;
  g.set(x, y, z, block, block === "glass_pane" ? paneState(x, y, z) : state);
  placed++;
}
console.log(`placed ${placed} blocks`);
g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170777.nbt");
