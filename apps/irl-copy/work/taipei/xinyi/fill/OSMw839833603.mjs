import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833603";
const W = 16, H = 23, D = 21;

// Two-storey low-rise commercial block, c. 1980s Taipei: white tiled walls,
// stone storey bands, a shopfront ground floor, mullioned windows, flat roof
// with a parapet and a small plant box.
const BAND = 5;      // floor line between storeys
const WIN_LO = 6;    // upper-storey window rows 6..8
const WIN_HI = 8;
const LINTEL = 9;    // top band under the parapet
const ROOF = 10;     // roof membrane / parapet course (height 11 blocks)

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(gr, 8)));
}
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Street-facing side: the z-minimum exposed face (north). Door on its middle cell.
const frontCells = cells.filter(([x, z]) => !has(x, z - 1)).map(([x, z]) => x).sort((a, b) => a - b);
const doorX = frontCells.length ? frontCells[Math.floor(frontCells.length / 2)] : null;
const doorZ = frontCells.length ? cells.find(([x, z]) => x === doorX && !has(x, z - 1))[1] : null;

// Roof plant box on the interior cell nearest the centroid.
let cx = 0, cz = 0;
for (const [x, z] of cells) { cx += x; cz += z; }
cx /= cells.length; cz /= cells.length;
let plant = null, best = Infinity;
for (const [x, z] of cells) {
  if (isEdge(x, z)) continue;
  const d = (x - cx) ** 2 + (z - cz) ** 2;
  if (d < best) { best = d; plant = [x, z]; }
}

const g = new Voxels([W, H, D]);

function facadeBlock(x, z, y, gr) {
  const exN = !has(x, z - 1), exS = !has(x, z + 1);
  const exW = !has(x - 1, z), exE = !has(x + 1, z);
  const corner = (exN || exS) && (exW || exE);
  const along = (exN || exS) ? x : z;

  if (y === BAND) return "smooth_stone";
  if (y === LINTEL) return "smooth_stone";
  if (y < BAND) {
    // Ground floor shopfront: glazed bays with white concrete piers.
    if (corner || along % 4 === 0) return "white_concrete";
    return "glass";
  }
  if (y >= WIN_LO && y <= WIN_HI) {
    if (corner || along % 2 === 0) return "light_gray_concrete";
    return "light_blue_stained_glass";
  }
  return "white_concrete";
}

for (const [x, z] of cells) {
  const gr = gAt(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (!isEdge(x, z)) {
    // Interior: floor slabs and roof membrane only, air between.
    g.set(x, gr, z, "smooth_stone");
    if (BAND >= gr) g.set(x, BAND, z, "smooth_stone");
    g.set(x, ROOF, z, "light_gray_concrete");

    // Warm light behind selected upper windows on the street side.
    if (has(x, z - 1) && isEdge(x, z - 1) && x % 4 === 1 && gr <= WIN_LO) {
      g.set(x, 7, z, "shroomlight");
    }
    continue;
  }

  // Edge cell: full facade column from its ground to the lintel.
  for (let y = gr; y <= LINTEL; y++) {
    g.set(x, y, z, facadeBlock(x, z, y, gr));
  }
  // Parapet course.
  g.set(x, ROOF, z, "white_concrete");
}

// Entrance on the street face: dark oak door with a lintel above.
if (doorX !== null && gAt(doorX, doorZ) <= 3) {
  const gr = gAt(doorX, doorZ);
  g.set(doorX, gr, doorZ, "dark_oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(doorX, gr + 1, doorZ, "dark_oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // Lantern beside the door, on the ground-floor glazing line.
  const lx = doorX - 1;
  if (has(lx, doorZ) && gAt(lx, doorZ) <= gr + 2) {
    g.set(lx, gr + 2, doorZ, "white_concrete");
  }
}

// Roof plant box with a warm vent light.
if (plant) {
  const [px, pz] = plant;
  g.set(px, ROOF + 1, pz, "light_gray_concrete");
  g.set(px, ROOF + 2, pz, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
