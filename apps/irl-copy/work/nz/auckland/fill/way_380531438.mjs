// Federal Court, Mt Eden side of the CBD: a 1970s concrete civic block. A solid white-concrete massif on the
// footprint, stone plinth where the ground falls away, a storey-banded glazed facade (4-block storeys: spandrel,
// two glass rows, head), mullions every 3 blocks, a 1-block air pocket behind each pane with warm glowstone in
// some, a dark-oak entrance under a concrete lintel, a parapet cap and roof plant. Tiers follow the lidar roof:
// 26 main roof, 28 wings, 29 tower core.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_380531438.cells.json", "utf8"));
const W = 33, D = 25, H = 42;
const key = (x, z) => `${x},${z}`;

// per-column ground and tiered top (lidar noise snapped to 26 / 28 / 29)
const ground = new Map(), top = new Map();
for (const [x, z, G, R] of cells) { ground.set(key(x, z), G); top.set(key(x, z), R >= 29 ? 29 : R >= 28 ? 28 : 26); }
const inFp = (x, z) => top.has(key(x, z));
const T = (x, z) => top.get(key(x, z)) ?? 0;
const G = (x, z) => ground.get(key(x, z)) ?? 0;

const FACES = [[0, -1], [0, 1], [1, 0], [-1, 0]];      // north, south, east, west (outward)
const exposedDirs = (x, y, z) => FACES.filter(([dx, dz]) => !inFp(x + dx, z + dz) || T(x + dx, z + dz) <= y);
const isCorner = (x, z, dx, dz) => (dz !== 0 ? x === 0 || x === W - 1 : z === 0 || z === D - 1);
const along = (x, z, dz) => (dz !== 0 ? x : z);

// the entrance: the lowest street-side cell on the south face, middle of the run
const southCells = cells.filter(([, z]) => z === Math.max(...cells.map(c => c[1])));
const minG = Math.min(...southCells.map(c => c[2]));
const lowSouth = southCells.filter(c => c[2] === minG).map(c => c[0]).sort((a, b) => a - b);
const doorX = lowSouth[Math.floor(lowSouth.length / 2)];
const doorZ = D - 1;

const out = new Map();   // "x,y,z" -> [block, state] or null (air)
const pockets = new Map();
const put = (x, y, z, block, state) => out.set(`${x},${y},${z}`, [block, state]);

for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const t = T(x, z), gr = G(x, z);
  for (let y = 0; y < t; y++) {
    const ex = exposedDirs(x, y, z);
    if (y < gr) { put(x, y, z, "stone_bricks"); continue; }                  // plinth where the ground falls away
    if (!ex.length) {                                                         // the massif
      put(x, y, z, y === t - 1 ? "light_gray_concrete" : "white_concrete");   // roof membrane / concrete core
      continue;
    }
    const [dx, dz] = ex[0];
    const a = along(x, z, dz), r = y % 4;
    if (y === t - 1) { put(x, y, z, "light_gray_concrete"); continue; }      // parapet cap
    if (r === 0) { put(x, y, z, "light_gray_concrete"); continue; }          // storey slab line
    if (r === 3) { put(x, y, z, "white_concrete"); continue; }               // head
    const mullion = a % 3 === 0 || isCorner(x, z, dx, dz);
    if (mullion) { put(x, y, z, "light_gray_concrete"); continue; }
    put(x, y, z, "light_blue_stained_glass");
    // air gap behind the pane (two cells in), a lamp in some bays
    const ix = x - dx, iz = z - dz;
    if (inFp(ix, iz) && T(ix, iz) > y && inFp(ix - dx, iz - dz) && !exposedDirs(ix, y, iz).length) {
      pockets.set(`${ix},${y},${iz}`, r === 1 && a % 6 === 4 ? ["glowstone"] : null);
    }
  }
}
// pockets last, so the massif's own fill of those inner cells doesn't close them
for (const [k, v] of pockets) out.set(k, v);

// entrance: dark-oak door on the south face, light-grey surround and lintel
const doorBase = (x, y, z, half) => ["dark_oak_door", { facing: "south", half, hinge: x < doorX ? "left" : "right", open: "false", powered: "false" }];
{
  const [b0, s0] = doorBase(doorX, 0, doorZ, "lower");
  put(doorX, 0, doorZ, b0, s0);
  const [b1, s1] = doorBase(doorX, 1, doorZ, "upper");
  put(doorX, 1, doorZ, b1, s1);
  put(doorX, 2, doorZ, "light_gray_concrete");
  put(doorX - 1, 0, doorZ, "light_gray_concrete"); put(doorX - 1, 1, doorZ, "light_gray_concrete");
  put(doorX + 1, 0, doorZ, "light_gray_concrete"); put(doorX + 1, 1, doorZ, "light_gray_concrete");
}

// roof plant: iron vent boxes on the 26 roof, well inside the parapet
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  if (T(x, z) !== 26 || x % 5 !== 2 || z % 5 !== 2) continue;
  const interior = [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dz]) => inFp(x + dx, z + dz) && T(x + dx, z + dz) === 26);
  if (interior) put(x, 26, z, "iron_block");
}

const g = new Voxels([W, H, D]);
for (const [k, v] of out) {
  if (!v) continue;                       // air gap: left empty
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, v[0], v[1]);
}
g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_380531438.nbt");
console.log("saved", g.count(), "blocks, palette", g.palette.length - 1);
