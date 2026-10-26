// 1722 19th St NW: a Dupont Circle red-brick apartment block with limestone trim, c. 1910-20s, on a 10 x 3 footprint.
// Lidar roof heights snap to three flat tiers: 3 (one storey wing), 6 (two storeys) and 11 (three storeys and a
// calcite parapet on the street front). The front is a 1-deep tall bay over the two-storey body; the rear is a
// 2-storey wing. The interior is a single room row (z = 1) behind the windows, with floor slabs and a ceiling per
// storey; the walls are solid everywhere else.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC76895.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell

const WALL = "bricks", TRIM = "calcite", BASE = "polished_andesite", CAP = "stone_bricks", FLOOR = "spruce_planks";
const FRONT_WIN = new Set([2, 3, 5, 6, 8]);   // z = 0 (street) windows by x; x = 3 is the entrance below storey 1
const BACK_WIN = new Set([2, 3, 5, 6, 8]);    // z = 2 (rear) windows by x
const tier = (r) => (r >= 10 ? 11 : r >= 5 ? 6 : 3);   // lidar roof → flat tier (3, 6, 11 blocks)

const shell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, top: tier(roof) }]));
const winRows = (h) => (h === 11 ? [1, 2, 4, 5, 7, 8] : h === 6 ? [1, 2, 4] : []);
const isInterior = (x, z) => z === 1 && x >= 2 && x <= 8;   // the room row behind the street and rear windows

function isWindow(x, y, z, h) {
  if (!winRows(h).includes(y)) return false;
  if (z === 0) return FRONT_WIN.has(x);
  if (z === 2) return BACK_WIN.has(x);
  return x === 9 && z === 1;                                   // the east end, glazed into the room
}

// what a footprint cell holds at height y (null = air); h is its flat-tier top (exclusive)
function blockAt(x, y, z, h) {
  if (x === 3 && z === 0 && (y === 0 || y === 1)) {          // entrance door, lower and upper halves
    const st = { facing: "south", hinge: "left", open: "false", powered: "false", half: y === 0 ? "lower" : "upper" };
    return { block: "dark_oak_door", state: st };
  }
  if (x >= 2 && x <= 3 && z === 0 && y === 3) return { block: "dark_oak_slab", state: { type: "bottom", waterlogged: "false" } };   // door canopy
  if (isInterior(x, z) && h === 6) {
    if (y === 0 || y === 3) return { block: FLOOR };                       // storey floor slabs
    if (y === 5) return { block: CAP };                                    // ceiling under the roof
    if (x === 5 && y === 1) return { block: "glowstone" };                 // lit room behind the street glass
    if (x === 8 && y === 4) return { block: "shroomlight" };
    if (x === 3 && y === 1) return { block: "lantern", state: { hanging: "false", waterlogged: "false" } };
    if (x === 2 && y === 4) return { block: "lantern", state: { hanging: "true", waterlogged: "false" } };
    return null;                                                           // air behind the glass
  }
  if (y === 0) return { block: BASE };                                     // base course on the ground
  if (x === 9 && y >= 1 && z !== 1) return { block: TRIM };               // corner quoins, street and rear
  if (y === h - 1) return { block: z === 1 && x !== 9 ? CAP : TRIM };     // cornice or flat roof
  if ((y === 3 || y === 6 || y === 9) && (z !== 1 || x === 9)) return { block: TRIM };   // storey lines
  if (isWindow(x, y, z, h)) {
    const state = z === 1 ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
                          : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
    return { block: "glass_pane", state };
  }
  return { block: WALL };
}

const g = new Voxels([10, 23, 3]);
for (const [key, { ground, top: h }] of shell) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < h; y++) {
    const b = blockAt(x, y, z, h);
    if (b) g.set(x, y, z, b.block, b.state);
  }
}

// Flat roof plant on the two-storey roof, and a brick chimney on the rear cornice (stands on the cornice cell below).
g.set(5, 6, 1, "iron_block").set(6, 6, 1, "iron_block");
g.set(8, 6, 2, WALL).set(8, 7, 2, WALL).set(8, 8, 2, TRIM);

const info = g.save(`${DIR}/DC76895.nbt`);
console.log(JSON.stringify(info));
