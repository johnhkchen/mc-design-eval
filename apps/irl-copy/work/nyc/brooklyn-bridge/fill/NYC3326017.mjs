import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3326017";
const W = 10, H = 17, D = 5;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> { gr: ground, r: roof top }
const cm = new Map();
for (const [x, z, gr0, rf0] of cells) {
  const gr = Math.round(gr0);
  const r = Math.max(Math.round(rf0), gr + 5);
  cm.set(`${x},${z}`, { gr, r });
}
const has = (x, z) => cm.has(`${x},${z}`);
const edge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const corner = (x, z) => (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));

// Position along the exterior face, so window bays are regular
const faceIndex = (x, z) => (!has(x, z - 1) || !has(x, z + 1)) ? x : z;

// Entrance: low-z (north) face, near the middle of its run
const meanX = cells.reduce((s, c) => s + c[0], 0) / cells.length;
let door = null;
{
  let best = null;
  for (const [x, z] of cells) {
    if (has(x, z - 1) || corner(x, z)) continue;
    const score = z * 100 + Math.abs(x - meanX);
    if (!best || score < best.score) best = { x, z, score };
  }
  if (best) door = { x: best.x, z: best.z };
}

const lights = [];
const bulkCandidates = [];

for (const [key, { gr, r }] of cm) {
  const [x, z] = key.split(",").map(Number);
  const ex = edge(x, z);

  // Foundation up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y < r; y++) {
    const k = y - gr;
    if (!ex) {
      // Interior: floor slab per storey and roof cap; otherwise air behind glass
      if (k % 2 === 0 || y === r - 1) g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (k === 0) {
      g.set(x, y, z, "smooth_stone"); // base course
    } else if (y === r - 1) {
      g.set(x, y, z, "smooth_stone"); // cornice
    } else if (k % 2 === 1 && !corner(x, z) && faceIndex(x, z) % 2 === 1) {
      g.set(x, y, z, "light_blue_stained_glass_pane"); // window bay
    } else if (k % 2 === 0 && !corner(x, z) && faceIndex(x, z) % 2 === 1) {
      g.set(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" }); // sill / lintel course
    } else {
      g.set(x, y, z, "bricks"); // piers and spandrels
    }
  }

  // Entrance: door, then a canopy slab over it
  if (ex && door && x === door.x && z === door.z) {
    const base = { facing: "north", hinge: "left", open: "false", powered: "false" };
    g.set(x, gr, z, "oak_door", { ...base, half: "lower" });
    g.set(x, gr + 1, z, "oak_door", { ...base, half: "upper" });
    g.set(x, gr + 2, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
  }

  // Parapet on exterior cells
  if (ex && r < H) g.set(x, r, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

  if (!ex && r + 3 < H) bulkCandidates.push({ x, z, r });

  // Some window bays get warm light, on the interior cell behind the glass
  if (ex && !corner(x, z) && faceIndex(x, z) % 4 === 1 && !(door && x === door.x && z === door.z)) {
    const sx = x < (W - 1) / 2 ? 1 : x > (W - 1) / 2 ? -1 : 0;
    const sz = z < (D - 1) / 2 ? 1 : z > (D - 1) / 2 ? -1 : 0;
    let target = null;
    if (sx && has(x + sx, z) && !edge(x + sx, z)) target = [x + sx, z];
    else if (sz && has(x, z + sz) && !edge(x, z + sz)) target = [x, z + sz];
    if (target) {
      for (let k = 1; k < r - gr - 1; k += 2) lights.push([target[0], gr + k, target[1]]);
    }
  }
}

// Warm light behind selected windows
for (const [lx, ly, lz] of lights) g.set(lx, ly, lz, "shroomlight");

// Roof access house: a 2x2 stair block on interior roof cells where possible, else 1x1
if (bulkCandidates.length) {
  const lowest = bulkCandidates.reduce((a, b) => (b.r < a.r ? b : a));
  const { x, z, r } = lowest;
  const block = (bx, bz) => {
    g.set(bx, r, bz, "bricks");
    g.set(bx, r + 1, bz, "bricks");
    g.set(bx, r + 2, bz, "smooth_stone");
  };
  const quad = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  const fits = quad.every(([qx, qz]) => {
    const c = cm.get(`${qx},${qz}`);
    return c && !edge(qx, qz) && c.r === r;
  });
  if (fits) quad.forEach(([qx, qz]) => block(qx, qz));
  else block(x, z);
}

g.save(`${DIR}/${ID}.nbt`);
