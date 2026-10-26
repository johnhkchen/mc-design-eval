// 1205 7th St NW, Washington DC (Mount Vernon Square): a four-storey brick walk-up with limestone piers, a
// plinth, a stone cornice and a flat roof terrace. The lidar roof is 5-6 blocks above y0 with noise; it is
// smoothed to one flat tier at 6 (the 5s are corner dips and the 6s are the roof edge).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC59813.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC59813.nbt";
const cells = JSON.parse(readFileSync(CELLS, "utf8"));

const X = 7, Z = 4, TOP = 6;               // storeys are one block each: y1..y4, plinth y0, cornice y5
const g = new Voxels([X, TOP, Z]);
const ground = new Map(cells.map(([x, z, gr]) => [`${x},${z}`, gr]));

const BRICK = "bricks", STONE = "stone_bricks", CORNICE = "smooth_stone", ROOF = "polished_andesite";
const PANE_EW = { east: "true", west: "true", north: "false", south: "false" };
const PANE_NS = { north: "true", south: "true", east: "false", west: "false" };

// facade patterns: P pier (limestone), G glass pane, D entrance door (y1-2) with glass above it
const FRONT = ["P", "G", "D", "P", "G", "G", "P"];   // z = 0, the street front
const BACK = ["P", "G", "P", "G", "P", "G", "P"];    // z = 3

// fill from y0 up to each cell's ground (the foundation), then the plinth course
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, STONE);
  g.set(x, 0, z, STONE);
}

// a ring cell's role at height y: the storey walls, the piers and the openings
function wallAt(x, z, y) {
  if (z === 0) return FRONT[x];
  if (z === 3) return BACK[x];
  return "G";                                        // east and west sides: glass at z = 1..2
}

for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  const ring = x === 0 || x === 6 || z === 0 || z === 3;
  for (let y = 1; y < TOP - 1; y++) {
    if (!ring) {                                     // interior: a solid core behind the glass, lit where a window looks in
      g.set(x, y, z, BRICK);
      continue;
    }
    const role = wallAt(x, z, y);
    const sideWall = z !== 0 && z !== 3;
    if (role === "P") g.set(x, y, z, STONE);
    else if (role === "D") {
      if (y <= 2) {
        const half = y === 1 ? "lower" : "upper";
        g.set(x, y, z, "oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
      } else g.set(x, y, z, "glass_pane", PANE_EW);
    } else g.set(x, y, z, "glass_pane", sideWall ? PANE_NS : PANE_EW);
  }
  // the cornice on the ring, the roof terrace inside it
  g.set(x, TOP - 1, z, ring ? CORNICE : ROOF);
}

// warm lights behind glass, and roof plant on the terrace
g.set(1, 1, 1, "glowstone");
g.set(4, 3, 1, "shroomlight");
g.set(5, 1, 1, "glowstone");
g.set(1, 3, 2, "shroomlight");
g.set(2, TOP - 1, 1, "deepslate_bricks");
g.set(4, TOP - 1, 2, "deepslate_bricks");

const stats = g.save(OUT);
console.log("saved", OUT, stats);
