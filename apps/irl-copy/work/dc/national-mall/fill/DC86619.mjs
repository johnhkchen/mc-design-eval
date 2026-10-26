import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86619.cells.json`, "utf8"));

const W = 9, D = 18, HH = 31;
const g = new Voxels([W, HH, D]);

const mean = a => a.reduce((s, v) => s + v, 0) / a.length;

// Common base level and roof level from the lidar record
const B = Math.round(mean(cells.map(c => c[2])));
let Top = Math.round(mean(cells.map(c => c[3])));
Top = Math.max(B + 12, Math.min(Top, 27));

// Storey floor levels, 4 blocks each (ground shopfront + upper floors)
const levels = [];
for (let L = B; L + 4 <= Top - 1; L += 4) levels.push(L);

const isPerim = (x, z) => x === 0 || x === W - 1 || z === 0 || z === D - 1;
const glass = new Set();
const boarded = (x, L) => ((x + L) % 3) !== 0;
const paneOpts = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };

// 1. Solid base and shell, continuous plates
for (const c of cells) {
  const [x, z, gc] = c;
  // foundation from y0 up to this cell's ground, then podium infill up to the common base B
  for (let y = 0; y < gc; y++) g.set(x, y, z, "stone_bricks");
  for (let y = gc; y < B; y++) g.set(x, y, z, "bricks");

  const base = Math.max(gc, B);
  if (isPerim(x, z)) {
    for (let y = base; y <= Top - 1; y++) {
      g.set(x, y, z, y === B ? "stone_bricks" : "bricks");   // base course at B
    }
    g.set(x, Top + 1, z, "stone_brick_wall", { north: "none", south: "none", east: "none", west: "none", up: "true", waterlogged: "false" });
  } else {
    // interior: only floor plates at each storey, air between
    for (const L of levels) g.set(x, L, z, "smooth_stone");
  }
  // continuous floor plates on the perimeter too
  for (const L of levels) if (isPerim(x, z)) g.set(x, L, z, "smooth_stone");
  // roof slab over the whole footprint
  g.set(x, Top, z, "smooth_stone");
}

// 2. Street (z=0) facade: shopfront with entrance at x=4
const doorX = 4;
for (const L of levels) {
  if (L === B) {
    for (const x of [2, 3, 5, 6]) {
      g.set(x, L + 1, 0, "stone_bricks");
      g.set(x, L + 2, 0, "spruce_planks");
      g.set(x, L + 3, 0, "spruce_planks");
    }
    g.set(doorX, L + 1, 0, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(doorX, L + 2, 0, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    g.set(doorX, L + 3, 0, "glass_pane", paneOpts);
    glass.add(`${doorX},${L + 3},0`);
    // fascia band over the shopfront
    for (const x of [1, 2, 3, 5, 6, 7]) g.set(x, L + 3, 0, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    continue;
  }
  for (const x of [2, 3, 5, 6]) {
    g.set(x, L + 1, 0, "stone_bricks");
    for (const y of [L + 2, L + 3]) {
      if (boarded(x, L)) g.set(x, y, 0, "spruce_planks");
      else { g.set(x, y, 0, "glass_pane", paneOpts); glass.add(`${x},${y},0`); }
    }
  }
}

// 3. Rear (z=17) facade: same grid, no entrance
for (const L of levels) {
  if (L === B) continue;
  for (const x of [2, 3, 5, 6]) {
    g.set(x, L + 1, D - 1, "stone_bricks");
    for (const y of [L + 2, L + 3]) {
      if (boarded(x, L + 1)) g.set(x, y, D - 1, "spruce_planks");
      else { g.set(x, y, D - 1, "glass_pane", paneOpts); glass.add(`${x},${y},${D - 1}`); }
    }
  }
}

// Warm light behind one glazed window on the top storey
const topL = levels[levels.length - 1];
if (topL !== undefined) {
  const cand = [2, 3, 5, 6].find(x => !boarded(x, topL));
  if (cand !== undefined) g.set(cand, topL + 2, 1, "glowstone");
}

// 4. Roof equipment: small brick penthouse
for (let x = 3; x <= 5; x++) for (let z = 6; z <= 8; z++) {
  g.set(x, Top + 1, z, "bricks");
  g.set(x, Top + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// 5. Connect glass panes east/west to neighbours in the same row
for (const k of glass) {
  const [x, y, z] = k.split(",").map(Number);
  const e = glass.has(`${x + 1},${y},${z}`) ? "true" : "false";
  const w = glass.has(`${x - 1},${y},${z}`) ? "true" : "false";
  g.set(x, y, z, "glass_pane", { north: "false", south: "false", east: e, west: w, waterlogged: "false" });
}

g.save(`${DIR}/DC86619.nbt`);
