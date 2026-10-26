import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC86611";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 3, H = 31, D = 16;
const g = new Voxels([W, H, D]);

const cellMap = new Map();
for (const [x, z, G, R] of cells) cellMap.set(`${x},${z}`, { G, R });
const has = (x, z) => cellMap.has(`${x},${z}`);
const isBoundary = (x, z) =>
  !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Smooth the lidar: one storey count for the whole block from the median
// height above ground, so noise does not produce stair-stepped ledges.
const heights = cells.map(([, , G, R]) => R - G).sort((a, b) => a - b);
const medianAbove = heights[Math.floor(heights.length / 2)];
const STOREYS = Math.max(3, Math.min(6, Math.round(medianAbove / 3)));

// Materials: 1980s K Street office, pale precast spandrels, tinted glass
// bands, stone base, dark cornice.
const WALL = "smooth_quartz";
const PIER = "quartz_pillar";
const SPAND = "smooth_quartz";
const FLOOR = "smooth_stone";
const BASE = "stone_bricks";
const FOUND = "stone_bricks";
const GLASS = "light_blue_stained_glass_pane";
const ROOFM = "smooth_stone";
const CAP = "stone_brick_slab";
const EQUIP = "light_gray_concrete";

const put = (x, y, z, id, props) => {
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Entrance cell and canopy position
const entryZ = 7;

for (const [x, z, G] of cells) {
  const bnd = isBoundary(x, z);

  // Crown setback: the north-most third steps down one storey (a clean tier)
  let n = STOREYS;
  if (z >= 12) n = Math.max(2, n - 1);
  const top = Math.min(G + 3 * n, 27);

  // Foundation
  for (let y = 0; y < G; y++) put(x, y, z, FOUND);

  // Ground slab / base course
  put(x, G, z, bnd ? BASE : FLOOR);

  for (let y = G + 1; y < top; y++) {
    const rel = y - G;
    if (rel % 3 === 0) {
      put(x, y, z, bnd ? SPAND : FLOOR);
    } else if (bnd) {
      // Mullion pattern: solid pier cells at the ends and every fourth cell
      const pier = z === 0 || z === D - 1 || z % 4 === 0;
      put(x, y, z, pier ? PIER : GLASS);
    }
  }

  // Roof slab
  put(x, top, z, ROOFM);

  // Parapet cap on the perimeter
  if (bnd) put(x, top + 1, z, CAP, { type: "bottom", waterlogged: "false" });

  // Rooftop plant: a single mechanical box on the interior cells, no stray blocks
  if (!bnd && z >= 4 && z <= 6) {
    put(x, top + 1, z, EQUIP);
    put(x, top + 2, z, EQUIP);
  }
}

// Warm light behind some glass on the street face, one pane in five
for (const [x, z, G] of cells) {
  if (x !== 0 || !isBoundary(x, z) || !has(1, z)) continue;
  const n = z >= 12 ? Math.max(2, STOREYS - 1) : STOREYS;
  const top = Math.min(G + 3 * n, 27);
  for (let y = G + 1; y < top; y++) {
    const rel = y - G;
    if (rel % 3 === 0) continue;
    if ((z + rel) % 5 === 0 && z % 4 !== 0 && z !== 0 && z !== D - 1) {
      put(1, y, z, "glowstone");
    }
  }
}

// Entrance on the street face (x=0): recessed door, canopy, and a stone step
if (has(0, entryZ)) {
  const G = cellMap.get(`0,${entryZ}`).G;
  put(0, G + 1, entryZ, "dark_oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(0, G + 2, entryZ, "dark_oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Canopy projects over the door at the spandrel line, supported by the wall
  for (const dz of [-1, 0, 1]) {
    if (has(0, entryZ + dz)) {
      put(0, G + 3, entryZ + dz, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
    }
  }
  // Dark polished step in front of the entrance
  put(0, G, entryZ, "polished_andesite");
}

g.save(`${DIR}/${ID}.nbt`);
