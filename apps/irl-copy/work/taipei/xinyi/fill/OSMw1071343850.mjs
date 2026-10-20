import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343850";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 38, H = 23, D = 53;
const ground = new Map();
let maxG = 0;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, gr);
  if (gr > maxG) maxG = gr;
}
// Level roof, about 11 blocks above the lowest ground; lift it only if the high ground demands it.
const R = Math.max(11, maxG + 7);

const g = new Voxels([W, H, D]);
const has = (x, z) => ground.has(`${x},${z}`);

const GLASS = "light_blue_stained_glass_pane";
const PIER = "white_concrete";
const DOORX = 18; // entrance column on the north (min-z) facade

for (const [x, z, gr] of cells) {
  const nN = has(x, z - 1), nS = has(x, z + 1), nW = has(x - 1, z), nE = has(x + 1, z);
  const northEdge = !nN, southEdge = !nS, westEdge = !nW, eastEdge = !nE;
  const edge = northEdge || southEdge || westEdge || eastEdge;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Along-wall coordinate for the window rhythm.
  const alongZ = northEdge || southEdge;
  const alongX = westEdge || eastEdge;
  const t = alongZ && alongX ? x + z : alongZ ? x : z;

  for (let y = gr; y <= R; y++) {
    const rel = y - gr;

    if (y === R) {
      if (edge) g.set(x, y, z, "white_concrete"); // parapet
      continue;
    }
    if (y === R - 1) {
      g.set(x, y, z, edge ? "stone_bricks" : "smooth_stone"); // cornice / roof deck
      continue;
    }

    if (!edge) {
      // Interior: floor slabs only, air between them (no interiors).
      if (rel === 0 || rel === 5) g.set(x, y, z, "smooth_stone");
      continue;
    }

    // Edge (facade) cells.
    if (rel === 0) { g.set(x, y, z, "polished_andesite"); continue; } // base course
    if (rel === 5) { g.set(x, y, z, "light_gray_concrete"); continue; } // storey line
    if (rel === 4 || rel === 9) { g.set(x, y, z, PIER); continue; } // lintels

    if ((rel >= 1 && rel <= 3) || (rel >= 6 && rel <= 8)) {
      // Entrance on the north facade.
      if (northEdge && x === DOORX && rel === 1) {
        g.set(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (northEdge && x === DOORX && rel === 2) {
        g.set(x, y, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (northEdge && x === DOORX && rel === 3) {
        g.set(x, y, z, "light_gray_concrete"); // door canopy band
        continue;
      }
      if (t % 3 === 0) {
        g.set(x, y, z, PIER);
      } else if ((rel === 2 || rel === 7) && (x * 31 + z * 17 + y * 7) % 6 === 0) {
        g.set(x, y, z, "glowstone"); // warm light behind the glass
      } else {
        g.set(x, y, z, GLASS);
      }
    }
  }
}

// Roof mechanical penthouse on the interior core.
if (R + 1 < H) {
  for (const [x, z] of cells.map(([a, b]) => [a, b])) {
    const inCore = x >= 10 && x <= 27 && z >= 16 && z <= 36;
    const isEdge = !(has(x, z - 1) && has(x, z + 1) && has(x - 1, z) && has(x + 1, z));
    if (inCore && !isEdge) {
      g.set(x, R, z, "light_gray_concrete");
      g.set(x, R + 1, z, "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
