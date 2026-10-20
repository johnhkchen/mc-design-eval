import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw542608937.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw542608937.nbt";

const W = 35, H = 23, D = 9;
const FLOOR = 5;   // storey line between ground and upper floor
const ROOF = 11;   // roof slab, about 11 blocks above lowest ground
const PARAPET = 12;

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const g = new Voxels([W, H, D]);

// Perimeter test and facade classification
function faceOf(x, z) {
  if (!has(x, z - 1)) return "front";   // street side (north, z = 0 edge)
  if (!has(x, z + 1)) return "back";    // south side
  if (!has(x - 1, z) || !has(x + 1, z)) return "side";
  return null;                          // interior cell
}

// Returns a block id for a wall voxel, or null for air (glass-backed interior / entrance)
function wallBlock(face, u, y) {
  if (y === 0) return "stone_bricks";                  // base course
  if (y === 4) return "white_concrete";                // ground-floor header band
  if (y <= 3) {
    if (face === "front") {
      if (u >= 16 && u <= 18) return null;             // main entrance opening
      if (u % 4 === 0) return "smooth_quartz";         // shopfront pilasters
      return "light_blue_stained_glass";               // shop glazing
    }
    return "white_concrete";
  }
  // upper storey, y 6..10
  if (y === 6) return "smooth_quartz";                 // window sill
  if (y === 10) return "white_concrete";               // window head
  // y 7..9: glazed bays with mullions
  if (u % 3 === 0) return "white_concrete";
  return "cyan_stained_glass_pane";
}

for (const [x, z, gr] of cells) {
  const face = faceOf(x, z);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y <= ROOF; y++) {
    if (y === FLOOR || y === ROOF) {
      // floor slabs and roof deck on every footprint cell
      g.set(x, y, z, "light_gray_concrete");
      continue;
    }
    if (!face) continue;                               // interior: air gap
    const u = face === "side" ? z : x;
    const b = wallBlock(face, u, y);
    if (b) g.set(x, y, z, b);
  }

  if (face) {
    // Parapet and cornice cap around the perimeter
    g.set(x, PARAPET, z, "white_concrete");
    g.set(x, PARAPET + 1, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  } else if (x >= 12 && x <= 20 && z >= 2 && z <= 6) {
    // Roof plant box on the deck
    g.set(x, PARAPET, z, "light_gray_concrete");
    g.set(x, PARAPET + 1, z, "light_gray_concrete");
  }
}

// Warm light behind the front upper-storey glazing
for (const [x, z] of cells) {
  if (z === 1 && has(x, 0) && x % 9 === 4) {
    g.set(x, 7, z, "glowstone");
    g.set(x, 8, z, "glowstone");
  }
}

g.save(OUT);
