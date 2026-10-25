import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1980 stone residential block, 3 storeys, 8 x 14 footprint.
// Storeys are kept as the record states; the lidar roof is used only as a reference.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499498";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 8, H = 16, D = 14;
const g = new Voxels([W, H, D]);

const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};

// footprint lookup
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const at = (x, z) => ground.has(`${x},${z}`);
const sides = (x, z) =>
  (!at(x + 1, z) ? 1 : 0) + (!at(x - 1, z) ? 1 : 0) +
  (!at(x, z + 1) ? 1 : 0) + (!at(x, z - 1) ? 1 : 0);
const isEdge = (x, z) => sides(x, z) > 0;

// flat storey tiers above the highest ground
const maxG = Math.max(...cells.map((c) => c[2]));
const sh = Math.max(2, Math.min(4, Math.floor((14 - maxG) / 3)));
const base = [0, 1, 2, 3].map((s) => maxG + s * sh); // base[0] ground floor, base[3] top
const top = base[3];

// street entrance: an edge cell on the lowest-z side, middle of that run
const zMin = Math.min(...cells.map((c) => c[1]));
const streetXs = cells
  .filter(([x, z]) => z === zMin)
  .map((c) => c[0])
  .sort((a, b) => a - b);
const doorX = streetXs.length ? streetXs[Math.floor(streetXs.length / 2)] : -1;
const doorZ = zMin;

for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const edge = isEdge(x, z);
  const corner = sides(x, z) >= 2;

  // foundation and plinth up to the ground floor slab
  for (let y = 0; y <= base[0]; y++) put(x, y, z, "stone_bricks");

  // floor slabs / storey lines across the footprint
  for (let s = 1; s <= 3; s++) put(x, base[s], z, "smooth_stone");

  if (edge) {
    // ground-floor base course, a little lighter than the walls
    put(x, base[0] + 1, z, "polished_andesite");
    for (let s = 0; s < 3; s++) {
      for (let y = base[s] + 1; y <= base[s] + sh - 1; y++) {
        if (corner) { put(x, y, z, "polished_andesite"); continue; }
        const i = (x === 0 || x === W - 1) ? z : x;
        // pilaster every 4th cell along the long walls
        if (i % 4 === 0) { put(x, y, z, "polished_andesite"); continue; }
        // window bays on odd cells, stone infill on even
        if (i % 2 === 1) put(x, y, z, "glass");
        else put(x, y, z, "stone_bricks");
      }
    }
    // parapet along the roof edge
    put(x, top + 2, z, "stone_brick_wall");
  }

  // flat roof surface
  put(x, top + 1, z, "deepslate_tiles");
}

// entrance door on the street face, with a lintel above it
if (doorX >= 0) {
  put(doorX, base[0] + 1, doorZ, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(doorX, base[0] + 2, doorZ, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(doorX, base[0] + 3, doorZ, "polished_andesite");
}

// warm lamps behind a few windows, in the interior air gap
let n = 0;
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (!isEdge(x, z) || sides(x, z) >= 2) continue;
  n++;
  if (n % 4 !== 0) continue;
  let ix = x, iz = z;
  if (x === 0) ix = 1; else if (x === W - 1) ix = W - 2;
  if (z === 0) iz = 1; else if (z === D - 1) iz = D - 2;
  if (!at(ix, iz) || isEdge(ix, iz)) continue;
  const s = (n >> 2) % 3;
  put(ix, base[s] + 1, iz, s === 1 ? "shroomlight" : "glowstone");
}

// one chimney on an interior cell
const interior = cells.find(([x, z]) => !isEdge(x, z));
if (interior && top + 3 < H) {
  put(interior[0], top + 2, interior[1], "bricks");
  put(interior[0], top + 3, interior[1], "bricks");
}

g.save(`${DIR}/${ID}.nbt`);
