import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542016208";
const W = 19, H = 23, D = 26;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));

// Edge cell: at least one 4-neighbour is outside the footprint.
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
// Corner: missing neighbours on both axes.
const isCorner = (x, z) => (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));

const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (!has(x, z)) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};

// Entrance: on the minimum-z street face, nearest the footprint's centre in x.
let minX = Infinity, maxX = -Infinity, minZ = Infinity;
for (const [x, z] of cells) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x); minZ = Math.min(minZ, z);
}
const cxMid = (minX + maxX) / 2;
let entrance = null;
for (const [x, z] of cells) {
  if (z !== minZ || has(x, z - 1)) continue;
  if (!entrance || Math.abs(x - cxMid) < Math.abs(entrance[0] - cxMid)) entrance = [x, z];
}

// Pick a few interior cells that get warm light behind the glass.
const lightSpot = (x, z) => ((x * 7 + z * 3) % 11 === 0);

for (const [x, z, gr] of cells) {
  // Foundation up to the local ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Floor slab (storey line) and roof slab for every footprint cell.
  put(x, gr + 5, z, "smooth_quartz");
  put(x, gr + 10, z, "smooth_stone");

  if (!isEdge(x, z)) {
    // Interior: air gap, only slabs above. Roof equipment on a 2x2 grid.
    if (x % 6 === 3 && z % 6 === 3 && has(x + 1, z) && has(x, z + 1) && has(x + 1, z + 1)
        && !isEdge(x + 1, z) && !isEdge(x, z + 1) && !isEdge(x + 1, z + 1)) {
      for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
        const ex = x + dx, ez = z + dz;
        const eg = ground.get(key(ex, ez));
        for (let r = 11; r <= 12; r++) put(ex, eg + r, ez, "light_gray_concrete");
        put(ex, eg + 13, ez, "gray_concrete");
      }
    }
    continue;
  }

  const corner = isCorner(x, z);
  const isEntrance = entrance && entrance[0] === x && entrance[1] === z;
  const pier = corner || ((x + z) % 3 === 0);

  // Base course.
  put(x, gr, z, "polished_andesite");

  // Ground floor shopfront (rel 1..3).
  for (let r = 1; r <= 3; r++) {
    if (isEntrance && (r === 1 || r === 2)) continue; // open doorway
    if (corner) put(x, gr + r, z, "quartz_block");
    else if (pier) put(x, gr + r, z, "white_concrete");
    else put(x, gr + r, z, "light_blue_stained_glass");
  }
  // Canopy / lintel (rel 3 over entrance, rel 4 elsewhere).
  if (isEntrance) put(x, gr + 3, z, "smooth_quartz");
  put(x, gr + 4, z, "quartz_block");

  // Second floor (rel 6..9).
  put(x, gr + 6, z, "white_concrete");
  for (let r = 7; r <= 8; r++) {
    if (corner) put(x, gr + r, z, "quartz_block");
    else if (pier) put(x, gr + r, z, "white_concrete");
    else {
      put(x, gr + r, z, "light_blue_stained_glass");
    }
  }
  put(x, gr + 9, z, "quartz_block");

  // Warm glowstone just inside a few second-floor windows.
  if (!corner && !pier && lightSpot(x, z)) {
    const inward = [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]]
      .find(([nx, nz]) => has(nx, nz) && !isEdge(nx, nz));
    if (inward) put(inward[0], ground.get(key(inward[0], inward[1])) + 7, inward[1], "glowstone");
  }

  // Parapet cap.
  put(x, gr + 11, z, "smooth_quartz");
}

g.save(`${DIR}/${ID}.nbt`);
