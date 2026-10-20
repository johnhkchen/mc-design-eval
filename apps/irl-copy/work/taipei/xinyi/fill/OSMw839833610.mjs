import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833610";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 22, H = 23, D = 23;
const g = new Voxels([W, H, D]);

// Materials: 1990s Taipei mid-rise commercial, pale quartz walls, grey concrete piers,
// blue-green glass, stone base and parapet.
const FOUND = "stone";
const BASE = "stone_bricks";
const WALL = "quartz_block";
const PIER = "light_gray_concrete";
const GLASS = "light_blue_stained_glass";
const TRIM = "smooth_stone";
const DOOR = "tinted_glass";
const LIGHT = "glowstone";

const key = (x, z) => `${x},${z}`;
const cellMap = new Map(cells.map(([x, z, gr]) => [key(x, z), Math.round(gr)]));
const has = (x, z) => cellMap.has(key(x, z));
const isEdge = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);

// Front = southern-most row (min z); entrance at the middle of that row.
const minZ = Math.min(...cells.map(c => c[1]));
const minX = Math.min(...cells.map(c => c[0]));
const maxX = Math.max(...cells.map(c => c[0]));
const maxZ = Math.max(...cells.map(c => c[1]));
const frontXs = cells.filter(c => c[1] === minZ).map(c => c[0]).sort((a, b) => a - b);
const doorX = frontXs[Math.floor(frontXs.length / 2)];

// Storey levels (absolute, roof surface at y = 11 above lowest ground):
//  base course / ground slab at `base`, shopfront glass base+1..3, lintel 4,
//  storey line 5, upper glazing 6..8, spandrel 9, parapet/roof deck 10,
//  plant room 11..12, lightning rod 13.
let lightCount = 0;

for (const [x, z, gr] of cells) {
  const ground = Math.max(0, gr);
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < ground; y++) g.set(x, y, z, FOUND);

  const base = Math.min(ground, 4);
  const edge = isEdge(x, z);
  const k = x + z;
  const pier = k % 3 === 0;

  // Floor slab / base course at the bottom of the building.
  g.set(x, base, z, edge ? BASE : TRIM);

  // Ground floor: shopfront glass with piers, lintel band above.
  if (edge) {
    for (let y = base + 1; y <= 3; y++) {
      g.set(x, y, z, pier ? PIER : GLASS);
    }
    if (base < 4) g.set(x, 4, z, WALL);
  }

  // Storey line at y=5 (floor slab for every cell).
  g.set(x, 5, z, TRIM);

  // Upper storey: glazing 6..8, spandrel 9.
  if (edge) {
    for (let y = 6; y <= 8; y++) {
      g.set(x, y, z, pier ? PIER : GLASS);
    }
    g.set(x, 9, z, WALL);
  }

  // Parapet / roof deck at y=10.
  g.set(x, 10, z, TRIM);

  // Entrance: glass door two blocks high with a stone lintel over it.
  if (edge && z === minZ && x === doorX) {
    g.set(x, base + 1, z, DOOR);
    g.set(x, base + 2, z, DOOR);
    g.set(x, 4, z, TRIM);
  }
}

// Warm light behind some windows (interior cell next to an edge cell).
for (const [x, z] of cells) {
  if (!isEdge(x, z)) continue;
  const k = x + z;
  if (k % 3 === 0) continue;               // piers only
  if (k % 7 !== 0) continue;               // sparse
  const neigh = [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]]
    .find(([nx, nz]) => has(nx, nz) && !isEdge(nx, nz));
  if (!neigh) continue;
  const [nx, nz] = neigh;
  if (lightCount % 2 === 0) g.set(nx, 7, nz, LIGHT);
  else g.set(nx, 2, nz, LIGHT);
  lightCount++;
}

// Roof plant room in the centre of the footprint, on the roof deck at y=10.
const cx = Math.round((minX + maxX) / 2);
const cz = Math.round((minZ + maxZ) / 2);
for (const [x, z] of cells) {
  if (Math.abs(x - cx) <= 2 && Math.abs(z - cz) <= 2) {
    g.set(x, 11, z, PIER);
    g.set(x, 12, z, PIER);
  }
}
if (has(cx, cz)) g.set(cx, 13, cz, "lightning_rod");

g.save(`${DIR}/${ID}.nbt`);
