import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR301499623.cells.json`, "utf8"));

const W = 7, H = 17, D = 7;
const g = new Voxels([W, H, D]);
const clampY = (y) => Math.max(0, Math.min(H - 1, y));

const CELL = new Map();
const roofs = [];
let maxGr = 0;
for (const [x, z, gr, r] of cells) {
  const c = { gr: Math.round(gr), r: Math.round(r) };
  CELL.set(`${x},${z}`, c);
  roofs.push(c.r);
  if (c.gr > maxGr) maxGr = c.gr;
}
roofs.sort((a, b) => a - b);
const medRoof = roofs[Math.floor(roofs.length / 2)];

// One level wall top and roof line for the whole block (smooths lidar noise).
const wallTop = Math.max(maxGr + 3, medRoof - 2);   // top of walls / ceiling
const roofTop = wallTop + 2;                         // flat crown

// Pass 1: foundations, walls, floors, ceilings, roof mass and roof surface.
for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    const c = CELL.get(`${x},${z}`);
    if (!c) continue;
    const gr = c.gr;
    const perim = x === 0 || x === W - 1 || z === 0 || z === D - 1;
    const corner = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);

    // Foundation up to local ground.
    for (let y = 0; y < gr; y++) g.set(x, clampY(y), z, "stone_bricks");

    if (perim) {
      g.set(x, clampY(gr), z, "polished_andesite");               // base course
      for (let y = gr + 1; y < wallTop; y++) {
        const mat = corner ? "chiseled_stone_bricks" : "stone_bricks"; // quoins
        g.set(x, clampY(y), z, mat);
      }
      g.set(x, clampY(wallTop), z, "stone_brick_slab", { type: "top", waterlogged: "false" });
    } else {
      g.set(x, clampY(gr), z, "smooth_stone");                    // interior floor
      g.set(x, clampY(wallTop), z, "stone_bricks");               // ceiling
    }

    // Roof: eaves stairs at z=0/1 and z=5/6, flat crown z=2..4 at roofTop.
    const layer = roofTop;
    for (let y = wallTop + 1; y < layer; y++) g.set(x, clampY(y), z, "stone_bricks");

    if (z <= 1) {
      g.set(x, clampY(z === 0 ? wallTop + 1 : roofTop), z, "deepslate_tile_stairs", {
        facing: "north", half: "bottom", shape: "straight", waterlogged: "false",
      });
    } else if (z >= 5) {
      g.set(x, clampY(z === 6 ? wallTop + 1 : roofTop), z, "deepslate_tile_stairs", {
        facing: "south", half: "bottom", shape: "straight", waterlogged: "false",
      });
    } else {
      g.set(x, clampY(layer), z, "deepslate_tiles");
    }
  }
}

// Pass 2: openings and warm light (after walls so they replace wall blocks).
for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    const c = CELL.get(`${x},${z}`);
    if (!c) continue;
    const gr = c.gr;
    const perim = x === 0 || x === W - 1 || z === 0 || z === D - 1;
    if (!perim) continue;

    // Entrance: centred on the south face, two-high door.
    if (z === D - 1 && x === 3) {
      g.set(x, clampY(gr + 1), z, "oak_door", {
        facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
      });
      g.set(x, clampY(gr + 2), z, "oak_door", {
        facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
      });
      continue;
    }

    // Windows: panes on the long faces (x=0/6 at z=2,4) and on the north face (z=0 at x=2,4).
    const isWindowSpot =
      ((x === 0 || x === W - 1) && (z === 2 || z === 4)) ||
      (z === 0 && (x === 2 || x === 4));
    if (isWindowSpot) {
      for (let y = gr + 1; y <= wallTop - 1; y++) {
        g.set(x, clampY(y), z, "glass_pane");
      }
    }
  }
}

// Warm light behind two windows, inside the air gap.
for (const [x, z] of [[1, 2], [5, 4]]) {
  const c = CELL.get(`${x},${z}`);
  if (c) g.set(x, clampY(c.gr + 1), z, "glowstone");
}

g.save(`${DIR}/FR301499623.nbt`);
