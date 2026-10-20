import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const base = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw542682852";
const cells = JSON.parse(readFileSync(base + ".cells.json", "utf8"));

// Two-storey commercial block, ~11 blocks to roof, parapet to 12.
const W = 15, H = 23, D = 14;
const ROOF = 11;   // roof deck level
const F1 = 5;      // first storey line
const F2 = 10;     // cornice / second storey line
const PAR = 12;    // parapet cap level

const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(x + "," + z, gr);
const has = (x, z) => ground.has(x + "," + z);

const pane = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };
const slab = { type: "bottom", waterlogged: "false" };

// Pass 1: foundations, floor slabs, roof deck, and the walls on edge cells.
const groundOf = (x, z) => {
  const v = Math.round(ground.get(x + "," + z));
  return Math.min(Math.max(v, 0), ROOF - 2);
};

for (const [x, z] of cells) {
  const gr = groundOf(x, z);

  // Foundation: solid from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Floor slabs per storey (no interiors) and roof deck.
  g.set(x, F1, z, "smooth_stone");
  g.set(x, F2, z, "smooth_stone");
  g.set(x, ROOF, z, "light_gray_concrete");

  const n = !has(x, z - 1), s = !has(x, z + 1);
  const w = !has(x - 1, z), e = !has(x + 1, z);
  if (!(n || s || w || e)) continue; // interior cell: no walls

  const idx = x + z;

  for (let y = gr; y < ROOF; y++) {
    if (y === gr) {
      g.set(x, y, z, "stone_bricks");                      // base course
    } else if (y < F1) {
      // Ground floor shopfront: glass bays between stone piers, lintel band.
      if (y === F1 - 1) g.set(x, y, z, "white_concrete");  // lintel
      else if (idx % 3 === 0) g.set(x, y, z, "stone_bricks"); // piers
      else g.set(x, y, z, "glass");
    } else if (y === F1) {
      g.set(x, y, z, "light_gray_concrete");               // storey line
    } else if (y < F2) {
      // Upper storey: window grid with lamps behind some panes.
      if (y === 9) g.set(x, y, z, "light_gray_concrete");  // spandrel
      else if (idx % 3 === 0) g.set(x, y, z, "white_concrete"); // mullion
      else if (y === 7 && (idx * 5 + x) % 9 === 0) g.set(x, y, z, "shroomlight");
      else g.set(x, y, z, "glass_pane", pane);
    } else if (y === F2) {
      g.set(x, y, z, "smooth_stone");                      // cornice
    }
  }

  // Parapet with stone cap.
  g.set(x, PAR, z, "stone_brick_slab", slab);
}

// Pass 2: entrance on the south face, near the middle of the frontage.
const southCells = cells.filter(([x, z]) => !has(x, z + 1));
if (southCells.length) {
  const meanX = southCells.reduce((a, c) => a + c[0], 0) / southCells.length;
  const [dx, dz] = southCells.reduce((best, c) =>
    Math.abs(c[0] - meanX) < Math.abs(best[0] - meanX) ? c : best);
  const gr = groundOf(dx, dz);
  const door = { facing: "south", hinge: "left", open: "false", powered: "false" };
  g.set(dx, gr + 1, dz, "oak_door", { ...door, half: "lower" });
  g.set(dx, gr + 2, dz, "oak_door", { ...door, half: "upper" });
  // Canopy band over the door, and warm light either side.
  g.set(dx, gr + 3, dz, "dark_oak_slab", { type: "top", waterlogged: "false" });
  if (has(dx - 1, dz)) g.set(dx - 1, gr + 2, dz, "shroomlight");
  if (has(dx + 1, dz)) g.set(dx + 1, gr + 2, dz, "shroomlight");
}

// Roof plant: a central equipment block with a louvred top.
for (let x = 5; x <= 9; x++) {
  for (let z = 4; z <= 9; z++) {
    if (!has(x, z)) continue;
    const top = (x === 5 || x === 9 || z === 4 || z === 9);
    g.set(x, ROOF + 1, z, top ? "light_gray_concrete" : "iron_bars");
    g.set(x, ROOF + 2, z, top ? "smooth_stone_slab" : "air", top ? slab : undefined);
  }
}

g.save(base + ".nbt");
