import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise 1980s-90s Xinyi commercial block: two storeys of 5 blocks, a granite
// base course, white-tile spandrels, quartz bands, tinted glass with quartz mullions,
// a stone cornice and parapet, and a central entrance on the south (street) face.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540888741";
const W = 19, H = 23, D = 11;
const TOP = 11;          // parapet top, relative to lowest ground
const ROOF_DECK = 10;    // roof slab level
const FLOOR2 = 5;        // storey-2 floor slab level

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const minG = Math.min(...raw.map(c => c[2]));

const cells = new Map();
for (const [x, z, gr] of raw) cells.set(`${x},${z}`, gr - minG);
const entries = [...cells.entries()].map(([k, gc]) => {
  const [x, z] = k.split(",").map(Number);
  return { x, z, gc };
});
const has = (x, z) => cells.has(`${x},${z}`);
const minX = Math.min(...entries.map(e => e.x));
const minZ = Math.min(...entries.map(e => e.z));

const g = new Voxels([W, H, D]);
function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Outward directions: [dx, dz, facing]
const DIRS = [
  [0, -1, "north"],
  [0, 1, "south"],
  [-1, 0, "west"],
  [1, 0, "east"],
];

// Entrance: middle of the south (max z) street frontage
const southCells = entries
  .filter(e => !has(e.x, e.z + 1))
  .sort((a, b) => a.x - b.x);
const ent = southCells.length ? southCells[Math.floor(southCells.length / 2)] : null;

// Pass 1: foundations and interior
for (const { x, z, gc } of entries) {
  // foundation fill from y 0 up to this cell's ground
  for (let y = 0; y < gc; y++) put(x, y, z, "stone");

  const outward = DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
  if (outward.length > 0) continue;

  // interior: floor slabs at its ground, storey 2 and the roof deck
  for (const yy of [gc, FLOOR2, ROOF_DECK]) {
    if (yy >= gc && yy <= ROOF_DECK) put(x, yy, z, "smooth_stone");
  }
  // warm light: lanterns on the ground floor, shroomlights behind upper glass
  if (gc + 1 <= 4 && (x + z) % 5 === 0) {
    put(x, gc + 1, z, "lantern", { hanging: "false" });
  }
  if (gc <= FLOOR2 && (x * 2 + z) % 7 === 0) {
    put(x, FLOOR2 + 1, z, "shroomlight");
  }
  // rooftop plant box
  if (gc <= ROOF_DECK && x - minX >= 3 && x - minX <= 5 && z - minZ >= 2 && z - minZ <= 3) {
    put(x, TOP, z, "light_gray_concrete");
  }
}

// Pass 2: exterior walls with storey articulation
for (const { x, z, gc } of entries) {
  const outward = DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
  if (outward.length === 0) continue;

  const corner = outward.length >= 2;
  const uOf = ([dx]) => (dx !== 0 ? z - minZ : x - minX);
  const pillarBay = corner || outward.some(d => uOf(d) % 3 === 0);
  const isEntrance = ent && x === ent.x && z === ent.z;

  for (let y = gc; y <= TOP; y++) {
    let blk = null;
    let props = null;

    if (y <= 1) {
      blk = "polished_granite";                 // base course
    } else if (y === 4 || y === 9 || y === TOP) {
      blk = "smooth_quartz";                    // storey lines and parapet cap
    } else if (y === FLOOR2 || y === 8) {
      blk = "white_concrete";                   // spandrels
    } else if (y === 10) {
      blk = "stone_bricks";                     // cornice course
    } else {
      // window rows 2,3 (ground) and 6,7 (upper)
      if (isEntrance && (y === 2 || y === 3)) {
        blk = "light_blue_stained_glass";
      } else if (pillarBay) {
        blk = "quartz_pillar";
        props = { axis: "y" };
      } else {
        blk = "light_blue_stained_glass";
      }
    }
    put(x, y, z, blk, props);
  }
}

// Entrance door at the centre of the south frontage
if (ent && ent.gc <= 9) {
  put(ent.x, ent.gc, ent.z, "dark_oak_door",
    { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(ent.x, ent.gc + 1, ent.z, "dark_oak_door",
    { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
