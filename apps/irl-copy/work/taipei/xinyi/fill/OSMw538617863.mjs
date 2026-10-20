import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538617863";
const W = 9, H = 23, D = 18;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup. Ground per cell, clamped so the roof and roof plant stay inside H.
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.min(gr, 11));
const has = (x, z) => ground.has(key(x, z));

// Door: on the lowest-z (north) edge, nearest to the middle column.
let doorX = null;
let minZ = Infinity;
for (const [x, z] of cells) minZ = Math.min(minZ, z);
for (const [x, z] of cells) {
  if (z !== minZ) continue;
  if (doorX === null || Math.abs(x - 4) < Math.abs(doorX - 4)) doorX = x;
}
const doorZ = minZ;

for (const [x, z] of cells) {
  const gr = ground.get(key(x, z));
  const xFace = !has(x - 1, z) || !has(x + 1, z);   // exposed on a side running along z
  const zFace = !has(x, z - 1) || !has(x, z + 1);   // exposed on a side running along x
  const perim = xFace || zFace;
  const corner = xFace && zFace;
  // Pillar positions give the window grid: every third bay, plus corners.
  const pillar = corner || (xFace ? z % 3 === 0 : x % 3 === 0);
  const isDoor = perim && z === doorZ && x === doorX;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // k = y - gr: 0 base course, 1..4 shopfront, 5 storey band, 6..9 upper floor, 10 cornice/roof deck.
  g.set(x, gr, z, perim ? "stone_bricks" : "smooth_stone");     // base course / ground slab

  // Ground floor storey (k 1..4)
  if (isDoor) {
    g.set(x, gr + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, gr + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    g.set(x, gr + 3, z, "glass_pane");                             // transom
  } else if (perim) {
    if (pillar) {
      for (let k = 1; k <= 3; k++) g.set(x, gr + k, z, "gray_concrete");
    } else {
      for (let k = 1; k <= 3; k++) g.set(x, gr + k, z, "glass_pane");
    }
    g.set(x, gr + 4, z, "polished_andesite");                      // shop fascia
  }
  if (!perim && (x * 5 + z * 3) % 4 === 0) {
    g.set(x, gr + 2, z, "shroomlight");                            // warm shop light behind glass
  }

  // Storey line between floors
  g.set(x, gr + 5, z, perim ? "smooth_quartz" : "smooth_stone");

  // Upper floor storey (k 6..9)
  if (perim) {
    for (let k = 6; k <= 8; k++) {
      g.set(x, gr + k, z, pillar ? "white_concrete" : "glass_pane");
    }
    g.set(x, gr + 9, z, "white_concrete");                         // window head / lintel
  }
  if (!perim && (x * 3 + z * 5) % 4 === 1) {
    g.set(x, gr + 7, z, "shroomlight");                            // warm upper-floor light
  }

  // Cornice / parapet and roof deck (k 10)
  g.set(x, gr + 10, z, perim ? "smooth_quartz" : "light_gray_concrete");

  // Roof plant on the deck: a small pair of boxes
  if (!perim && x === 3 && (z === 6 || z === 7) && gr + 11 < H) {
    g.set(x, gr + 11, z, "stone_bricks");
  }
}

g.save(`${DIR}/${ID}.nbt`);
