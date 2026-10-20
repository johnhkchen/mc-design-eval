import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540296196";
const W = 39, H = 23, D = 16;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));

// number of missing footprint neighbours (exposed faces)
const exposure = (x, z) =>
  (!has(x - 1, z) ? 1 : 0) + (!has(x + 1, z) ? 1 : 0) +
  (!has(x, z - 1) ? 1 : 0) + (!has(x, z + 1) ? 1 : 0);
const isPerim = (x, z) => has(x, z) && exposure(x, z) > 0;
const nearPerim = (x, z) =>
  [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => isPerim(x + dx, z + dz));

const put = (x, y, z, block, st) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (st) g.set(x, y, z, block, st);
  else g.set(x, y, z, block);
};

const bay = (x, z) => (x + z) % 3 === 0; // pier every third block along each face

for (const [x, z, gr] of cells) {
  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!isPerim(x, z)) {
    // interior: floor slabs per storey and roof deck, air between
    put(x, gr, z, "light_gray_concrete");
    put(x, gr + 5, z, "light_gray_concrete");
    put(x, gr + 10, z, "light_gray_concrete");
    // roof condenser units
    if (x % 7 === 3 && z % 6 === 2) put(x, gr + 11, z, "light_gray_concrete");
    // warm interior light seen through the glass
    if (nearPerim(x, z)) {
      if (x % 4 === 2) put(x, gr + 4, z, "lantern", { hanging: "true", waterlogged: "false" });
      if (x % 4 === 0) put(x, gr + 7, z, "glowstone");
    }
    continue;
  }

  const corner = exposure(x, z) >= 2;
  const pier = corner || bay(x, z);

  // base course
  put(x, gr, z, "polished_granite");

  // ground floor shopfront (storey 1: gr+1 .. gr+3)
  const doorHere = x === 19 && !corner;
  const doorFacing = !has(x, z - 1) ? "north" : "south";
  for (let y = gr + 1; y <= gr + 3; y++) {
    if (doorHere && y <= gr + 2) {
      const half = y === gr + 1 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", {
        facing: doorFacing, half, hinge: "left", open: "false", powered: "false",
      });
    } else if (pier) {
      put(x, y, z, "white_concrete");
    } else {
      put(x, y, z, "light_blue_stained_glass");
    }
  }

  // storey-1 fascia / cornice line
  put(x, gr + 4, z, "smooth_quartz");

  // storey 2 spandrel, window band, spandrel (gr+5 .. gr+9)
  put(x, gr + 5, z, "white_concrete");
  for (let y = gr + 6; y <= gr + 8; y++) {
    put(x, y, z, pier ? "white_concrete" : "light_blue_stained_glass");
  }
  put(x, gr + 9, z, "white_concrete");

  // parapet cap
  put(x, gr + 10, z, "smooth_quartz");
}

g.save(`${DIR}/${ID}.nbt`);
