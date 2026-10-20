import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541457989.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541457989.nbt";

const cells = JSON.parse(readFileSync(SRC, "utf8"));
const W = 23, H = 23, D = 13;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

// Common datum: lowest ground under the footprint. Storey lines and roof are
// shared across the footprint so the roof stays level; the downhill side
// simply shows more wall below.
const base = Math.min(...cells.map(c => c[2]));
const FLOOR_1 = base + 5;      // first floor line / storey band
const FLOOR_2 = base + 10;     // cornice / roof deck level
const PARAPET = base + 11;     // parapet top, ~11 above lowest ground

const WALL = "white_concrete";
const BAND = "light_gray_concrete";
const BASE_COURSE = "smooth_stone";
const FOUND = "stone_bricks";
const FRAME = "white_concrete";
const SHOP_GLASS = "glass";
const WIN_GLASS = "light_blue_stained_glass";
const LIGHT = "glowstone";

const DIRNAME = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

// Pre-compute the street (north-facing, min z) frontage for the entrance.
const frontCells = cells.filter(([x, z, gr]) => !has(x, z - 1));
let entranceKey = null;
if (frontCells.length) {
  const ts = frontCells.map(([x]) => x).sort((a, b) => a - b);
  const midT = ts[Math.floor(ts.length / 2)];
  entranceKey = `${midT},${Math.min(...frontCells.map(c => c[1]))}`;
}

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  // Outward normals where the neighbour is outside the footprint.
  const dirs = [];
  if (!has(x + 1, z)) dirs.push([1, 0]);
  if (!has(x - 1, z)) dirs.push([-1, 0]);
  if (!has(x, z + 1)) dirs.push([0, 1]);
  if (!has(x, z - 1)) dirs.push([0, -1]);

  const top = Math.max(FLOOR_2, gr);

  if (dirs.length) {
    // Perimeter shell: from this cell's ground up to the cornice.
    for (let y = gr; y <= top; y++) {
      let m = WALL;
      if (y === gr) m = BASE_COURSE;
      else if (y === FLOOR_1 || y === FLOOR_2) m = BAND;
      g.set(x, y, z, m);
    }

    // Parapet on the roof edge.
    if (gr <= FLOOR_2) g.set(x, PARAPET, z, WALL);

    // Facade openings on the primary outward face.
    const [dx, dz] = dirs[0];
    const t = dz !== 0 ? x : z;
    const pillar = t % 3 === 0;
    const isEntrance = `${x},${z}` === entranceKey;
    const faceName = DIRNAME[`${dx},${dz}`];

    // Shopfront ground floor.
    for (let y = Math.max(gr + 1, base + 1); y <= base + 4; y++) {
      if (y > FLOOR_1 - 1) break;
      if (!pillar) g.set(x, y, z, SHOP_GLASS);
    }

    // Upper storey windows.
    for (const y of [base + 6, base + 7, base + 8, base + 9]) {
      if (y <= gr) continue;
      if (!pillar) g.set(x, y, z, WIN_GLASS);
    }

    // Entrance door with a glazed transom on the street face.
    if (isEntrance) {
      const ey = gr + 1;
      g.set(x, ey, z, "oak_door", { facing: faceName, half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(x, ey + 1, z, "oak_door", { facing: faceName, half: "upper", hinge: "left", open: "false", powered: "false" });
      g.set(x, ey + 2, z, FRAME);
    }

    // Warm light behind some upper windows (interior air gap cell).
    const inX = x - dx, inZ = z - dz;
    if (!pillar && t % 6 === 1 && has(inX, inZ)) {
      g.set(inX, base + 7, inZ, LIGHT);
    }
  } else {
    // Interior: floor slab at the first storey line and the roof deck.
    if (gr <= FLOOR_1) g.set(x, FLOOR_1, z, BAND);
    if (gr <= FLOOR_2) g.set(x, FLOOR_2, z, BAND);
    // Roof equipment: a few condenser units.
    if (gr <= FLOOR_2 && (x * 7 + z * 3) % 11 === 0) {
      g.set(x, PARAPET, z, "iron_block");
    }
  }
}

// Roof access bulkhead on one interior roof cell near the middle of the deck.
const interiorRoof = cells
  .filter(([x, z, gr]) => gr <= FLOOR_2 && ![[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dz]) => !has(x+dx, z+dz)))
  .sort((a, b) => (Math.abs(a[0] - 11) + Math.abs(a[1] - 6)) - (Math.abs(b[0] - 11) + Math.abs(b[1] - 6)));
if (interiorRoof.length) {
  const [bx, bz] = interiorRoof[0];
  g.set(bx, PARAPET, bz, FRAME);
  g.set(bx, PARAPET + 1, bz, FRAME);
  g.set(bx, PARAPET + 2, bz, BAND);
}

g.save(OUT);
