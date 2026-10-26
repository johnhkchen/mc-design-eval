import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1300 6th St NW: a 1920s-30s red-brick walk-up (Shaw), four storeys of brick over a stone base, with a
// stone-capped parapet and a smaller mechanical penthouse on the lidar's 6-block interior roof.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC71665.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..5, z 0..8

const g = new Voxels([6, 18, 9]);

// full glass blocks: a one-block pane reads as a hole from the elevations, and it lets the warm interior show through
const WALL = "bricks", BASE = "stone_bricks", GLASS = "glass", ROOF = "smooth_stone";
const DOOR = { facing: "north", hinge: "left", open: "false", powered: "false" };
const have = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));

// Each cell's own shell: the foundation to its ground, then the walls, the parapet, and the penthouse where the lidar stands at 6.
for (const [x, z, ground, roof] of cells) {
  const edge = x === 0 || x === 5 || z === 0 || z === 8;
  for (let y = 0; y <= Math.max(ground, 0); y++) g.set(x, y, z, BASE);       // foundation / on-grade slab
  if (!edge) {
    g.set(x, 5, z, ROOF);                                                     // flat roof deck over the interior
    continue;
  }

  // The walls, storey by storey: the base course (y 1) is stone, the storeys above are brick with glass bays.
  const front = z === 0 || z === 8;
  const bayOn = front ? (x === 1 || x === 4) : (z === 2 || z === 4 || z === 6);
  const corner = (x === 0 || x === 5) && (z === 0 || z === 8);
  for (let y = 1; y <= 4; y++) {
    let block = y === 1 ? BASE : WALL;
    if (!corner && bayOn) block = GLASS;
    if (front && y <= 2 && x === 2 && z === 0) block = null;                      // the entrance (rows 1 and 2)
    if (block) g.set(x, y, z, block);
  }
  // The entrance: a dark oak door on the street face, two blocks tall.
  if (z === 0 && x === 2) {
    g.set(x, 1, z, "dark_oak_door", { ...DOOR, half: "lower" });
    g.set(x, 2, z, "dark_oak_door", { ...DOOR, half: "upper" });
  }
  // Cornice: a slab course on the walls; the roof deck stays inside it.
  g.set(x, 5, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// Warm light behind some glass: glowstone against the inside of the bays (the interior stays air behind the rest).
for (const [x, y, z] of [[1, 2, 1], [4, 3, 1], [1, 3, 2], [4, 4, 4], [1, 4, 6], [4, 2, 7]]) g.set(x, y, z, "glowstone");
// Penthouse parapet: a brick ring at y 6 on the 4 x 5 mechanical box, its interior capped with a deck.
for (let x = 1; x <= 4; x++) for (let z = 2; z <= 6; z++) {
  if (have.get(`${x},${z}`) === undefined) continue;
  const ring = x === 1 || x === 4 || z === 2 || z === 6;
  g.set(x, 6, z, ring ? WALL : ROOF);
  if (ring && z === 2 && x === 2) g.set(x, 6, z, GLASS);                       // a window in the penthouse's street face
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC71665.nbt");
