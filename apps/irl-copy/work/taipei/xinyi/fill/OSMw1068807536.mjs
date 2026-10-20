import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1068807536";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 38, H = 23, D = 20;
const ROOF_TOP = 10;   // roof deck / cornice block row; total height about 11 blocks
const FLOOR = 5;       // storey line between the two storeys (about 5 blocks each)

// Materials: a low-rise 1990s-era Taipei commercial block with white tiled
// concrete, quartz pilasters, blue-tinted glazing and a granite base.
const WALL = "white_concrete";
const TRIM = "smooth_quartz";
const BAND = "light_gray_concrete";
const BASE = "polished_granite";
const GLASS = "light_blue_stained_glass_pane";
const SHOP = "glass";
const FOUND = "stone_bricks";
const SLAB = "smooth_stone";
const EQUIP = "iron_block";

const g = new Voxels([W, H, D]);

// Footprint lookup and per-cell ground heights (clamped to the building envelope)
const has = new Set();
const ground = new Map();
for (const [x, z, gr] of cells) {
  const k = `${x},${z}`;
  has.add(k);
  ground.set(k, Math.max(0, Math.min(ROOF_TOP, Math.round(gr))));
}
const isIn = (x, z) => has.has(`${x},${z}`);

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);

  // Foundation: solid from y 0 up to this cell's ground, so nothing floats on a slope
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  const edgeN = !isIn(x, z - 1);
  const edgeS = !isIn(x, z + 1);
  const edgeW = !isIn(x - 1, z);
  const edgeE = !isIn(x + 1, z);
  const boundary = edgeN || edgeS || edgeW || edgeE;
  const front = edgeS;                       // south edge is the street facade
  const i = front ? x : (edgeW || edgeE ? z : x);
  const entrance = front && i >= 16 && i <= 21;

  // Inward neighbour, used for warm lights behind the glass
  let ix = x, iz = z;
  if (edgeS) iz = z - 1;
  else if (edgeN) iz = z + 1;
  else if (edgeW) ix = x + 1;
  else if (edgeE) ix = x - 1;
  const inwardOK = boundary && isIn(ix, iz);

  if (!boundary) {
    // Interior: floor slab at the storey line, roof deck at the top, air elsewhere
    if (FLOOR >= gr) g.set(x, FLOOR, z, SLAB);
    if (ROOF_TOP >= gr) g.set(x, ROOF_TOP, z, BAND);
    continue;
  }

  // Facade shell: one block thick, from this cell's ground up to the roof
  for (let y = gr; y <= ROOF_TOP; y++) {
    if (y === ROOF_TOP) { g.set(x, y, z, BAND); continue; }   // cornice / parapet cap
    if (y === FLOOR || y === 4) { g.set(x, y, z, BAND); continue; } // storey and canopy lines

    if (y < 4) {
      // Ground storey: shopfronts (front) or glazed bays (sides/back)
      if (entrance) continue;                                 // open entrance bay
      if (i % 4 === 0) { g.set(x, y, z, TRIM); continue; }    // pilasters
      if (y === gr) { g.set(x, y, z, BASE); continue; }       // base course
      if (front) g.set(x, y, z, SHOP);
      else g.set(x, y, z, y <= 3 ? GLASS : WALL);
      if (front && y === 2 && i % 8 === 2 && inwardOK) g.set(ix, y, iz, "glowstone");
      continue;
    }

    // Upper storey (y 6..9): pilaster columns with window rows between them
    if (i % 3 === 0) { g.set(x, y, z, TRIM); continue; }
    if (y === 6 || y === 9) { g.set(x, y, z, WALL); continue; } // sill and head rows
    g.set(x, y, z, GLASS);
    if (y === 7 && i % 9 === 4 && inwardOK) g.set(ix, y, iz, "glowstone");
  }
}

// Rooftop plant: a small mechanical penthouse block on the upper deck
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const boundary = !isIn(x - 1, z) || !isIn(x + 1, z) || !isIn(x, z - 1) || !isIn(x, z + 1);
  if (boundary) continue;
  if (x >= 6 && x <= 9 && z >= 6 && z <= 8 && ROOF_TOP + 1 < H) {
    g.set(x, ROOF_TOP + 1, z, BAND);
    if (x === 7 || x === 8) g.set(x, ROOF_TOP + 2, z, EQUIP);
  }
}

g.save(`${DIR}/${ID}.nbt`);
