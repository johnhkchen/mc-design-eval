// Decision from the record: no archive entry, so this is a generic Xinyi-district office block.
// Reading the lidar roof height (31 blocks above lowest ground) as six storeys of ~5 blocks,
// it is a late-1990s/2000s speculative office building: white concrete piers and floor bands,
// tinted glass window bays, a granite plinth, a ground-floor glazed entrance, a white cornice
// with crenellated parapet, and a rooftop plant core with a lightning-rod mast.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw588117487";
const W = 26, H = 43, D = 22;
const ROOF = 31;          // roof slab level (top of walls is ROOF-1)

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Lookup of footprint cells and their ground heights
const ground = new Map();
let minX = Infinity, minZ = Infinity;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, gr);
  if (x < minX) minX = x;
  if (z < minZ) minZ = z;
}
const inFp = (x, z) => ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);
const isBoundary = (x, z) => !inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1);

// Entrance: two bays on the minZ face, near the middle
const entranceX = (x) => x === minX + 12 || x === minX + 13;
const isEntrance = (x, z) => z === minZ && entranceX(x);

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Pass 1: envelope, foundations, floors, roof
for (const [x, z, gr] of cells) {
  const bnd = isBoundary(x, z);
  const cornerCell = !inFp(x - 1, z) + !inFp(x + 1, z) > 0 && !inFp(x, z - 1) + !inFp(x, z + 1) > 0 ? true : false;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Pier index runs along whichever facade the boundary cell sits on
  const faceAlongX = !inFp(x, z - 1) || !inFp(x, z + 1);
  const idx = faceAlongX ? (x - minX) : (z - minZ);
  const isPier = cornerCell || idx % 4 === 0;

  for (let y = gr; y < ROOF; y++) {
    const k = y % 5;
    if (bnd) {
      if (y === gr) {
        put(x, y, z, "polished_granite");                       // plinth course
      } else if (isEntrance(x, z) && y <= gr + 3) {
        put(x, y, z, "glass");                                   // glazed entrance
      } else if (k === 0) {
        put(x, y, z, "white_concrete");                          // floor band
      } else if (k === 4) {
        put(x, y, z, "light_gray_concrete");                     // spandrel
      } else {
        put(x, y, z, isPier ? "white_concrete" : "light_blue_stained_glass"); // piers / glazing
      }
    } else {
      // Interior: floor slabs only, air gap otherwise (no interiors)
      if (y === gr || k === 0) put(x, y, z, "smooth_stone");
    }
  }

  // Cornice / roof slab at ROOF
  put(x, ROOF, z, bnd ? "white_concrete" : "light_gray_concrete");

  // Crenellated parapet
  if (bnd && (x + z) % 2 === 0) put(x, ROOF + 1, z, "white_concrete");
}

// Pass 2: warm lights behind some glazed bays, and inside the entrance
for (const [x, z, gr] of cells) {
  if (!isBoundary(x, z)) continue;
  const ix = x + (!inFp(x - 1, z) ? 1 : (!inFp(x + 1, z) ? -1 : 0));
  const iz = z + (!inFp(x, z - 1) ? 1 : (!inFp(x, z + 1) ? -1 : 0));
  if (!inFp(ix, iz) || isBoundary(ix, iz)) continue;

  if (isEntrance(x, z)) {
    put(ix, gr + 2, iz, "glowstone");
    continue;
  }
  for (let y = gr + 1; y < ROOF; y++) {
    const k = y % 5;
    if (k < 1 || k > 3) continue;
    const faceAlongX = !inFp(x, z - 1) || !inFp(x, z + 1);
    const idx = faceAlongX ? (x - minX) : (z - minZ);
    const isPier = (!inFp(x - 1, z) && !inFp(x, z - 1)) || idx % 4 === 0;
    if (isPier) continue;
    if (((x + z + Math.floor(y / 5)) % 5) === 0) put(ix, y, iz, "glowstone");
  }
}

// Pass 3: rooftop plant core, louvres, mast
for (const [x, z, gr] of cells) {
  const inCore = x >= minX + 6 && x <= minX + 19 && z >= minZ + 5 && z <= minZ + 16;
  if (!inCore) continue;
  const coreEdge = x === minX + 6 || x === minX + 19 || z === minZ + 5 || z === minZ + 16;
  for (let y = ROOF + 1; y <= ROOF + 3; y++) {
    put(x, y, z, coreEdge && y === ROOF + 2 ? "iron_bars" : "light_gray_concrete");
  }
  put(x, ROOF + 4, z, "smooth_stone");                           // plant-core cap
}

// Mast on the core centreline
const mx = minX + 13, mz = minZ + 10;
for (let y = ROOF + 5; y <= ROOF + 9; y++) {
  put(mx, y, mz, "lightning_rod", { facing: "up" });
}

g.save(`${DIR}/${ID}.nbt`);
