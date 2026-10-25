import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499577";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 11, H = 22, D = 12;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map();
let xmin = Infinity, xmax = -Infinity, zmin = Infinity, zmax = -Infinity;
let gMax = 0;
const roofs = [];
for (const [x, z, gr, rf] of cells) {
  map.set(key(x, z), { g: gr, r: rf });
  xmin = Math.min(xmin, x); xmax = Math.max(xmax, x);
  zmin = Math.min(zmin, z); zmax = Math.max(zmax, z);
  gMax = Math.max(gMax, gr);
  roofs.push(rf);
}
roofs.sort((a, b) => a - b);
const med = roofs[Math.floor(roofs.length / 2)];

// Eave line: two storeys above the highest footprint ground, clamped to the build box.
let E = Math.max(gMax + 8, Math.min(med - 1, gMax + 10));
E = Math.min(E, 14);

const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};
const has = (x, z) => map.has(key(x, z));

// Roof: a gable ridge running along z, pitched at 1 block of rise per 2 columns
// (stairs on the slope, a slab cap on the ridge), so it reads as slate rather than a stepped pyramid.
const ridgeOffset = (x) => Math.min(x - xmin, xmax - x);
const roofRise = (x) => Math.floor(ridgeOffset(x) / 2) + (ridgeOffset(x) % 2 ? 0 : 0);
const roofTop = (x) => E + 1 + roofRise(x); // exclusive top of solid roof mass

const stairProps = (facing) => ({ facing, half: "bottom", shape: "straight", waterlogged: "false" });

const exteriorFaces = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
};

const doorX = xmin + Math.floor((xmax - xmin) / 2);
const midX = doorX;

// Pass 1: foundations, walls, pilasters, cornice, roof mass
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "cobblestone");

  // Plinth
  put(x, gr, z, "polished_granite");

  // Walls
  for (let y = gr + 1; y <= E - 2; y++) put(x, y, z, "granite");

  // Storey string course
  if (gr + 5 <= E - 2) put(x, gr + 5, z, "polished_granite");

  // Cornice
  put(x, E - 1, z, "polished_granite");

  // Corner pilasters: cells exposed on two sides
  const f = exteriorFaces(x, z);
  if (f.length >= 2) {
    for (let y = gr + 1; y <= E - 2; y++) put(x, y, z, "polished_granite");
  }

  // Roof infill under the slope
  const h = roofTop(x);
  for (let y = E; y <= h - 2; y++) put(x, y, z, "stone_bricks");

  // Roof surface
  const dl = x - xmin, dr = xmax - x;
  const rise = roofRise(x);
  const surfaceY = h - 1;
  if (ridgeOffset(x) === Math.max(...[0].concat(
      Array.from({ length: W }, (_, i) => xmin + i).filter(xx => has(xx, z))
        .map(ridgeOffset)))) {
    put(x, surfaceY, z, "deepslate_tiles");
  } else if (dl < dr) {
    put(x, surfaceY, z, "deepslate_tile_stairs", stairProps("west"));
  } else if (dl > dr) {
    put(x, surfaceY, z, "deepslate_tile_stairs", stairProps("east"));
  } else {
    put(x, surfaceY, z, "deepslate_tiles");
  }
}

// Pass 2: windows with sills and lintels, then the entrance
for (const [x, z, gr] of cells) {
  const faces = exteriorFaces(x, z);
  if (faces.length !== 1) continue;
  const face = faces[0];
  const a = (face === "N" || face === "S") ? x - xmin : z - zmin;
  const aPos = (face === "N" || face === "S") ? x : z;

  // Entrance on the north face: framed porch with pillars and lintel
  if (face === "N" && x === midX) {
    const base = { facing: "north", hinge: "left", open: "false", powered: "false" };
    put(x, gr + 1, z, "dark_oak_door", { ...base, half: "lower" });
    put(x, gr + 2, z, "dark_oak_door", { ...base, half: "upper" });
    put(x, gr + 3, z, "polished_granite");
    continue;
  }
  if (face === "N" && Math.abs(x - midX) === 1) {
    // Porch pillars flanking the door
    for (let y = gr + 1; y <= gr + 3; y++) put(x, y, z, "polished_granite");
    continue;
  }

  if (a % 2 !== 1) continue;

  const warm = ((a + 1) % 3 === 0);
  // Storey 1 window: sill at gr+1, glass at gr+2..gr+3, lintel at gr+4
  if (gr + 4 <= E - 2) {
    put(x, gr + 1, z, "polished_granite");
    put(x, gr + 2, z, warm ? "glowstone" : "glass_pane");
    put(x, gr + 3, z, "glass_pane");
    put(x, gr + 4, z, "polished_granite");
  }
  // Storey 2 window: sill at gr+6, glass at gr+7..gr+8, lintel at gr+9
  if (gr + 9 <= E - 2) {
    put(x, gr + 6, z, "polished_granite");
    put(x, gr + 7, z, (!warm) ? "glowstone" : "glass_pane");
    put(x, gr + 8, z, "glass_pane");
    put(x, gr + 9, z, "polished_granite");
  }
}

// Attic gable window on the north and south ends
for (const [x, z] of cells) {
  if (x !== midX) continue;
  const h = roofTop(x);
  if (h - 2 < E + 3) continue;
  if (!has(x, z - 1) || !has(x, z + 1)) {
    put(x, E + 1, z, "polished_granite");
    put(x, E + 2, z, "glass_pane");
    put(x, E + 3, z, "glass_pane");
    put(x, E + 4, z, "polished_granite");
  }
}

// Chimney rising from the ridge
{
  const xc = midX;
  const zc = zmin + Math.floor((zmax - zmin) / 2);
  if (has(xc, zc)) {
    const top = Math.min(E + 8, H - 1);
    for (let y = E + 5; y <= top; y++) put(xc, y, zc, "stone_bricks");
    put(xc, top, zc, "stone_brick_slab", { type: "top", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
