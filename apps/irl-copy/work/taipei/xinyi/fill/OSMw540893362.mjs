import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540893362";
const W = 22, H = 23, D = 15;

const cells = JSON.parse(readFileSync(`${SRC}.cells.json`, "utf8"));
const vox = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(`${x},${z}`, gr);
}
const inside = (x, z) => ground.has(`${x},${z}`);
const minG = Math.min(...ground.values());
const x0 = Math.min(...[...ground.keys()].map(k => +k.split(",")[0]));
const z0 = Math.min(...[...ground.keys()].map(k => +k.split(",")[1]));
const zMin = z0;

// Roof sits about 11 blocks above the lowest ground: two 5-block storeys plus a parapet.
const T = minG + 11;          // first air block above the roof
const ROOF_Y = T - 1;         // roof deck / parapet level
const FLOOR1 = minG;          // ground floor slab
const FLOOR2 = minG + 5;      // second floor slab

// Materials
const FOUND = "stone_bricks";
const BASE = "stone_bricks";
const WALL = "smooth_quartz";
const SPAN = "light_gray_concrete";
const MULL = "white_concrete";
const GLASS = "light_blue_stained_glass";
const FLOOR_IN = "smooth_stone";
const PARAPET = "smooth_quartz";
const ROOF = "gray_concrete";
const PLANT = "iron_block";
const LIGHT = "shroomlight";

const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H) return;
  if (props) vox.set(x, y, z, id, props);
  else vox.set(x, y, z, id);
};

// Door: front (lowest z) edge, cell nearest the middle of that row
const frontXs = [...ground.keys()]
  .map(k => k.split(",").map(Number))
  .filter(([, z]) => z === zMin)
  .map(([x]) => x)
  .sort((a, b) => a - b);
const doorX = frontXs[Math.floor(frontXs.length / 2)];
const doorZ = zMin;
const doorG = ground.get(`${doorX},${doorZ}`);
const doorYb = doorG + 1;

// Classify a cell's exterior faces
const missing = (x, z) => ({
  mx: !inside(x - 1, z) || !inside(x + 1, z),
  mz: !inside(x, z - 1) || !inside(x, z + 1),
});
const isEdgeCell = (x, z) => {
  const { mx, mz } = missing(x, z);
  return mx || mz;
};
const hasEdgeNeighbour = (x, z) =>
  [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => {
    const nx = x + dx, nz = z + dz;
    return inside(nx, nz) && isEdgeCell(nx, nz);
  });

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const { mx, mz } = missing(x, z);
  const edge = mx || mz;
  const corner = mx && mz;

  // Solid foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);

  for (let y = gr; y <= ROOF_Y; y++) {
    // Roof deck / parapet
    if (y === ROOF_Y) {
      put(x, y, z, edge ? PARAPET : ROOF);
      continue;
    }
    // Floor slabs and spandrels
    if (y === FLOOR1 || y === FLOOR2) {
      if (edge) put(x, y, z, y === FLOOR1 ? BASE : SPAN);
      else put(x, y, z, FLOOR_IN);
      continue;
    }
    const rel = y - minG;
    if (!edge) {
      // Interior: air, with warm light just behind the glass on some cells
      if ((rel === 2 || rel === 7) && hasEdgeNeighbour(x, z) && (x + z) % 5 === 0) {
        put(x, y, z, LIGHT);
      }
      continue;
    }
    // Edge cell, non-floor, non-roof
    if (rel === 4 || rel === 9) {
      put(x, y, z, SPAN); // storey-line spandrel band
      continue;
    }
    // Window zone (rel 1..3 and 6..8)
    if (corner) {
      put(x, y, z, WALL);
      continue;
    }
    let mull;
    if (mz && !mx) mull = ((x - x0) % 3 === 0);
    else mull = ((z - z0) % 3 === 0); // mx && !mz
    put(x, y, z, mull ? MULL : GLASS);
  }
}

// Entrance door on the front face, overriding the window cell
put(doorX, doorYb, doorZ, "birch_door", {
  facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
});
put(doorX, doorYb + 1, doorZ, "birch_door", {
  facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
});
// Transom glass above the door
put(doorX, doorYb + 2, doorZ, MULL);

// Rooftop mechanical plant: two units, set back from the parapet
const xm = Math.floor((x0 + Math.max(...[...ground.keys()].map(k => +k.split(",")[0]))) / 2);
const zm = Math.floor((z0 + Math.max(...[...ground.keys()].map(k => +k.split(",")[1]))) / 2);
for (const [x, z] of [[xm - 3, zm - 2], [xm - 2, zm - 2], [xm + 2, zm + 1], [xm + 3, zm + 1]]) {
  if (!inside(x, z) || isEdgeCell(x, z)) continue;
  put(x, T, z, PLANT);
  put(x, T + 1, z, PLANT);
}

vox.save(`${SRC}.nbt`);
