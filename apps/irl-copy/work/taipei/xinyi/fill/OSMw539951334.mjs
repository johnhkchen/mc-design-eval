import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi-era commercial block: two-storey shophouse with a glazed
// ground-floor shopfront, a white-tiled upper storey with pilastered windows,
// a red sign band, a light frieze and cornice, and a parapet with a rooftop unit.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw539951334";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 27, H = 23, D = 11;
const g = new Voxels([W, H, D]);

const put = (x, y, z, block, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// Footprint lookup
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);
const gnd = (x, z) => G.get(`${x},${z}`);

const xs = cells.map((c) => c[0]);
const zs = cells.map((c) => c[1]);
const grounds = cells.map((c) => c[2]);
const xMin = Math.min(...xs), xMax = Math.max(...xs);
const zMin = Math.min(...zs), zMax = Math.max(...zs);
const minG = Math.min(...grounds), maxG = Math.max(...grounds);

// Levels (absolute). Roof sits ~11 blocks above the lowest ground.
const F2 = Math.max(minG + 5, maxG + 1);   // upper floor line / string course
const R = Math.max(minG + 11, F2 + 6);     // parapet top row
const CAP = R - 1;                         // roof slab row

const isInterior = (x, z) =>
  has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1);

const isEdge = (x, z) => !isInterior(x, z);

const faceOf = (x, z) => {
  if (!has(x, z - 1)) return { face: "f", t: x - xMin };
  if (!has(x, z + 1)) return { face: "b", t: x - xMin };
  return { face: "s", t: z - zMin };
};

const wallBlock = (y, b, face, t) => {
  if (y === b) return "stone_bricks";                 // base course
  if (y === F2) return "light_gray_concrete";         // string course
  if (y === R - 2) return "light_gray_concrete";      // frieze
  if (y < F2) {                                       // ground storey
    if (y === F2 - 1) return "red_terracotta";        // sign band
    if (face === "f") {
      if (t % 4 === 0) return "light_gray_concrete";  // shopfront pilasters
      return "glass";
    }
    return t % 3 === 1 ? "glass_pane" : "white_concrete";
  }
  // upper storey (F2 < y < R-2)
  if (face === "f") {
    return t % 3 === 0 ? "light_gray_concrete" : "glass_pane";
  }
  return t % 3 === 1 ? "glass_pane" : "white_concrete";
};

// Pass 1: foundations, floors, ceilings, roof slab
for (const [x, z, b] of cells) {
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");
  put(x, b, z, isEdge(x, z) ? "stone_bricks" : "smooth_stone");
  if (F2 > b) put(x, F2, z, "smooth_stone");
  put(x, R - 2, z, "smooth_stone");
  put(x, CAP, z, "white_concrete");
}

// Pass 2: exterior walls
for (const [x, z, b] of cells) {
  if (!isEdge(x, z)) continue;
  const { face, t } = faceOf(x, z);
  for (let y = b + 1; y <= CAP - 1; y++) {
    const blk = wallBlock(y, b, face, t);
    if (blk) put(x, y, z, blk);
  }
  // Parapet with crenellations
  if (t % 2 === 0) put(x, R, z, "white_concrete");
}

// Pass 3: entrance door on the street front
const doorX = xMin + 2;
if (has(doorX, zMin) && isEdge(doorX, zMin)) {
  const b = gnd(doorX, zMin);
  put(doorX, b + 1, zMin, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false" });
  put(doorX, b + 2, zMin, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false" });
  // Entrance lintel above the door
  put(doorX, b + 3, zMin, "glass");
}

// Pass 4: warm lights behind some street-front windows (interior cells only)
for (let x = xMin + 1; x <= xMax - 1; x++) {
  if ((x - xMin) % 6 !== 3) continue;
  const z = zMin + 1;
  if (!has(x, z) || !isInterior(x, z)) continue;
  const b = gnd(x, z);
  put(x, b + 1, z, "shroomlight");
  put(x, F2 + 1, z, "shroomlight");
}

// Pass 5: rooftop plant on the interior roof deck
if (R + 1 < H) {
  for (const x of [xMin + 8, xMin + 9]) {
    for (const z of [zMin + 3, zMin + 4]) {
      if (has(x, z) && isInterior(x, z)) put(x, R, z, "light_gray_concrete");
    }
  }
  if (has(xMin + 8, zMin + 3) && isInterior(xMin + 8, zMin + 3)) {
    put(xMin + 8, R + 1, zMin + 3, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
