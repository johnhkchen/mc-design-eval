import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1341315572.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1341315572.nbt";

const W = 3, H = 19, D = 7;
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

const NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const DOOR_LOWER = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" };
const DOOR_UPPER = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" };

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Ground-storey perimeter (k = 1..3 relative to the cell's ground), beam at k = 4.
function groundStorey(x, z, k) {
  if (k === 4) return ["quartz_block"];
  if (z === 0) {
    // Front: shopfront with a centred entrance
    if (x === 1) {
      if (k === 1) return ["oak_door", DOOR_LOWER];
      if (k === 2) return ["oak_door", DOOR_UPPER];
      return ["glass_pane", EW];
    }
    return k === 1 ? ["polished_andesite"] : ["glass"];
  }
  if (z === 6) {
    return k === 1 ? ["polished_andesite"] : ["white_concrete"];
  }
  // Side walls (x = 0 or 2), z 1..5
  if (k === 1) return ["polished_andesite"];
  if (z >= 2 && z <= 4) return ["glass_pane", NS];
  return ["white_concrete"];
}

// Upper-storey perimeter (k = 6).
function upperStorey(x, z) {
  if (z === 0) return ["glass_pane", EW];
  if (z === 6) return ["white_concrete"];
  if (z >= 2 && z <= 4) return ["glass_pane", NS];
  return ["white_concrete"];
}

for (const [x, z, ground] of cells) {
  const gy = ground;
  const perim = x === 0 || x === 2 || z === 0 || z === 6;

  // Foundation from y 0 up to the cell's ground, then the ground floor slab.
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");
  put(x, gy, z, "smooth_stone");

  // Ground storey: k = 1..4
  for (let k = 1; k <= 4; k++) {
    if (!perim) continue; // interior air behind the glass
    const [id, props] = groundStorey(x, z, k);
    put(x, gy + k, z, id, props);
  }

  // Upper floor slab (storey line), perimeter shows a quartz course.
  put(x, gy + 5, z, perim ? "quartz_block" : "smooth_stone");

  // Upper storey: k = 6
  if (perim) {
    const [id, props] = upperStorey(x, z);
    put(x, gy + 6, z, id, props);
  }

  // Roof: parapet on the perimeter, light roof deck inside.
  put(x, gy + 7, z, perim ? "quartz_block" : "light_gray_concrete");

  // Roof plant box on the deck.
  if (x === 1 && z === 3) put(x, gy + 8, z, "iron_block");

  // Warm lights behind the front glass.
  if (x === 1 && z === 1) {
    put(x, gy + 2, z, "glowstone");
    put(x, gy + 6, z, "shroomlight");
  }
}

g.save(OUT);
