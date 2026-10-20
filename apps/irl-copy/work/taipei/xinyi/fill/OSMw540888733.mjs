import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540888733.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540888733.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 15, H = 23, D = 19;
const g = new Voxels([W, H, D]);

// Materials: a 1990s-era two-storey commercial block in Xinyi.
// Whitewashed concrete walls, stone base, grey concrete frames, blue-grey glazing.
const WALL = "white_concrete";
const BASE = "stone_bricks";
const GLASS = "light_blue_stained_glass";
const FRAME = "light_gray_concrete";
const LAMP = "glowstone";
const SLAB = "smooth_stone";
const CAP = "smooth_stone";
const FOUND = "stone";
const ROOF_TOP = 10;   // roof slab level (top of 2nd storey)
const PARAPET = 11;    // parapet course above roof slab
const FLOOR1 = 5;      // ground-storey ceiling / upper floor slab

const gr = new Map();
for (const [x, z, h] of cells) gr.set(x + "," + z, h);
const has = (x, z) => gr.has(x + "," + z);
const hOf = (x, z) => gr.get(x + "," + z);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// 1. Foundation and ground slab for every footprint cell.
for (const [x, z, h] of cells) {
  for (let y = 0; y < h; y++) g.set(x, y, z, FOUND);
  g.set(x, h, z, SLAB);
}

// 2. Interior floor slabs and roof slab (air gap behind the glass, no interiors).
for (const [x, z, h] of cells) {
  if (h < FLOOR1) g.set(x, FLOOR1, z, SLAB);
  if (h <= ROOF_TOP) g.set(x, ROOF_TOP, z, SLAB);
}

// 3. Perimeter walls with window grids, base course, storey lines and cornice.
const litAt = (x, z, y) => {
  if (y >= 7 && y <= 8) return (x * 7 + z * 3 + y) % 5 === 0;
  if (y >= 1 && y <= 3) return (x + z) % 4 === 0 && y === 2;
  return false;
};

for (const [x, z, h] of cells) {
  if (!isEdge(x, z)) continue;
  const onN = !has(x, z - 1), onS = !has(x, z + 1);
  const onW = !has(x - 1, z), onE = !has(x + 1, z);
  const corner = (onN || onS) && (onW || onE);
  const along = (onN || onS) ? x : z;
  const pier = corner || along % 3 === 0;

  for (let y = h; y <= ROOF_TOP; y++) {
    let b;
    if (y === h) b = BASE;
    else if (y === FLOOR1 || y === ROOF_TOP) b = FRAME;
    else if (pier) b = WALL;
    else if (y === 4 || y === 6 || y === 9) b = FRAME;
    else b = litAt(x, z, y) ? LAMP : GLASS;
    if (y > H - 1) break;
    g.set(x, y, z, b);
  }
  if (PARAPET < H) g.set(x, PARAPET, z, CAP);
}

// 4. Entrance on the +z (south) face, near the middle of that face.
let maxZ = -Infinity;
for (const [x, z] of cells) if (z > maxZ) maxZ = z;
const doorRow = cells.filter(([x, z]) => z === maxZ).map(([x]) => x);
const meanX = doorRow.reduce((a, b) => a + b, 0) / doorRow.length;
const doorX = doorRow.reduce((best, x) => (Math.abs(x - meanX) < Math.abs(best - meanX) ? x : best), doorRow[0]);
const dh = hOf(doorX, maxZ);
// Door surround: stone base columns either side are kept as solid pier.
g.set(doorX, dh, maxZ, BASE);
g.set(doorX, dh + 1, maxZ, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(doorX, dh + 2, maxZ, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(doorX, dh + 3 <= 4 ? 4 : dh + 3, maxZ, FRAME); // lintel above the door

// 5. Roof equipment: a water-tank housing on a 3x3 block of roof cells near the centre, plus an AC unit.
const cx = cells.reduce((a, [x]) => a + x, 0) / cells.length;
const cz = cells.reduce((a, [, z]) => a + z, 0) / cells.length;
let tank = null, bestD = Infinity;
for (const [x, z] of cells) {
  let ok = true;
  for (let dx = -1; dx <= 1 && ok; dx++)
    for (let dz = -1; dz <= 1 && ok; dz++) {
      const hh = hOf(x + dx, z + dz);
      if (hh === undefined || hh > ROOF_TOP) ok = false;
    }
  if (!ok) continue;
  const d = (x - cx) ** 2 + (z - cz) ** 2;
  if (d < bestD) { bestD = d; tank = [x, z]; }
}
const inTank = (x, z) => tank && Math.abs(x - tank[0]) <= 1 && Math.abs(z - tank[1]) <= 1;
if (tank) {
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++) {
      const x = tank[0] + dx, z = tank[1] + dz;
      for (let y = PARAPET; y <= 13; y++) g.set(x, y, z, FRAME);
      g.set(x, 14, z, CAP);
    }
}
const acCell = cells.find(([x, z, h]) => h <= ROOF_TOP && !inTank(x, z) && !isEdge(x, z));
if (acCell) g.set(acCell[0], PARAPET, acCell[1], "iron_block");

g.save(OUT);
