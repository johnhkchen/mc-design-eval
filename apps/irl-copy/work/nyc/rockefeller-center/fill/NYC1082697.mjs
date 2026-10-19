// 43 West 46 Street (NYC 1082697): a 1920 seven-storey commercial loft on a 5 x 26 lot, built from its lidar cells.
// Brick walls with limestone belt courses and cornice, a two-storey rear wing on the lower roof (z 0-5), shopfront and
// recessed door on the street face (z 25), glass in 2-block windows on a 3-block storey grid, interior air behind the
// glass with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${dir}/NYC1082697.cells.json`, "utf8"));
const ground = new Map(cells.map(([x, z, gr]) => [`${x},${z}`, gr]));

const W = 5, D = 26;
// The lidar roof, smoothed into three tiers along the lot: the rear wing at 6 (z 0-1) and 8 (z 2-5), the body at 22
// (the lidar's 20-22 with its edge cells at 22). The street face is z 25, so the body faces the street.
const roofTop = (z) => (z <= 1 ? 6 : z <= 5 ? 8 : 22);

const BRICK = "bricks", STONE = "calcite", BASE = "polished_granite", FOUNDATION = "stone_bricks";
const GLASS = "glass_pane", FLOOR = "smooth_stone", ROOF = "stone";

const g = new Voxels([W, 34, D]);

// The facade block at a perimeter cell's height y: cap, cornice, base course, belt courses, then the window rows
// (two blocks per storey, glass set between calcite mullions and brick piers on the three faces, every other block
// on the sides).
function facade(x, y, z, G, T, lines) {
  if (y >= T - 2) return STONE;                       // cornice and cap
  if (y === G) return BASE;                           // base course on the grade
  if (lines.includes(y)) return STONE;                // belt course
  const s = lines.filter((l) => l <= y).pop();
  if (y - s !== 1 && y - s !== 2) return BRICK;      // spandrel
  const faceZ = z === D - 1 || z === 0 || z === 6;   // street, rear and north faces
  if (!faceZ) return z % 2 === 0 ? GLASS : BRICK;    // side walls: a window every other block
  if (x === 0 || x === 4) return BRICK;              // piers
  if (x === 2) return STONE;                         // mullion
  return GLASS;
}

const paneAlongX = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const paneAlongZ = { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const G = ground.get(`${x},${z}`);
  const T = roofTop(z);
  const perim = x === 0 || x === 4 || z === 0 || z === D - 1 || z === 6;
  // storey lines: every 3 blocks from the grade, the top one leaving room for the cornice
  const lines = [];
  for (let y = G; y <= T - 3; y += 3) lines.push(y);
  for (let y = 0; y < T; y++) {
    if (y < G) { g.set(x, y, z, FOUNDATION); continue; }
    if (!perim) {                                     // interior: air, with a floor slab per storey and the roof
      if (lines.includes(y)) g.set(x, y, z, FLOOR);
      if (y === T - 1) g.set(x, y, z, ROOF);
      continue;
    }
    const b = facade(x, y, z, G, T, lines);
    if (b === GLASS) g.set(x, y, z, GLASS, z === D - 1 || z === 0 || z === 6 ? paneAlongX : paneAlongZ);
    else g.set(x, y, z, b);
  }
}

// Street entrance: a recessed-looking door in the shopfront with a dark marquee band above (the footprint is the
// only buildable ground, so the canopy is a band over the door rather than a projection).
const FG = ground.get("2,25");
const door = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
g.set(2, FG + 1, D - 1, "dark_oak_door", door("lower"));
g.set(2, FG + 2, D - 1, "dark_oak_door", door("upper"));
for (const x of [1, 2, 3]) g.set(x, FG + 3, D - 1, "dark_oak_slab", { type: "bottom", waterlogged: "false" });

// Warm light behind some glass (interior air at z 24) and a penthouse with mechanical boxes on the roof.
g.set(1, 24, FG + 1, "glowstone");
g.set(3, 24, 8, "shroomlight");
g.set(1, 24, 14, "glowstone");
g.set(3, 24, 17, "shroomlight");
g.set(3, 24, 2, "glowstone");
for (const [x, z] of [[1, 10], [2, 10], [1, 11], [2, 11]]) g.set(x, 22, z, "stone_bricks");
g.set(3, 22, 19, "stone_bricks");

const out = `${dir}/NYC1082697.nbt`;
const r = g.save(out);
console.log(`wrote ${out}: ${r.blocks} blocks, ${r.palette} palette entries`);
