import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Footprint 6 x 17. Lowest ground y=0; roof slab at y=25 (5 storeys of 5 blocks),
// parapet to y=26, so the roof top sits about 27 blocks above the lowest ground.
// Era: late-1980s to 1990s Xinyi mid-rise commercial block. Cream/white concrete
// walls with light-grey concrete piers and storey lines, a stone-brick plinth,
// glass curtain-wall windows, and a ground-floor shopfront on the street (z=0) face.

const cells = JSON.parse(
  readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw594289333.cells.json", "utf8")
);

const W = 6, H = 39, D = 17;
const ROOF = 25;   // roof slab level (5 storeys x 5 blocks)
const PARAPET = 26;
const TOP = 27;    // highest placed block + 1

const g = new Voxels([W, H, D]);

const map = new Map();
for (const [x, z, gr] of cells) map.set(`${x},${z}`, gr);
const has = (x, z) => map.has(`${x},${z}`);

for (const [x, z, gr0] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const gr = Math.max(0, gr0);
  if (gr >= ROOF) continue;

  // Foundation: solid from 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Which faces are outward.
  const fN = !has(x, z - 1); // street face (z = 0 side)
  const fS = !has(x, z + 1);
  const fW = !has(x - 1, z);
  const fE = !has(x + 1, z);
  const exterior = fN || fS || fW || fE;
  const corner = (fN || fS) && (fW || fE);

  for (let y = gr; y < ROOF; y++) {
    // Storey lines (every 5 blocks), full floor slab across every cell.
    if (y % 5 === 0) {
      g.set(x, y, z, exterior ? "light_gray_concrete" : "white_concrete");
      if (!exterior) continue;
      // Plinth course sits at ground if it lands on a floor line.
    }
    if (!exterior) continue;

    // Base course at the cell's ground on exterior cells.
    if (y === gr) {
      g.set(x, y, z, "stone_bricks");
      continue;
    }
    if (y % 5 === 0) continue; // storey line already placed

    const level = y % 5;

    // Corner piers run full height.
    if (corner) {
      g.set(x, y, z, "light_gray_concrete");
      continue;
    }

    // Ground storey on the street face: shopfront with entrance.
    if (fN && y < 5) {
      if (level === 4 || y === 4) {
        g.set(x, y, z, "light_gray_concrete"); // lintel
      } else if (x === 2 && y === gr + 1) {
        g.set(x, y, z, "dark_oak_door", {
          facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
        });
      } else if (x === 2 && y === gr + 2) {
        g.set(x, y, z, "dark_oak_door", {
          facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
        });
      } else if (x === 0 || x === 5) {
        g.set(x, y, z, "light_gray_concrete");
      } else {
        g.set(x, y, z, "glass");
      }
      continue;
    }

    // Upper storeys: window bands with concrete spandrels and piers.
    if (level >= 1 && level <= 3) {
      const t = (fN || fS) ? x : z;
      const span = (fN || fS) ? W : D;
      const isEnd = t === 0 || t === span - 1;
      if (t % 3 === 0 || isEnd) {
        g.set(x, y, z, "light_gray_concrete"); // pier
      } else {
        g.set(x, y, z, "light_blue_stained_glass"); // window
      }
    } else {
      g.set(x, y, z, "white_concrete"); // spandrel
    }
  }

  // Warm light behind some street-face windows (interior air cell at z=1).
  if (fN) {
    for (let y = 6; y < ROOF; y += 5) {
      const lvl = y + 2;
      if (lvl < ROOF && (x === 2 || x === 4) && has(x, 1) && !has(x, 0) === false) {
        if (!(x === 2 && (y === 5 || y === 6))) {
          if (has(x, 1)) g.set(x, lvl, 1, "glowstone");
        }
      }
    }
  }

  // Roof slab and parapet.
  g.set(x, ROOF, z, "smooth_stone");
  if (exterior) {
    g.set(x, PARAPET, z, "light_gray_concrete");
  } else if (x >= 2 && x <= 3 && z >= 6 && z <= 7) {
    // Small rooftop mechanical unit on interior cells.
    g.set(x, PARAPET, z, "iron_block");
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw594289333.nbt");
