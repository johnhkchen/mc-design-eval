import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const W = 6, H = 23, D = 7;
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill/FR301499728.cells.json", "utf8"));
const g = new Voxels([W, H, D]);

function put(x, y, z, id, p) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
}

const PANE_FRONT = { north: "false", south: "false", east: "true", west: "true" };
const PANE_SIDE = { north: "true", south: "true", east: "false", west: "false" };

// Common base level: the highest ground under the footprint, so every storey line is flat
const grounds = cells.map(([, , gr]) => Math.max(0, gr));
const B = Math.min(11, Math.max(...grounds));
// Flat roof about 11 blocks above the lowest ground (lidar), with the parapet inside the canvas
const roofY = Math.min(H - 1, Math.max(11, B + 11));

const grOf = new Map();
for (const [x, z, gr] of cells) grOf.set(x + "," + z, Math.max(0, Math.min(B, gr)));

for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  const gr = grOf.get(x + "," + z);
  const perimeter = x === 0 || x === W - 1 || z === 0 || z === D - 1;

  // Foundation: solid from y0 up to the cell's ground, then up to the common base level
  for (let y = 0; y < B; y++) put(x, y, z, "stone_bricks");

  // Storeys, cornice and flat roof deck
  for (let y = B; y < roofY; y++) {
    if (y === roofY - 1) {
      put(x, y, z, "smooth_stone"); // roof deck over the whole footprint
    } else if (y === roofY - 2) {
      if (perimeter) put(x, y, z, "chiseled_stone_bricks"); // cornice / parapet cap
    } else if (perimeter) {
      put(x, y, z, "calcite"); // lime render walls
    }
  }

  // Base course on the perimeter, and storey floor slab at B+5
  if (perimeter) put(x, B, z, "stone_bricks");
  if (B + 5 < roofY - 2) put(x, B + 5, z, perimeter ? "stone_bricks" : "smooth_stone");

  // Shopfront fascia on the street face
  if (z === 0) put(x, B + 4, z, "dark_oak_planks");
}

// Windows and entrance on perimeter faces
for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  const front = z === 0, back = z === D - 1, left = x === 0, right = x === W - 1;
  if (!(front || back || left || right)) continue;

  const idx = front || back ? x : z;
  const pane = front || back ? PANE_FRONT : PANE_SIDE;

  // Upper storey windows (B+6..B+8) on odd face positions
  if (idx % 2 === 1 && idx >= 1 && idx <= 5) {
    for (let y = B + 6; y <= B + 8; y++) {
      if (y < roofY - 2) put(x, y, z, "glass_pane", pane);
    }
  }

  if (front) {
    if (x === 2) {
      // Centre entrance: door on the base level with a lintel above
      put(x, B, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, B + 1, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    } else if (x >= 1 && x <= 4) {
      // Shopfront glazing
      for (let y = B + 1; y <= B + 3; y++) put(x, y, z, "glass_pane", PANE_FRONT);
    }
  } else if (idx % 2 === 1 && idx >= 1) {
    // Ground-floor windows on the other faces
    for (let y = B + 1; y <= B + 3; y++) put(x, y, z, "glass_pane", pane);
  }
}

// Warm light behind two street-front upper windows, and a lantern inside the shopfront
for (const xi of [1, 3]) put(xi, B + 7, 1, "glowstone");
put(2, B + 2, 1, "lantern", { hanging: "false" });

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill/FR301499728.nbt");
