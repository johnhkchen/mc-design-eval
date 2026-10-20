import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name, 8 x 20 footprint, roof ~11 blocks above lowest ground.
// Reading: a 1980s-90s reinforced-concrete Xinyi shophouse-office, two storeys
// of ~5 blocks with a ground-floor shopfront, white tiled facade, stone bands,
// and a parapet with a small roof plant pad.

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1038703664";
const cells = JSON.parse(readFileSync(`${SRC}/${ID}.cells.json`, "utf8"));

const W = 8, H = 23, D = 20;
const g = new Voxels([W, H, D]);

const ground = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, gr);
  if (gr < minG) minG = gr;
}
const has = (x, z) => ground.has(`${x},${z}`);

// Storey layout (absolute y, y 0 = lowest ground):
//  0 foundation, 1 plinth, 2-3 shopfront glazing, 4 lintel band,
//  5 storey line, 6 sill, 7-8 upper glazing, 9 head, 10 cornice / roof deck,
//  11 parapet and roof plant.
const ROOF_DECK = 10;
const PARAPET = 11;

const DOOR_X = 3;

function faceOf(x, z) {
  if (!has(x, z - 1)) return "front";   // north face (z = 0 side)
  if (!has(x, z + 1)) return "back";
  if (!has(x - 1, z)) return "west";
  if (!has(x + 1, z)) return "east";
  return null;
}

function isWindow(face, x, y, z) {
  if (y !== 2 && y !== 3 && y !== 7 && y !== 8) return false;
  if (face === "west" || face === "east") {
    return z >= 1 && z <= D - 2 && z % 3 !== 0;
  }
  // front / back: windows on x 1,2,4,5,6; pier at x = 0, 3, 7
  return x >= 1 && x <= W - 2 && x !== 3;
}

for (const [x, z, gr] of cells) {
  const gg = Math.min(gr, ROOF_DECK);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gg; y++) g.set(x, y, z, "stone_bricks");

  const shell = faceOf(x, z) !== null;
  const face = faceOf(x, z);

  // Floor slabs: storey 2 floor at y=5 for interior cells, roof deck at y=10 everywhere.
  if (!shell && 5 >= gg) g.set(x, 5, z, "smooth_stone");
  if (ROOF_DECK >= gg) {
    g.set(x, ROOF_DECK, z, shell ? "smooth_stone" : "gray_concrete");
  }

  if (!shell) {
    // Roof plant pad on the deck, interior only.
    if (x >= 2 && x <= 3 && z >= 8 && z <= 9) {
      g.set(x, PARAPET, z, "light_gray_concrete");
    }
    continue;
  }

  // Parapet ring.
  g.set(x, PARAPET, z, "white_concrete");

  // Shell column, bottom to top.
  for (let y = gg; y <= ROOF_DECK; y++) {
    if (y === 0) continue;

    // Door on the front centre.
    if (face === "front" && x === DOOR_X && (y === 1 || y === 2)) {
      g.set(x, y, z, "dark_oak_door", {
        facing: "north",
        half: y === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    if (y === 1) { g.set(x, y, z, "polished_andesite"); continue; }
    if (y === 4 || y === 5 || y === 10) { g.set(x, y, z, "smooth_stone"); continue; }
    if (y === 6 || y === 9) { g.set(x, y, z, "white_concrete"); continue; }

    if (y === 2 || y === 3 || y === 7 || y === 8) {
      if (isWindow(face, x, y, z)) {
        g.set(x, y, z, "glass_pane");
      } else {
        g.set(x, y, z, "white_concrete");
      }
    }
  }
}

// Warm lights behind glass on the interior side of the west column (x = 1).
for (const [x, z, gr] of cells) {
  if (x !== 1 || z < 2 || z > D - 3 || z % 6 !== 2) continue;
  if (gr <= 2) g.set(x, 2, z, "glowstone");
  if (gr <= 7) g.set(x, 7, z, "glowstone");
}

g.save(`${SRC}/${ID}.nbt`);
