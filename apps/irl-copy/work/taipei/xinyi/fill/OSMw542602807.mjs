import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw542602807.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw542602807.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 37, H = 23, D = 19;

const key = (x, z) => x + "," + z;
const map = new Map();
for (const [x, z, gr] of cells) map.set(key(x, z), gr);
const has = (x, z) => map.has(key(x, z));

let minX = Infinity, maxX = -Infinity, minZ = Infinity;
for (const [x, z] of cells) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x); minZ = Math.min(minZ, z);
}
const midX = Math.floor((minX + maxX) / 2);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p); else g.set(x, y, z, id);
};

const DOOR_LOWER = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" };
const DOOR_UPPER = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" };
const LANTERN = { hanging: "true", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  // Foundation below the cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const xEdge = !has(x - 1, z) || !has(x + 1, z);
  const zEdge = !has(x, z - 1) || !has(x, z + 1);
  const perim = xEdge || zEdge;
  const corner = xEdge && zEdge;
  // Bay index runs along the facade the cell belongs to
  const bay = (xEdge && !zEdge) ? z : x;
  const pillar = corner || (bay % 4 === 0);

  // Floor slabs / storey lines / roof, full footprint
  if (perim) {
    put(x, gr, z, "polished_granite");
    put(x, gr + 5, z, "light_gray_concrete");
    put(x, gr + 10, z, "light_gray_concrete");
    put(x, gr + 11, z, "stone_brick_wall");
  } else {
    put(x, gr, z, "smooth_stone");
    put(x, gr + 5, z, "smooth_stone");
    put(x, gr + 10, z, "smooth_stone");
  }

  if (perim) {
    // Ground storey: shopfront
    for (let y = gr + 1; y <= gr + 4; y++) {
      if (pillar) put(x, y, z, "light_gray_concrete");
      else if (y === gr + 4) put(x, y, z, "white_concrete");
      else put(x, y, z, "glass");
    }
    // Upper storey: window grid
    for (let y = gr + 6; y <= gr + 9; y++) {
      if (pillar) put(x, y, z, "light_gray_concrete");
      else if (y === gr + 6 || y === gr + 9) put(x, y, z, "white_concrete");
      else if (y === gr + 7 && bay % 8 === 5) put(x, y, z, "glowstone");
      else put(x, y, z, "glass_pane");
    }
  }
}

// Entrance on the z-minimum face, two cells wide, centred
for (const [x, z, gr] of cells) {
  if (z !== minZ) continue;
  if (!has(x, z - 1) && Math.abs(x - midX) <= 0 || (x === midX - 1 && !has(x, z - 1))) {
    // handled below via loop over both door cells
  }
}
for (const x of [midX - 1, midX]) {
  if (!has(x, minZ)) continue;
  const gr = map.get(key(x, minZ));
  put(x, gr + 1, minZ, "dark_oak_door", DOOR_LOWER);
  put(x, gr + 2, minZ, "dark_oak_door", DOOR_UPPER);
  put(x, gr + 3, minZ, "glass");
}
// Flanking hanging lanterns at the entrance
for (const x of [midX - 3, midX + 2]) {
  if (!has(x, minZ)) continue;
  const gr = map.get(key(x, minZ));
  put(x, gr + 3, minZ, "lantern", LANTERN);
}

g.save(OUT);
