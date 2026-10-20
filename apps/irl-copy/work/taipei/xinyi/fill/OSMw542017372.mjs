import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542017372";
const W = 11, H = 23, D = 19;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const fp = new Map();
for (const [x, z, gr] of cells) fp.set(key(x, z), gr);

// Outward faces. "axis" tells which coordinate runs along the wall.
const DIRS = [
  { name: "north", dx: 0, dz: -1, axis: "x" },
  { name: "south", dx: 0, dz: 1, axis: "x" },
  { name: "west", dx: -1, dz: 0, axis: "z" },
  { name: "east", dx: 1, dz: 0, axis: "z" },
];

function faceOf(x, z) {
  for (const d of DIRS) {
    if (!fp.has(key(x + d.dx, z + d.dz))) return d;
  }
  return null;
}

// Levels (absolute, y 0 = lowest ground):
//  foundation: below each cell's ground, stone bricks
//  0..1  base course (polished andesite)
//  2..4  ground storey shopfront (glass, white concrete piers, lintel at 4)
//  5..9  upper storey: sill/floor band at 5 and 9, piers and glass panes at 6..8
//  10    parapet (edge) / roof deck (interior), top surface at 11

for (const [x, z, gr] of cells) {
  // Foundation: fill solid from 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const f = faceOf(x, z);

  if (!f) {
    // Interior cell: floor slab at storey line, roof deck at the top
    if (gr <= 5) g.set(x, 5, z, "smooth_stone");
    g.set(x, 10, z, "light_gray_concrete");
    continue;
  }

  const i = f.axis === "x" ? x : z;

  for (let y = gr; y <= 10; y++) {
    let id;
    if (y === 10) {
      id = "smooth_quartz";                       // parapet / cornice
    } else if (y <= 1) {
      id = "polished_andesite";                   // base course
    } else if (y <= 4) {
      if (i % 3 === 0 || y === 4) id = "white_concrete";  // piers and lintel
      else id = "light_blue_stained_glass";                // shopfront glass
    } else if (y === 5 || y === 9) {
      id = "smooth_quartz";                       // storey lines
    } else {
      // y 6..8: upper storey window grid
      if (i % 3 === 0) {
        id = "white_concrete";
      } else if (y === 7 && i % 3 === 1 && (i + (f.name === "north" || f.name === "south" ? 1 : 0)) % 4 === 0) {
        id = "glowstone";                         // warm light behind glass
      } else {
        id = "light_blue_stained_glass_pane";
      }
    }
    g.set(x, y, z, id);
  }

  // Entrance: centre bay of the south face, doors at ground level
  if (f.name === "south" && i === Math.floor(W / 2) && gr <= 3) {
    g.set(x, gr, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, gr + 1, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  }
}

// Roof equipment: a small mechanical plant block near the middle of the roof
for (let x = 4; x <= 6; x++) {
  for (let z = 8; z <= 10; z++) {
    if (fp.has(key(x, z))) g.set(x, 11, z, "smooth_stone");
  }
}
if (fp.has(key(5, 9))) {
  g.set(5, 12, 9, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
