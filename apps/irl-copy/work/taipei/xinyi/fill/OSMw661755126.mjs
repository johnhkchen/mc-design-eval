import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw661755126";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 6, H = 19, D = 13;
const TOP = 7;        // roof membrane level (about 7 blocks above lowest ground)
const SHOP_TOP = 3;   // ground storey occupies y gr..3
const FLOOR = 4;      // storey line / upper floor slab
const g = new Voxels([W, H, D]);

const footprint = new Map();
for (const [x, z, gr] of cells) footprint.set(`${x},${z}`, gr);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Wall/facade material for a perimeter cell at height y
function facade(x, y, z, gr) {
  const corner = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
  const front = z === 0;
  const door = front && x === 2 && gr <= 2;

  if (y === FLOOR) return ["light_gray_concrete"];           // storey line
  if (y <= SHOP_TOP) {                                      // ground storey / shopfront
    if (door) {
      if (y === gr) return ["spruce_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }];
      if (y === gr + 1) return ["spruce_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }];
      if (y === gr + 2) return ["smooth_quartz"];           // lintel above door
    }
    if (y === gr && gr <= SHOP_TOP) return ["stone_bricks"]; // base course
    if (corner) return ["smooth_quartz"];
    return ["glass"];                                       // shop glazing
  }
  // upper storey, y = 5..6
  if (corner) return ["smooth_quartz"];
  const win = (x === 0 || x === W - 1) ? (z % 2 === 1) : (x % 2 === 1);
  return win ? ["light_blue_stained_glass_pane"] : ["smooth_quartz"];
}

for (const [x, z, gr] of cells) {
  // foundation from y 0 up to the cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const perim = x === 0 || x === W - 1 || z === 0 || z === D - 1;

  if (perim) {
    // walls from ground to roof membrane
    for (let y = gr; y < TOP; y++) {
      const [id, props] = facade(x, y, z, gr);
      put(x, y, z, id, props);
    }
    // parapet cap at roof level
    put(x, TOP, z, "smooth_quartz");
  } else {
    // interior: floor slab per storey, air gap otherwise
    if (FLOOR >= gr) put(x, FLOOR, z, "smooth_stone");
    put(x, TOP, z, "red_terracotta");                        // roof tiles
  }
}

// Warm lights behind glass
for (let z = 1; z < D - 1; z++) {
  if (footprint.has(`1,${z}`) && z % 4 === 3) {
    const gr = footprint.get(`1,${z}`);
    if (gr < FLOOR) put(1, 5, z, "glowstone");              // upper storey, behind west window
  }
  if (footprint.has(`4,${z}`) && z % 4 === 1) {
    const gr = footprint.get(`4,${z}`);
    if (gr < FLOOR) put(4, 5, z, "glowstone");              // upper storey, behind east window
  }
}
if (footprint.has("2,1") && footprint.get("2,1") <= SHOP_TOP - 1) {
  put(2, footprint.get("2,1") + 1, 1, "shroomlight");      // warm light inside entrance
}

// Rooftop plant enclosure (AC/services box) on the roof membrane
for (let x = 1; x <= 2; x++) {
  for (let z = 8; z <= 9; z++) {
    if (footprint.has(`${x},${z}`)) {
      put(x, TOP + 1, z, "light_gray_concrete");
      put(x, TOP + 2, z, "light_gray_concrete");
    }
  }
}

// Lantern over the entrance
if (footprint.has("2,0") && footprint.get("2,0") <= SHOP_TOP - 2) {
  put(2, footprint.get("2,0") + 3, 0, "lantern", { hanging: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
