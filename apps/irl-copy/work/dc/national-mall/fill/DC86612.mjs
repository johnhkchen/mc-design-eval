import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86612.cells.json`, "utf8"));

const W = 7, H = 31, D = 16;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, ground, roof] of cells) map.set(key(x, z), { ground, roof });
const has = (x, z) => map.has(key(x, z));
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const STOREY = 3;
const MAX_STOREYS = 6;

// Per-cell tier tops, smoothed to whole storeys
const tops = new Map();
let maxTop = 0;
for (const [x, z, ground, roof] of cells) {
  const n = Math.max(2, Math.min(MAX_STOREYS, Math.round((roof - ground) / STOREY)));
  const top = ground + STOREY * n;
  tops.set(key(x, z), top);
  if (top > maxTop) maxTop = top;
}

for (const [x, z, ground] of cells) {
  const edge = isEdge(x, z);
  const top = tops.get(key(x, z));

  // Foundation from y 0 up to the cell's ground
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  const piered = (x + z) % 3 === 0;

  for (let y = ground; y < top; y++) {
    const r = y - ground;

    if (edge) {
      if (y === top - 1) {
        // Parapet capped with a stone course
        g.set(x, y, z, "white_concrete");
      } else if (y === top - 2) {
        // Cornice band: stone, reads as a projecting course
        g.set(x, y, z, "smooth_stone");
      } else if (r === 0) {
        // Base course (ground floor), dark granite plinth
        g.set(x, y, z, "polished_granite");
      } else if (r % STOREY === 0) {
        // Storey line / spandrel
        g.set(x, y, z, "white_concrete");
      } else if (piered) {
        // Pier between windows
        g.set(x, y, z, "white_concrete");
      } else {
        // Window, a few lit with shroomlight
        if ((x + 2 * z) % 13 === 4) g.set(x, y, z, "shroomlight");
        else g.set(x, y, z, "light_blue_stained_glass");
      }
    } else {
      // Interior: floor slabs and roof surface only, no interiors
      if (r > 0 && r % STOREY === 0) g.set(x, y, z, "smooth_stone");
      if (y === top - 1) g.set(x, y, z, "light_gray_concrete");
    }
  }

  // Single penthouse on the tallest tier, centred on the interior roof
  if (!edge && top === maxTop && x >= 2 && x <= 4 && z >= 4 && z <= 9) {
    g.set(x, top, z, "light_gray_concrete");
    g.set(x, top + 1, z, "light_gray_concrete");
    if (x === 3 && z === 6) g.set(x, top + 2, z, "stone_brick_slab", { type: "bottom" });
    if (x === 3 && z === 6) g.set(x, top + 2, z, "stone_brick_slab", { type: "bottom" });
  }
}

// Street entrance on the z=0 face: recessed door, white lintel, hanging lantern
if (has(3, 0) && isEdge(3, 0)) {
  const gr = map.get(key(3, 0)).ground;
  // Lintel course over the door
  for (const x of [2, 3, 4]) {
    if (has(x, 0)) g.set(x, gr + 2, 0, "white_concrete");
  }
  g.set(3, gr, 0, "dark_oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(3, gr + 1, 0, "dark_oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // Entrance light
  g.set(3, gr + 2, 0, "lantern", { hanging: "true", waterlogged: "false" });
}

g.save(`${DIR}/DC86612.nbt`);
