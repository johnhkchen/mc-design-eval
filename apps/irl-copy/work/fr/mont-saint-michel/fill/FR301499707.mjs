import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR301499707.cells.json`, "utf8"));

const W = 5, D = 9, H = 25;
const g = new Voxels([W, H, D]);

const WALL = "stone_bricks";
const BAND = "polished_andesite";
const FOUND = "stone_bricks";
const CORNER = "chiseled_stone_bricks";
const FLOOR_SLAB = "smooth_stone";
const GLASS = "glass";
const SILL = "stone_brick_slab";
const SLATE = "deepslate_tiles";
const SLATE_ST = "deepslate_tile_stairs";

const E = 11;      // eave level: wall tops at y=10, roof starts at y=11
const FLOOR = 5;   // storey line between the two storeys
const CEIL = 11;   // ceiling / roof base

const G = Math.min(...cells.map(c => Math.round(c[2])));
const has = new Map(cells.map(c => [`${c[0]},${c[1]}`, Math.max(0, Math.round(c[2]) - G)]));
const inFp = (x, z) => has.has(`${x},${z}`);

// roof level for column x: 11 at the eaves, 12 next in, 13 at the ridge
const top = (x) => E + (2 - Math.abs(x - 2));

const set = (x, y, z, b, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};

// 1. Foundations, floor/ceiling slabs and walls, per footprint cell
for (const [x, z, grRaw] of cells) {
  const gy = Math.max(0, Math.round(grRaw) - G);

  for (let y = 0; y < gy; y++) set(x, y, z, FOUND);

  const perimeter = !inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1);

  set(x, FLOOR, z, perimeter ? BAND : FLOOR_SLAB);
  if (x >= 1 && x <= 3) set(x, CEIL, z, WALL);

  if (!perimeter) continue;

  const side = x === 0 || x === W - 1;
  const topY = side ? E - 1 : top(x) - 1;
  const corner = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);

  for (let y = gy; y <= topY; y++) {
    if (y === gy) set(x, y, z, BAND);
    else if (corner && y <= E - 2) set(x, y, z, CORNER);
    else set(x, y, z, WALL);
  }
}

// 2. Windows: glass set into the wall, with a stone sill beneath each
const win = (x, y, z) => {
  set(x, y, z, GLASS);
  set(x, y - (y === 2 ? 1 : (y === 7 ? 1 : 1)), z, SILL, { type: "top", waterlogged: "false" });
};
const storeys = [2, 3, 7, 8];

for (const x of [0, W - 1]) {
  for (const z of [2, 6]) for (const y of storeys) win(x, y, z);
}
for (const x of [1, 3]) for (const y of storeys) win(x, y, 0);
win(2, 3, 0);
win(2, 7, 0);
win(2, 8, 0);
for (const x of [1, 3]) for (const y of storeys) win(x, y, D - 1);

// entrance: centred door with a stone surround
set(2, 1, 0, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
set(2, 2, 0, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });

// warm light behind glass
set(1, 2, 2, "glowstone");
set(3, 7, 6, "glowstone");
set(1, 7, 2, "shroomlight");

// 3. Roof: slate stairs on both slopes, ridge in the middle
for (let z = 0; z < D; z++) {
  for (let x = 0; x < W; x++) {
    if (x === 2) {
      set(2, 12, z, WALL);
      set(2, 13, z, SLATE);
    } else {
      const facing = x < 2 ? "west" : "east";
      set(x, top(x), z, SLATE_ST, { facing, half: "bottom", shape: "straight", waterlogged: "false" });
    }
  }
}

// 4. Chimney on the north-west slope, with a stone cap
for (let y = 13; y <= 15; y++) set(1, y, 6, WALL);
set(1, 16, 6, SILL, { type: "bottom", waterlogged: "false" });

g.save(`${DIR}/FR301499707.nbt`);
