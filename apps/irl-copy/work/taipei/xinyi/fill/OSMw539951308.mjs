import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi-style commercial block: two storeys of shopfronts and
// window bays over a stone base, with red-tile bands, quartz pilasters,
// a parapet and a small roof bulkhead. Roof top sits at y 11.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw539951308";
const W = 23, H = 23, D = 19;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

// Storey lines (absolute): shopfront y<=4, floor band y=5, upper windows 6..8,
// spandrel y=9, roof deck y=10, parapet 10..11.
const BAND_Y = 5, SPANDREL_Y = 9, ROOF_Y = 10, TOP_Y = 11;

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const NAME = { N: "north", S: "south", W: "west", E: "east" };
const GLASS = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };

// Footprint centroid for the roof bulkhead
let sx = 0, sz = 0;
for (const [x, z] of cells) { sx += x; sz += z; }
const cx = sx / cells.length, cz = sz / cells.length;

// Pick the entrance: on the north (min z) face, median x
const northCells = cells
  .filter(([x, z]) => !has(x, z - 1))
  .sort((a, b) => a[1] - b[1] || a[0] - b[0]);
let entrance = null;
if (northCells.length) entrance = northCells[Math.floor(northCells.length / 2)];
const entKey = entrance ? `${entrance[0]},${entrance[1]}` : null;

for (const [x, z, gr] of cells) {
  // Foundation and base course
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");
  g.set(x, gr, z, "stone_bricks");

  const missing = Object.keys(DIRS).filter((k) => {
    const [dx, dz] = DIRS[k];
    return !has(x + dx, z + dz);
  });
  const perim = missing.length > 0;

  // Interior floor slab for storey 2, and roof deck
  if (!perim) {
    if (gr < BAND_Y) g.set(x, BAND_Y, z, "smooth_quartz");
    if (gr < ROOF_Y) g.set(x, ROOF_Y, z, "smooth_stone");
    continue_bulkhead: {
      if (Math.abs(x - cx) <= 1 && Math.abs(z - cz) <= 1 && gr < ROOF_Y) {
        g.set(x, TOP_Y, z, "light_gray_concrete");
      }
    }
    // Interior lights: a shroomlight on the upper floor slab
    if ((x + z) % 5 === 0 && gr < BAND_Y) g.set(x, BAND_Y + 1, z, "shroomlight");
    continue;
  }

  // Perimeter cell
  const corner = missing.length >= 2;
  const onNS = missing.some((k) => k === "N" || k === "S");
  const t = onNS ? x : z;
  const pilaster = corner || t % 3 === 0;

  // Walls from just above the base course up to the spandrel
  for (let y = Math.max(gr + 1, 1); y <= SPANDREL_Y; y++) {
    if (y === BAND_Y) {
      g.set(x, y, z, "red_terracotta");
    } else if (y === SPANDREL_Y) {
      g.set(x, y, z, "white_terracotta");
    } else if (pilaster) {
      g.set(x, y, z, "quartz_pillar", { axis: "y" });
    } else {
      g.set(x, y, z, "glass_pane", GLASS);
    }
  }

  // Parapet with red cap
  if (gr < ROOF_Y) {
    g.set(x, ROOF_Y, z, "white_terracotta");
    g.set(x, TOP_Y, z, "red_terracotta");
  }

  // Warm light standing on the interior floor behind a window
  const k = missing[0];
  const [dx, dz] = DIRS[k];
  const ix = x - dx, iz = z - dz;
  if (has(ix, iz) && !pilaster && (x + z) % 4 === 1 && entKey !== `${x},${z}`) {
    if (gr + 1 <= 4) g.set(ix, gr + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
  if (has(ix, iz) && !pilaster && (x + z) % 4 === 3) {
    g.set(ix, BAND_Y + 1, iz, "shroomlight");
  }
}

// Entrance door, transom and a small canopy on posts
if (entrance) {
  const [ex, ez, egr] = entrance;
  const face = "N";
  g.set(ex, egr + 1, ez, "dark_oak_door", { facing: NAME[face], half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(ex, egr + 2, ez, "dark_oak_door", { facing: NAME[face], half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(ex, egr + 3, ez, "glass_pane", GLASS);

  const oz = ez - 1;
  if (oz >= 0) {
    for (const ox of [ex - 1, ex + 1]) {
      if (ox < 0 || ox >= W) continue;
      for (let y = egr + 1; y <= 3; y++) g.set(ox, y, oz, "quartz_pillar", { axis: "y" });
    }
    for (let ox = ex - 1; ox <= ex + 1; ox++) {
      if (ox < 0 || ox >= W) continue;
      g.set(ox, 4, oz, "red_terracotta");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
