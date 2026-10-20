import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1174690416";
const W = 18, H = 23, D = 15;

// Low-rise Xinyi commercial block (no record): two storeys of 5 blocks on a
// concrete base, white-concrete piers, shopfront glass at grade, blue-tinted
// window bays above, a grey roof with parapet and a central plant penthouse.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, gr);
}
const has = (x, z) => ground.has(`${x},${z}`);
const gy = (x, z) => ground.get(`${x},${z}`);
const inside = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;

// Only writes on footprint cells, inside the grid.
const put = (x, y, z, b, p) => {
  if (!inside(x, y, z) || !has(x, z)) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const DIRS = [
  { dx: 0, dz: -1 }, // north face
  { dx: 0, dz: 1 },  // south face
  { dx: -1, dz: 0 }, // west face
  { dx: 1, dz: 0 },  // east face
];

// Outward normal of an edge cell (first missing neighbour), or null for interior.
const outward = (x, z) => {
  for (const d of DIRS) {
    if (!has(x + d.dx, z + d.dz)) return d;
  }
  return null;
};

const mullion = (x, z) => (x + z) % 3 === 0;

// Pass 1: foundations, floor slabs and roof slab for every footprint cell.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");   // foundation
  put(x, gr, z, "light_gray_concrete");                       // ground floor slab
  put(x, gr + 5, z, "light_gray_concrete");                   // storey line
  put(x, gr + 10, z, "gray_concrete");                        // roof slab
}

// Pass 2: facade on the perimeter cells.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const o = outward(x, z);
  if (!o) continue;

  const isCorner = outward(x, z) && (!has(x + 1, z) || !has(x - 1, z)) && (!has(x, z + 1) || !has(x, z - 1));
  const isEntrance = o.dz === -1 && x === 9 && has(9, 0);
  const m = mullion(x, z);

  // Storey 1: shopfront.
  if (isEntrance) {
    // Doorway left open, timber frame over it.
    put(x, gr + 3, z, "dark_oak_planks");
  } else {
    put(x, gr + 1, z, "smooth_stone");                       // bulkhead
    put(x, gr + 2, z, m ? "white_concrete" : "glass");
    put(x, gr + 3, z, m ? "white_concrete" : "glass");
  }
  put(x, gr + 4, z, "white_concrete");                        // lintel band

  // Band between storeys.
  put(x, gr + 5, z, "white_concrete");

  // Storey 2: window bays with sills and heads.
  put(x, gr + 6, z, "white_concrete");
  const glassCell = !m;
  put(x, gr + 7, z, glassCell ? "light_blue_stained_glass" : "white_concrete");
  put(x, gr + 8, z, glassCell ? "light_blue_stained_glass" : "white_concrete");
  put(x, gr + 9, z, "white_concrete");

  // Parapet and corner piers.
  put(x, gr + 10, z, "white_concrete");
  put(x, gr + 11, z, "white_concrete");
  if (isCorner) put(x, gr + 12, z, "white_concrete");

  // Warm light behind some storey-2 and storey-1 windows.
  if (glassCell) {
    const ix = x - o.dx, iz = z - o.dz;
    if (has(ix, iz) && (x * 5 + z * 3) % 4 === 0) {
      put(ix, gr + 7, iz, "glowstone");
    }
  }
  if (!m && !isEntrance && (x * 7 + z) % 5 === 1) {
    const ix = x - o.dx, iz = z - o.dz;
    if (has(ix, iz)) put(ix, gr + 2, iz, "shroomlight");
  }
}

// Pass 3: roof plant penthouse and rooftop equipment on the central cells.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (outward(x, z)) continue;
  if (x < 6 || x > 11 || z < 4 || z > 10) continue;
  put(x, gr + 11, z, "light_gray_concrete");
  put(x, gr + 12, z, "smooth_stone");
}

// Lightning rod on the penthouse, if that cell exists.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (x === 9 && z === 7 && !outward(x, z)) {
    put(x, gr + 13, z, "lightning_rod", { facing: "up" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
