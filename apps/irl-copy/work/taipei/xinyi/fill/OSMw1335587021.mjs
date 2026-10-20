import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: 2 x 26 footprint, roof about 3 blocks above the lowest ground.
// Read as a single-storey street-front pavilion/shophouse with a glazed street
// face (x=0), a rear wall (x=1) with an air gap behind the glass, and a
// plain concrete cornice. Era: late-20th-century Taipei commercial frontage.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1335587021.cells.json", "utf8"));

const W = 2, H = 15, D = 26;
const g = new Voxels([W, H, D]);

for (const [x, z, groundRaw] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const ground = Math.max(0, Math.min(groundRaw, H - 5));

  // Foundation fill up to this cell's ground.
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  // Base course / floor slab at ground level.
  g.set(x, ground, z, "polished_andesite");

  const b1 = ground + 1; // ground storey, lower wall
  const b2 = ground + 2; // ground storey, upper wall / transom band
  const top = ground + 3; // cornice / roof slab

  // Roof cornice on both columns.
  g.set(x, top, z, "smooth_stone");

  if (x === 0) {
    // Street-facing glazed frontage.
    if (z === 0 || z === D - 1) {
      g.set(x, b1, z, "white_concrete");
      g.set(x, b2, z, "white_concrete");
    } else if (z === 1) {
      // Entrance door on the street face.
      g.set(x, b1, z, "oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(x, b2, z, "oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
    } else if (z % 4 === 0) {
      // Mullions / frames.
      g.set(x, b1, z, "dark_oak_planks");
      g.set(x, b2, z, "dark_oak_planks");
    } else {
      // Shopfront glass and upper glazing.
      g.set(x, b1, z, "glass");
      g.set(x, b2, z, "glass_pane");
    }
  } else {
    // Rear column: solid ends and mullion columns, air gap behind the glass.
    if (z === 0 || z === D - 1 || z % 4 === 0) {
      g.set(x, b1, z, "white_concrete");
      g.set(x, b2, z, "white_concrete");
    } else if (z % 6 === 2) {
      // Warm light sitting in the air gap behind the glass.
      g.set(x, b1, z, "glowstone");
      // b2 left as air.
    }
    // Otherwise the gap stays as air.
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1335587021.nbt");
