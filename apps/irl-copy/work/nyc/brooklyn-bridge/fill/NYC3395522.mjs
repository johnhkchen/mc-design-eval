import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC3395522.cells.json`, "utf8"));

const W = 13, H = 15, D = 2;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const SLAB_BOTTOM = { type: "bottom", waterlogged: "false" };
const WINDOW_X = new Set([1, 2, 3, 9, 10, 11]);
const ENTRY_X = new Set([5, 6, 7]);
const CANOPY_X = new Set([4, 5, 6, 7, 8]);

for (const c of cells) {
  const [x, z] = c;
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const gr = Math.round(c[2]);
  const rf = Math.round(c[3]);
  const top = Math.min(H - 1, Math.max(rf, gr + 3));

  // Foundation fill to this cell's ground, then base course.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, "polished_andesite");

  // Brick body.
  for (let y = gr + 1; y <= top - 2; y++) put(x, y, z, "bricks");

  // Stone lintel course over the body (storey line), cornice and parapet.
  put(x, top - 2, z, "stone_bricks");
  put(x, top - 1, z, "stone_bricks");
  put(x, top, z, "stone_brick_slab", SLAB_BOTTOM);

  // Street facade: glass bays with brick mullions.
  if (z === 0) {
    for (let y = gr + 1; y <= top - 3; y++) {
      if (WINDOW_X.has(x)) put(x, y, z, "glass");
    }
    // Iron gate across the entrance bay.
    if (ENTRY_X.has(x)) put(x, gr + 1, z, "iron_bars");
  }

  // Air gap behind the glass in the back row (no interiors).
  if (z === 1 && WINDOW_X.has(x)) {
    for (let y = gr + 1; y <= top - 3; y++) put(x, y, z, "air");
  }
  if (z === 1 && ENTRY_X.has(x)) put(x, gr + 1, z, "air");

  // Entrance canopy spans both rows, sitting on the lintel course.
  if (CANOPY_X.has(x)) {
    put(x, gr + 2, z, "stone_brick_slab", SLAB_BOTTOM);
  }
}

// Warm light behind the glass and a hanging lantern under the canopy.
const gMin = Math.min(...cells.map((c) => Math.round(c[2])));
const lightY = gMin + 1;
put(2, lightY, 1, "glowstone");
put(10, lightY, 1, "glowstone");
put(6, lightY, 1, "lantern", { hanging: "true", waterlogged: "false" });

g.save(`${DIR}/NYC3395522.nbt`);
