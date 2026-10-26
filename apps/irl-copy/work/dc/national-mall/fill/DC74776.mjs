import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1500 9th St NW: a Romanesque-revival brick church (c. 1890-1910) with calcite trim, a stone base,
// a deepslate roof deck and two corner towers on the east end. The lidar roof is smoothed into flat tiers.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC74776.cells.json", "utf8"));

const W = 15, H = 21, D = 13;
const ground = new Map(cells.map(([x, z, gr]) => [`${x},${z}`, gr]));
const inFp = (x, z) => ground.has(`${x},${z}`);
const nbrs = (x, z) => [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]];

// Roof tiers (blocks above y0): nave 6, flank steps 7-8, NE and SE towers 9.
const tier = (x, z) => {
  if (x >= 13 && z <= 1) return 9;
  if (x === 12 && z <= 1) return 8;
  if (x === 12 && z === 2) return 7;
  if (x >= 13 && z === 2) return 8;
  if (x >= 13 && z >= 11) return 9;
  if (x === 12 && z >= 11) return 7;
  if (x === 13 && z >= 3 && z <= 10) return 7;
  if (x === 14 && z >= 3 && z <= 10) return 8;
  if (x <= 3 && z >= 9) return 7;
  if (x === 0 && z >= 6 && z <= 8) return 7;
  return 6;
};

// Outer skin: a footprint edge, or a side that stands above a lower neighbour's roof.
const edge = (x, z) => nbrs(x, z).some(([a, b]) => !inFp(a, b));
const shell = (x, z, y) => edge(x, z) || nbrs(x, z).some(([a, b]) => inFp(a, b) && tier(a, b) <= y);

const g = new Voxels([W, H, D]);
const paneX = { north: "true", south: "true", east: "false", west: "false" };   // panes on the x-faces
const paneZ = { north: "false", south: "false", east: "true", west: "true" };   // panes on the z-faces

for (const [x, z] of cells) {
  const r = tier(x, z), outer = edge(x, z);
  const xFace = x === 0 || x === 14;
  const corner = xFace && (z === 0 || z === 12);
  const bay = (xFace ? z : x) % 3 === 1;                 // one window per three cells, piers between

  for (let y = 0; y < r - 1; y++) {
    if (!shell(x, z, y)) {                                // interior: air, with a floor slab at each storey line
      if (y % 3 === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (y === 0) { g.set(x, y, z, "stone_bricks"); continue; }                      // base course
    if (r >= 8 && y === r - 2) { g.set(x, y, z, "calcite"); continue; }             // cornice
    if (y % 3 === 0) { g.set(x, y, z, "calcite"); continue; }                       // string course
    if ((y === 1 || y === 2 || y === 4 || y === 5) && bay && !corner) {             // glazing, air behind it
      g.set(x, y, z, "glass_pane", xFace ? paneX : paneZ);
      if ((y === 1 || y === 4) && (x * 7 + z * 3 + y) % 4 === 0) {                  // warm light behind some panes
        const inner = nbrs(x, z).find(([a, b]) => inFp(a, b) && !shell(a, b, y));
        if (inner) g.set(inner[0], y, inner[1], y === 1 ? "glowstone" : "shroomlight");
      }
      continue;
    }
    g.set(x, y, z, corner ? "calcite" : "bricks");                                  // piers and quoins
  }
  g.set(x, r - 1, z, "deepslate_tiles");                                             // roof deck
  if (r === 9 && outer) g.set(x, r, z, "stone_bricks");                              // tower parapet (solid, not posts)
}

// Entrance on the front (z = 0): a dark oak door under a stone canopy, calcite jambs, a glazed fanlight.
const door = { facing: "south", hinge: "left", open: "false", powered: "false" };
g.set(7, 1, 0, "dark_oak_door", { ...door, half: "lower" });
g.set(7, 2, 0, "dark_oak_door", { ...door, half: "upper" });
for (const y of [1, 2]) for (const x of [6, 8]) g.set(x, y, 0, "calcite");
for (let x = 5; x <= 9; x++) g.set(x, 3, 0, "stone_brick_slab", { type: "top" });
for (let x = 6; x <= 8; x++) g.set(x, 4, 0, "glass_pane", paneZ);

const { blocks, palette } = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC74776.nbt");
console.log(`DC74776: ${blocks} blocks, ${palette} palette entries`);
