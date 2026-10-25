import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill/FR301499504.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill/FR301499504.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 6, H = 16, D = 4;
const g = new Voxels([W, H, D]);

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const byKey = new Map();
for (const c of cells) byKey.set(`${c[0]},${c[1]}`, c);
const meanG = cells.reduce((s, c) => s + c[2], 0) / Math.max(1, cells.length);
const meanR = cells.reduce((s, c) => s + c[3], 0) / Math.max(1, cells.length);

const stair = (facing) => ({ facing, half: "bottom", shape: "straight", waterlogged: "false" });
const DOOR_LOWER = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" };
const DOOR_UPPER = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" };

for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    const c = byKey.get(`${x},${z}`);
    const ground = clamp(Math.round(c ? c[2] : meanG), 0, H - 6);
    const roof = Math.round(c ? c[3] : meanR);
    // wall top T; pitched roof rises 2 blocks over the 4-block depth, ridge at T+2
    const T = clamp(Math.max(ground + 3, roof - 2), ground + 3, H - 4);

    // foundation up to ground
    for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

    const perimeter = x === 0 || x === W - 1 || z === 0 || z === D - 1;
    const front = z === 0, back = z === D - 1;
    const gable = x === 0 || x === W - 1;

    // floor slab
    g.set(x, ground, z, perimeter ? "stone_bricks" : "smooth_stone");

    // walls: granite body, base course above ground, cornice band under the roof
    if (perimeter) {
      for (let y = ground + 1; y <= T - 1; y++) {
        let block = "granite";
        if (y === ground + 1) block = "stone_bricks";        // base course
        if (y === T - 1) block = "chiseled_stone_bricks";   // cornice band
        if (y === ground + 2 && (front || back)) block = "polished_granite"; // string course
        g.set(x, y, z, block);
      }
    }

    // window and door openings on front and back faces
    if (front || back) {
      for (let y = ground + 1; y <= T - 2; y++) {
        if (front && x === 2 && y <= ground + 2) continue; // door opening
        if (x >= 1 && x <= 4) g.set(x, y, z, "glass_pane");
      }
      // window surrounds: stone sill and jambs read as frames on the facade
      if (x >= 1 && x <= 4 && front) g.set(x, ground + 1, z, x === 2 ? "spruce_door" : "stone_brick_slab", x === 2 ? DOOR_LOWER : { type: "bottom", waterlogged: "false" });
      if (front && x === 2) g.set(x, ground + 2, z, "spruce_door", DOOR_UPPER);
    }

    // warm lights behind glass
    if (x === 3 && z === 1) g.set(x, ground + 2, z, "glowstone");
    if (x === 1 && z === 2) g.set(x, ground + 2, z, "shroomlight");

    // interior ceiling at T for the middle rows
    if (z === 1 || z === 2) g.set(x, T, z, "deepslate_tiles");

    // pitched roof: eaves stairs at z=0/3 on T, ridge stairs on z=1/2 at T+1
    if (z === 0) g.set(x, T, z, "deepslate_tile_stairs", stair("north"));
    else if (z === D - 1) g.set(x, T, z, "deepslate_tile_stairs", stair("south"));
    else if (z === 1) g.set(x, T + 1, z, "deepslate_tile_stairs", stair("north"));
    else g.set(x, T + 1, z, "deepslate_tile_stairs", stair("south"));

    // gable ends closed under the roof slope
    if (gable && (z === 1 || z === 2)) g.set(x, T + 1, z, "stone_bricks");
  }
}

g.save(OUT);
