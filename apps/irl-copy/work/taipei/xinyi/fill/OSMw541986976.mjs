import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unrecorded mid-rise Xinyi commercial block, c. 1990s: two storeys of white
// tiled concrete, glass window bands, a grey base and spandrels, a parapet,
// and a small rooftop penthouse with plant. Front faces south (z = max).
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541986976";
const W = 14, H = 23, D = 16;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const ROOF_Y = 10;     // roof slab; parapet rises above it
const FLOOR_Y = 5;     // second-storey floor slab
const WALL = "white_concrete";
const BAND = "light_gray_concrete";
const BASE = "gray_concrete";
const PANE = "glass";
const TRIM = "white_concrete";
const WIN_ROWS = new Set([1, 2, 3, 6, 7, 8]);
const BAND_ROWS = new Set([4, 5, 9]);

const maxZ = Math.max(...cells.map(([, z]) => z));

// Perimeter / corner tests on the footprint
const perim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const corner = (x, z) => (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));
// Mullion (pier) rhythm: every third bay along the face
const isMullion = (x, z) => {
  if (corner(x, z)) return true;
  const onNS = !has(x, z - 1) || !has(x, z + 1); // north/south face: run along x
  return onNS ? x % 3 === 0 : z % 3 === 0;
};

// 1. Foundations, interior floor and roof slabs
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  if (gr <= FLOOR_Y) put(x, FLOOR_Y, z, BAND);
  if (gr <= ROOF_Y) put(x, ROOF_Y, z, BAND);
}

// 2. Perimeter walls: base course, window bands, spandrels, parapet
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (!perim(x, z)) continue;
  const windowable = !corner(x, z);

  if (gr <= ROOF_Y) {
    for (let y = gr; y <= ROOF_Y; y++) {
      if (y === gr) put(x, y, z, BASE);
      else if (y === ROOF_Y || BAND_ROWS.has(y)) put(x, y, z, BAND);
      else if (WIN_ROWS.has(y) && y > gr && windowable && !isMullion(x, z)) put(x, y, z, PANE);
      else put(x, y, z, WALL);
    }
    // Parapet and cap
    put(x, ROOF_Y + 1, z, TRIM);
    put(x, ROOF_Y + 2, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

// 3. Warm light behind some glass on the front (south) face, and upper floor
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (z !== maxZ - 1 || !has(x, z)) continue;
  if (x % 6 === 2 && gr + 2 <= 3) put(x, gr + 2, z, "glowstone");
  if (x % 6 === 4) put(x, 7, z, "shroomlight");
}

// 4. Entrance: centre bay of the south face, dark oak door under a lantern
const frontCells = cells
  .filter(([, z]) => z === maxZ)
  .map(([x, , gr]) => [x, gr])
  .sort((a, b) => a[0] - b[0]);
if (frontCells.length) {
  const [dx, gd] = frontCells[Math.floor(frontCells.length / 2)];
  const dz = maxZ;
  // Surround the door with trim piers
  put(dx - 1, gd, dz, TRIM);
  put(dx + 1, gd, dz, TRIM);
  put(dx, gd, dz, "dark_oak_door", {
    facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(dx, gd + 1, dz, "dark_oak_door", {
    facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  put(dx, gd + 2, dz, "lantern", { hanging: "true", waterlogged: "false" });
  // Lintel above the door
  put(dx, gd + 3, dz, BAND);
}

// 5. Rooftop penthouse, centred, with glazed faces and a flat cap
const PX0 = 4, PX1 = 9, PZ0 = 5, PZ1 = 10;
for (let x = PX0; x <= PX1; x++) {
  for (let z = PZ0; z <= PZ1; z++) {
    if (!has(x, z)) continue;
    const ring = x === PX0 || x === PX1 || z === PZ0 || z === PZ1;
    put(x, 11, z, ring ? WALL : BAND);
    put(x, 14, z, BAND);
    if (ring) {
      for (const y of [12, 13]) {
        const middle = (x === PX0 || x === PX1) ? (z > PZ0 && z < PZ1) : (x > PX0 && x < PX1);
        put(x, y, z, middle && y === 12 ? PANE : WALL);
      }
    }
  }
}

// 6. Rooftop plant: condenser units and a small water tank
const plant = [[2, 3], [3, 3], [2, 4], [11, 12], [12, 12], [11, 13]];
for (const [x, z] of plant) {
  if (has(x, z)) put(x, 11, z, "iron_block");
}
if (has(12, 2)) {
  put(12, 11, 2, "oak_planks");
  put(12, 12, 2, "oak_planks");
  put(12, 13, 2, "oak_fence");
}

g.save(`${DIR}/${ID}.nbt`);
