import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. Lidar roof ~11 blocks above lowest ground.
// Read as a 1970s-80s Taipei low-rise commercial block: two storeys of
// reinforced concrete, white and grey tiled spandrels, aluminium-framed
// glass, a dark shopfront at street level and a flat roof with plant boxes.
// Two storeys of about 5 blocks each, roof surface at absolute y = 11.

const W = 14, H = 23, D = 54;
const ROOF = 11;          // roof surface y (top block index 10)
const STOREY = 5;         // storey line at y = 5
const CORNICE = 10;       // cornice / roof edge course
const TRANSOM = 4;        // shopfront transom

const cells = JSON.parse(readFileSync(
  "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1042397485.cells.json",
  "utf8"
));

const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const gmap = new Map();
let maxZ = -Infinity;
for (const [x, z, gr] of cells) {
  gmap.set(key(x, z), Math.max(0, Math.min(H - 2, Math.round(gr))));
  if (z > maxZ) maxZ = z;
}
const has = (x, z) => gmap.has(key(x, z));

// Edge cells: any side open to the outside.
const isEdge = (x, z) => !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);
// Ring cells: interior cells touching an edge (sit behind the facade).
const isRing = (x, z) =>
  !isEdge(x, z) && (isEdge(x, z - 1) || isEdge(x, z + 1) || isEdge(x - 1, z) || isEdge(x + 1, z));

// Facade material by absolute y and along-face index a.
function facade(y, a, isDoor) {
  if (y === STOREY) return "light_gray_concrete";           // storey line
  if (y === CORNICE) return "smooth_stone";                  // cornice
  if (y <= TRANSOM) {                                        // shopfront
    if (isDoor) return y === TRANSOM ? "smooth_stone" : "glass";
    if (y === TRANSOM) return "white_concrete";
    return a % 3 === 0 ? "gray_concrete" : "glass";
  }
  if (y === 6 || y === 9) return "white_concrete";           // spandrels
  return a % 3 === 0 ? "light_gray_concrete" : "glass";     // window bays
}

const doorX = (x) => x >= 6 && x <= 8;

for (const [k, gy] of gmap) {
  const [x, z] = k.split(",").map(Number);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone_bricks");

  // Cells standing above the roof level: cap them and stop.
  if (gy >= CORNICE) {
    g.set(x, gy, z, "gray_concrete");
    continue;
  }

  // Floor / base course at ground.
  g.set(x, gy, z, "smooth_stone");

  const s = !has(x, z + 1);
  const n = !has(x, z - 1);
  const edge = isEdge(x, z);

  if (edge) {
    const a = (n || s) ? x : z;
    const isDoor = s && z === maxZ && doorX(x);
    for (let y = gy + 1; y <= ROOF - 1; y++) {
      g.set(x, y, z, facade(y, a, isDoor));
    }
    // Roof edge: cornice course at the top, nothing else above it.
    g.set(x, CORNICE, z, "smooth_stone");
  } else {
    // Interior: air behind the glass, floor slabs per storey, roof deck.
    if (STOREY > gy) g.set(x, STOREY, z, "smooth_stone");
    g.set(x, CORNICE, z, "gray_concrete");

    // Warm light behind the facade on ring cells.
    if (isRing(x, z)) {
      if ((x + z) % 3 === 0 && 7 > gy) g.set(x, 7, z, "glowstone");
      if ((x * 2 + z) % 5 === 0 && 2 > gy) g.set(x, 2, z, "shroomlight");
    }

    // Roof plant: small air-conditioning units and planter boxes.
    if (x % 4 === 1 && z % 6 === 2) {
      g.set(x, ROOF, z, "iron_block");
    } else if (x % 4 === 3 && z % 6 === 4) {
      g.set(x, ROOF, z, "moss_block");
    }
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1042397485.nbt");
