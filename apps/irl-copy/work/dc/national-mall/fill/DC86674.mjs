import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86674.cells.json`, "utf8"));

const W = 16, H = 16, D = 4;
const g = new Voxels([W, H, D]);

// Lowest ground under the footprint is y 0.
const minG = Math.min(...cells.map(c => c[2]));
const cellMap = new Map();
for (const [x, z, gr, rf] of cells) {
  cellMap.set(`${x},${z}`, { ground: Math.round(gr - minG), roof: Math.round(rf - minG) });
}

// One flat roof level for the whole block (median of lidar roofs) so the
// skyline has no stray stacks; never less than two storeys above the ground.
const roofVals = [...cellMap.values()].map(c => c.roof).sort((a, b) => a - b);
const roofTarget = roofVals[Math.floor(roofVals.length / 2)];

const GLASS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const isWindowCol = x => x >= 1 && x <= 14 && x % 3 !== 0;
const isLampCol = x => x === 2 || x === 8 || x === 13;

for (const [key, { ground }] of cellMap) {
  const [x, z] = key.split(",").map(Number);
  const gr = Math.max(0, ground);
  const roofY = Math.min(H - 2, Math.max(gr + 4, roofTarget));
  const cornice = roofY - 1;

  // Foundation from y0 up to this cell's ground.
  for (let y = 0; y < gr; y++) {
    for (let zz = 0; zz < D; zz++) g.set(x, y, zz, "stone_bricks");
  }

  // Solid walls behind the facade, with an air pocket behind glass.
  for (let y = gr; y < roofY; y++) {
    for (let zz = 1; zz < D; zz++) g.set(x, y, zz, "bricks");
  }

  for (let y = gr; y < roofY; y++) {
    const r = y - gr;

    if (y === cornice) {
      for (let zz = 0; zz < D; zz++) g.set(x, y, zz, "stone_bricks");
      continue;
    }

    if (r === 0) {
      g.set(x, y, 0, "polished_granite");
      continue;
    }

    if (r % 2 === 0) {
      g.set(x, y, 0, "smooth_stone");
      continue;
    }

    if (r === 1) {
      // Ground floor shopfront: glass bays, stone door surround at x=6..8.
      if (x === 7) {
        g.set(x, y, 0, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
        g.set(x, y, 1, "air");
      } else if (x === 6 || x === 8 || x === 0 || x === 15) {
        g.set(x, y, 0, "stone_bricks");
      } else if (x >= 1 && x <= 14) {
        g.set(x, y, 0, "glass_pane", GLASS);
        g.set(x, y, 1, "air");
        if (isLampCol(x)) g.set(x, y, 2, "glowstone");
      } else {
        g.set(x, y, 0, "stone_bricks");
      }
      continue;
    }

    // Upper storey windows with stone pilasters between bays.
    if (isWindowCol(x)) {
      g.set(x, y, 0, "glass_pane", GLASS);
      g.set(x, y, 1, "air");
      if (isLampCol(x)) g.set(x, y, 2, "glowstone");
    } else {
      g.set(x, y, 0, "stone_bricks");
    }
  }

  // Door upper half at ground+2.
  if (x === 7 && gr + 2 < cornice) {
    g.set(x, gr + 2, 0, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    g.set(x, gr + 2, 1, "air");
  }

  // Entrance lintel over the door: a projecting stone canopy band with a slab cap.
  if (x >= 6 && x <= 8 && gr + 3 < cornice) {
    g.set(x, gr + 3, 0, x === 7 ? "stone_brick_slab" : "stone_bricks",
      x === 7 ? { type: "bottom", waterlogged: "false" } : undefined);
    g.set(x, gr + 3, 1, "stone_bricks");
  }

  // Low stone coping on the street and back faces and the end walls.
  if (z === 0 || z === D - 1 || x === 0 || x === W - 1) {
    g.set(x, roofY, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/DC86674.nbt`);
