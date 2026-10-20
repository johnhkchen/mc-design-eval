import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw587265942";
const W = 35, D = 18, H = 33;

// Record: roof ~21 blocks above lowest ground; ~4 storeys of 5 blocks.
// Read as a 1990s Taipei mid-rise office: white tiled spandrels, stone-brick
// base and cornice, light-blue glass bands, ground-floor shopfront on the
// street (z = 0) face with a recessed entrance.
const ROOF_TOP = 21;   // parapet top (relative to lowest ground)
const CAP = 20;        // roof slab / cornice level
const STOREY = 5;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const minG = Math.min(...raw.map(c => c[2]));
const ground = new Map();
for (const [x, z, gr] of raw) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, gr - minG);
}
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const isInterior = (x, z) => has(x, z) && has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1);

const g = new Voxels([W, H, D]);

// Wall material for a perimeter cell at height y.
function wallBlock(y, gr, face, idx, corner) {
  if (y === gr) return "stone_bricks";          // base course
  if (y === CAP) return "smooth_stone";         // cornice
  if (y === ROOF_TOP) return "stone_bricks";    // parapet
  const r = y % STOREY;
  if (r === 0) return "white_concrete";         // storey line / spandrel
  if (r === 4) return "light_gray_concrete";    // lower spandrel band
  // window zone (r = 1..3)
  if (corner || idx % 3 === 0) return "white_concrete"; // mullions
  if (y < STOREY && face === "front") return "glass";   // shopfront
  return "light_blue_stained_glass";
}

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const perim = !isInterior(x, z);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");

  // Determine street-facing side and index along it.
  const missN = !has(x, z - 1), missS = !has(x, z + 1);
  const missW = !has(x - 1, z), missE = !has(x + 1, z);
  const corner = (missN || missS) && (missW || missE);
  let face = null, idx = 0;
  if (missN) { face = "front"; idx = x; }
  else if (missS) { face = "back"; idx = x; }
  else if (missW) { face = "left"; idx = z; }
  else if (missE) { face = "right"; idx = z; }

  for (let y = gr; y <= ROOF_TOP; y++) {
    if (perim) {
      if (y === ROOF_TOP && !(face)) continue;
      g.set(x, y, z, wallBlock(y, gr, face, idx, corner));
    } else {
      // Interior: floor slabs at ground and each storey line, roof cap.
      if (y > CAP) continue;
      if (y === gr || y % STOREY === 0) g.set(x, y, z, "light_gray_concrete");
    }
  }
}

// Recessed entrance on the street face: door at x = 17, two blocks tall.
const DOOR_X = 17;
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (x !== DOOR_X || z !== 0) continue;
  const lo = gr + 1, up = gr + 2;
  g.set(x, lo, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, up, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// Warm light behind the ground-floor and upper glass on the second row inside.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (z !== 1 || x % 3 !== 1 || !isInterior(x, z)) continue;
  for (let k = 0; k < 4; k++) {
    const y = STOREY * k + 2;
    if (y < gr + 1) continue;
    g.set(x, y, z, "shroomlight");
  }
}

// Roof: a stone-capped penthouse core and mechanical plant boxes.
const roofBox = (x0, x1, z0, z1, y0, y1, id) => {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (!isInterior(x, z)) continue;
    for (let y = y0; y <= y1; y++) g.set(x, y, z, id);
  }
};

// Penthouse: ring of white concrete with glass band, closed by a cap.
for (let x = 13; x <= 21; x++) for (let z = 7; z <= 10; z++) {
  if (!isInterior(x, z)) continue;
  const ring = x === 13 || x === 21 || z === 7 || z === 10;
  for (let y = ROOF_TOP; y <= 22; y++) {
    if (ring) g.set(x, y, z, y === 22 && (x + z) % 2 === 0 ? "light_blue_stained_glass" : "white_concrete");
  }
  g.set(x, 23, z, "light_gray_concrete");
}
g.set(17, 21, 7, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(17, 22, 7, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });

// Mechanical plant and an air-handling row.
roofBox(4, 9, 4, 7, ROOF_TOP, ROOF_TOP + 1, "light_gray_concrete");
roofBox(25, 30, 4, 6, ROOF_TOP, ROOF_TOP, "iron_block");
roofBox(25, 30, 9, 11, ROOF_TOP, ROOF_TOP, "iron_block");

g.save(`${DIR}/${ID}.nbt`);
