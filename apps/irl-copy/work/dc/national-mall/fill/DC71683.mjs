// DC71683: a 10 x 3 Federal-style limestone block on the Mall's flank. Lidar roof steps up from ~3 blocks at the west
// end to 7 at the east pavilion, so the massing is three flat tiers (low wing, middle block, east tower with a back
// setback), each standing on the one below. Front (z 0) and back (z 2) faces carry a granite base, quartz piers,
// glass bays and quartz string courses; the middle row is an air gap behind the glass with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC71683.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC71683.nbt";

// lidar roof per cell (y 0 is the lowest ground, so ground is 0 everywhere), smoothed into flat tiers: H[z][x] = height in blocks
const H = [[], [], []];
for (const [x, z, , roof] of cells) H[z][x] = roof;
const TIER = [
  [3, 3, 6, 5, 6, 6, 6, 6, 7, 7], // z0: front
  [3, 3, 6, 5, 6, 6, 6, 6, 7, 7], // z1: middle (interior air gap)
  [2, 2, 5, 5, 6, 6, 6, 6, 6, 6], // z2: back
];
const height = (x, z) => TIER[z][x] ?? H[z][x] ?? 0;

const isPier = (x) => x % 3 === 0;                        // quartz piers at x 0, 3, 6, 9
const isDoor = (x, y, z) => z === 0 && (x === 4 || x === 5) && (y === 1 || y === 2);
const isGlassRow = (y) => y === 1 || y === 2 || y === 4;  // ground storey and the storey above it
const GLASS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };

const g = new Voxels([10, 19, 3]);
const warm = new Set(["1,1,1", "7,1,1", "2,4,1", "8,4,1"]); // glowstone behind four windows

for (let z = 0; z < 3; z++) for (let x = 0; x < 10; x++) {
  const top = height(x, z) - 1;   // the top row is the cornice / roof
  for (let y = 0; y <= top; y++) {
    if (y === 0) { g.set(x, y, z, "polished_granite"); continue; }        // base course
    if (y === top) { g.set(x, y, z, "chiseled_quartz_block"); continue; } // cornice / roof deck
    if (y === 3 || y === 5) { g.set(x, y, z, "quartz_bricks"); continue; } // string courses = floor slabs across all three rows
    if (z === 1) {                                                          // middle row: air behind every glass bay
      const faceGlass = isGlassRow(y) && !isPier(x) && y < height(x, 0) - 1;
      if (faceGlass) { if (warm.has(`${x},${y},${z}`)) g.set(x, y, z, "glowstone"); continue; }
      g.set(x, y, z, "smooth_quartz"); continue;
    }
    if (isPier(x)) { g.set(x, y, z, "quartz_pillar", { axis: "y" }); continue; }
    if (isDoor(x, y, z)) {
      const half = y === 1 ? "lower" : "upper";
      const hinge = x === 4 ? "left" : "right";
      g.set(x, y, z, "dark_oak_door", { facing: "north", half, hinge, open: "false", powered: "false" });
      continue;
    }
    if (isGlassRow(y)) { g.set(x, y, z, "glass_pane", GLASS); continue; }
    g.set(x, y, z, "smooth_quartz");
  }
}

// roof equipment on the east tower: a lightning rod and a copper cap on the tallest tier
g.set(9, 7, 1, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
g.set(8, 7, 0, "copper_block");

const r = g.save(OUT);
console.log(`saved ${OUT}: ${r.blocks} blocks, ${r.palette} palette entries`);
