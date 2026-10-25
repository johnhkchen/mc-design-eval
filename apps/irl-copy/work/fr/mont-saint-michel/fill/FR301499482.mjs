import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499482";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 35, H = 31, D = 68;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, gr, roof] of cells) {
  map.set(key(x, z), { g: Math.round(gr), r: Math.round(roof) });
}
const has = (x, z) => map.has(key(x, z));
const get = (x, z) => map.get(key(x, z));

// Materials: light render-like walls, dark slate roof
const WALL = "smooth_sandstone";
const PLINTH = "sandstone";
const TRIM = "chiseled_sandstone";
const ROOF = "deepslate_tiles";
const ROOF_TOP = "deepslate_tile_slab";
const CAP = "smooth_sandstone_slab";
const FLOOR = "smooth_stone";
const FRAME = "dark_oak_planks";

const slabBottom = { type: "bottom", waterlogged: "false" };

// Street face: largest z of the footprint
let zFront = -1;
for (const k of map.keys()) {
  const z = Number(k.split(",")[1]);
  if (z > zFront) zFront = z;
}
// Entrance column: the front cell nearest the middle of the street face
let doorX = null;
{
  const xs = [];
  for (const k of map.keys()) {
    const [x, z] = k.split(",").map(Number);
    if (z === zFront) xs.push(x);
  }
  xs.sort((a, b) => a - b);
  doorX = xs[Math.floor(xs.length / 2)];
}

// Smoothed, tiered roof per cell: average lidar roof over a 5x5 neighbourhood,
// then quantise to 5-block storey tiers, never below two storeys above ground.
function roofTier(x, z, gr) {
  let sum = 0, n = 0;
  for (let dz = -2; dz <= 2; dz++) {
    for (let dx = -2; dx <= 2; dx++) {
      const c = get(x + dx, z + dz);
      if (c) { sum += c.r; n++; }
    }
  }
  const avg = n ? sum / n : get(x, z).r;
  const tier = Math.round(avg / 5) * 5;
  return Math.max(gr + 10, Math.min(H - 2, tier));
}

const perimeterOf = (x, z) =>
  !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);

// Pass 1: massing, foundation, walls, floors, roof
const tierOf = new Map();
for (const [k, { g: gr0 }] of map) {
  const [x, z] = k.split(",").map(Number);
  const gr = Math.min(gr0, H - 12);
  const t = roofTier(x, z, gr);
  tierOf.set(k, { gr, t });

  // Foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y <= gr; y++) g.set(x, y, z, y === gr ? PLINTH : PLINTH);

  const perim = perimeterOf(x, z);

  if (perim) {
    // Walls from ground to parapet line
    for (let y = gr + 1; y <= t - 1; y++) g.set(x, y, z, WALL);
    // Base course and storey string course
    g.set(x, gr + 1, z, TRIM);
    g.set(x, gr + 5, z, TRIM);
    // Parapet cap
    g.set(x, t, z, CAP, slabBottom);

    const alongX = !has(x, z - 1) || !has(x, z + 1);
    const u = alongX ? x : z;

    // Ground floor shopfront: glass bays between stone pilasters
    for (let y = gr + 2; y <= Math.min(gr + 3, t - 2); y++) {
      g.set(x, y, z, u % 3 === 2 ? TRIM : "glass_pane");
    }
    // Upper storey: single window bays
    for (let y = gr + 6; y <= Math.min(gr + 8, t - 2); y++) {
      g.set(x, y, z, u % 3 === 1 ? "glass_pane" : WALL);
    }

    // Entrance on the street face
    if (z === zFront) {
      if (Math.abs(x - doorX) <= 2) {
        // Dark-oak frame lintel across the entrance bay
        g.set(x, gr + 4, z, FRAME);
      }
      if (x === doorX) {
        g.set(x, gr + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
        g.set(x, gr + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
        g.set(x, gr + 3, z, FRAME);
      } else if (Math.abs(x - doorX) === 2) {
        // Pilasters flanking the door
        for (let y = gr + 1; y <= gr + 3; y++) g.set(x, y, z, FRAME);
      }
    }
  } else {
    // Hollow interior: floor slab per storey, ceiling deck under the roof
    g.set(x, gr + 5, z, FLOOR);
    g.set(x, t - 1, z, ROOF);
  }

  // Roof surface on interior cells (perimeter already has its parapet cap)
  if (!perim) g.set(x, t, z, ROOF_TOP, slabBottom);
}

// Pass 2: warm light behind some windows
for (const [k, { gr, t }] of tierOf) {
  const [x, z] = k.split(",").map(Number);
  if (!perimeterOf(x, z)) continue;

  const alongX = !has(x, z - 1) || !has(x, z + 1);
  const u = alongX ? x : z;

  let ix = x, iz = z;
  if (!has(x, z - 1)) iz = z + 1;
  else if (!has(x, z + 1)) iz = z - 1;
  else if (!has(x - 1, z)) ix = x + 1;
  else if (!has(x + 1, z)) ix = x - 1;
  if (!has(ix, iz)) continue;
  if (perimeterOf(ix, iz)) continue;

  if (u % 3 === 1 && (u + z) % 6 === 1 && gr + 7 <= t - 2) {
    g.set(ix, gr + 7, iz, "glowstone");
  }
  if (u % 3 === 2 && (u + z) % 9 === 0 && gr + 2 <= t - 2) {
    g.set(ix, gr + 2, iz, "shroomlight");
  }
}

g.save(`${DIR}/${ID}.nbt`);
