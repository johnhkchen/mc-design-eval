import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw1016280251";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 7, H = 33, D = 21;
const g = new Voxels([W, H, D]);

// Footprint lookup: key "x,z" -> ground (rounded, relative to lowest ground so y 0 = lowest)
const raw = new Map();
for (const [x, z, gr] of cells) raw.set(`${x},${z}`, Math.round(gr));
const minG = Math.min(...raw.values());
const ground = new Map();
for (const [k, v] of raw) ground.set(k, v - minG);

const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

function put(x, y, z, block, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// Perimeter: a footprint cell with at least one neighbour outside the footprint
const missingX = (x, z) => !has(x - 1, z) || !has(x + 1, z);
const missingZ = (x, z) => !has(x, z - 1) || !has(x, z + 1);
const isPerim = (x, z) => missingX(x, z) || missingZ(x, z);
const cornerCell = (x, z) => missingX(x, z) && missingZ(x, z);

// Pier (solid white concrete) versus glass bay on the facade
function isPier(x, z) {
  if (cornerCell(x, z)) return true;
  if (missingX(x, z)) return z % 3 === 0 || z === D - 1; // long walls
  return x % 3 === 0;                                     // end walls
}

// Interior cell directly behind a facade cell (for a warm light)
function behind(x, z) {
  if (missingX(x, z)) return x === 0 ? [1, z] : [W - 2, z];
  return z === 0 ? [x, 1] : [x, D - 2];
}

// Door on the z=0 facade at x=3 (street side, faces north)
const doorX = 3, doorZ = 0;
const doorOK = has(doorX, doorZ);

// 1. Foundation, ground floor slab, storey slabs, roof slab, parapet
for (const [k, gb] of ground) {
  const [x, z] = k.split(",").map(Number);
  const perim = isPerim(x, z);

  // solid foundation under the building up to the cell's ground
  for (let y = 0; y < gb; y++) put(x, y, z, "stone_bricks");

  // floor slabs at each storey line (interior floors; perimeter gets base/spandrel below)
  for (let s = 0; s <= 4; s++) {
    const yFloor = gb + s * 5;
    if (s === 0) {
      put(x, yFloor, z, perim ? "polished_andesite" : "light_gray_concrete");
    } else if (s < 4) {
      put(x, yFloor, z, "light_gray_concrete");
    } else {
      // roof slab over the top storey
      put(x, yFloor, z, "light_gray_concrete");
    }
  }

  // parapet on the perimeter, cornice line just above roof
  if (perim) {
    put(x, gb + 21, z, "stone_brick_wall");
  }
}

// 2. Facade walls, four storeys of 5 blocks each
for (const [k, gb] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (!isPerim(x, z)) continue;
  const pier = isPier(x, z);

  for (let s = 0; s < 4; s++) {
    const yb = gb + s * 5;

    // k=0 band: base course on ground floor, spandrel on upper floors
    put(x, yb, z, s === 0 ? "polished_andesite" : "light_gray_concrete");

    for (let k2 = 1; k2 <= 3; k2++) {
      const y = yb + k2;
      const isDoorCell = s === 0 && x === doorX && z === doorZ && doorOK;

      if (isDoorCell && k2 === 1) {
        put(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (isDoorCell && k2 === 2) {
        put(x, y, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (isDoorCell && k2 === 3) {
        put(x, y, z, "light_gray_concrete"); // lintel over the entrance
        continue;
      }

      if (pier || cornerCell(x, z)) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "glass_pane");
      }
    }

    // top of each upper storey: a light frame course at k=4 is the next band (already placed)
  }

  // warm light behind some glass bays, in the middle of each window column
  if (!pier && !cornerCell(x, z)) {
    for (let s = 0; s < 4; s++) {
      if ((x + z + s) % 3 !== 0) continue;
      const [ix, iz] = behind(x, z);
      if (!has(ix, iz) || isPerim(ix, iz)) continue;
      const yl = gb + s * 5 + 2;
      put(ix, yl, iz, "glowstone");
    }
  }
}

// 3. Roof equipment box and corner lanterns
for (let x = 2; x <= 4; x++) {
  for (let z = 8; z <= 11; z++) {
    if (!has(x, z)) continue;
    const gb = gnd(x, z);
    put(x, gb + 21, z, "smooth_stone");
    put(x, gb + 22, z, "smooth_stone");
  }
}

for (const [x, z] of [[0, 0], [W - 1, 0], [0, D - 1], [W - 1, D - 1]]) {
  if (!has(x, z)) continue;
  const gb = gnd(x, z);
  put(x, gb + 22, z, "lantern", { hanging: "false" });
}

g.save(`${dir}/${id}.nbt`);
