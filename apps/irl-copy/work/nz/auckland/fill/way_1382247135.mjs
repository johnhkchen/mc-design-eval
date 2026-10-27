// 117 Pakenham, Auckland CBD: a 1980s office block in precast concrete and blue-tinted glass on a basalt plinth
// (Auckland's volcanic stone). Its massing follows the lidar roof, smoothed into whole storeys (4 blocks each), with
// the tower and the lower wings stepping as the lidar gives them. Only the outer skin and a floor slab per storey are
// built: an air gap behind the glass, glowstone in some windows at dusk.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_1382247135.cells.json`, "utf8"));

const W = 54, D = 63, H = 131, STOREY = 4, BAY = 4;
const SIDES = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "0,-1": "north", "0,1": "south", "1,0": "east", "-1,0": "west" };

// ground (G) and lidar roof (R) per footprint cell, indexed [z][x]
const G = [], R = [];
for (let z = 0; z < D; z++) { G.push(new Array(W).fill(-1)); R.push(new Array(W).fill(0)); }
for (const [x, z, g, r] of cells) { G[z][x] = g; R[z][x] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[z][x] >= 0;
const median = (a) => { a.sort((p, q) => p - q); return a[a.length >> 1]; };

// 1. roof: a 5x5 median of the lidar roof, in whole storeys, then a 3x3 median on the storeys so no one-cell spikes
const N = G.map((row) => row.map(() => 0));
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z)) continue;
  const vals = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (inside(x + dx, z + dz)) vals.push(R[z + dz][x + dx]);
  const m = vals.length >= 3 ? median(vals) : R[z][x];
  N[z][x] = Math.max(2, Math.round(m / STOREY));
}
const S = N.map((row) => row.slice());
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z)) continue;
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inside(x + dx, z + dz)) vals.push(N[z + dz][x + dx]);
  S[z][x] = median(vals);
}
const top = (x, z) => (inside(x, z) ? S[z][x] * STOREY : 0);       // 0 outside the footprint: nothing solid there
const maxTop = Math.max(...cells.map(([x, z]) => top(x, z)));

const v = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => v.set(x, y, z, block, state);
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

const lights = [];
const doorsSeen = new Set();
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z)) continue;
  const g = G[z][x], T = top(x, z);

  // foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");

  // the rim of this roof: a neighbour outside the footprint or lower, so a parapet caps it
  const rim = SIDES.some(([dx, dz]) => !inside(x + dx, z + dz) || top(x + dx, z + dz) < T);
  if (rim) put(x, T, z, "white_concrete");

  for (let y = g; y < T; y++) {
    const exp = SIDES.filter(([dx, dz]) => !(inside(x + dx, z + dz) && y < top(x + dx, z + dz)));
    if (y === T - 1) { put(x, y, z, "light_gray_concrete"); continue; }              // roof slab
    if (exp.length === 0) {                                                          // interior: floor slab per storey, air otherwise
      if (y === g || y % STOREY === 0) put(x, y, z, "smooth_stone");
      continue;
    }

    // the outer skin: piers, spandrels, glazing, base course, entrances
    const corner = exp.length >= 2;
    const [pdx, pdz] = exp[0];
    const p = pdz !== 0 ? x : z;                       // position along the facade the cell sits on
    const k = Math.floor(y / STOREY), r = y % STOREY;
    const pier = corner || p % BAY === 0;
    const doorBay = k === 0 && p % (3 * BAY) === 6;    // one entrance per twelve blocks of facade
    const inDoorBay = k === 0 && Math.abs((p % (3 * BAY)) - 6) <= 1;
    const isDoor = doorBay && exp.length === 1 && (y === g || y === g + 1);
    const wallState = pdz !== 0
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    const facing = FACING[`${-pdx},${-pdz}`];           // a door faces into the building

    if (isDoor) {
      const half = y === g ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", { facing, half, hinge: "left", open: "false", powered: "false" });
      doorsSeen.add(`${x},${z}`);
    } else if (y === g) put(x, y, z, "polished_blackstone_bricks");                  // base course
    else if (k === 0 && y === g + 2 && inDoorBay) put(x, y, z, "polished_blackstone_bricks"); // lintel over the entrance
    else if (pier) put(x, y, z, k === 0 ? "polished_blackstone_bricks" : "light_gray_concrete");
    else if (r === 0 || r === 3) put(x, y, z, "white_concrete");                    // floor edge and head bands
    else {
      // glazing in a frame: tinted blue, some in cyan for the rhythm of the facade
      const cyan = hash(x, y, z) % 6 === 0;
      put(x, y, z, cyan ? "cyan_stained_glass_pane" : "light_blue_stained_glass_pane", wallState);
      if (r === 1 && hash(x, y, z) % 9 === 0) lights.push([x - pdx, y, z - pdz]);  // glowstone just behind the pane
    }
  }
}

// glowstone in the air gap behind some windows (only where the interior is still empty)
let lit = 0;
for (const [x, y, z] of lights) {
  if (!inside(x, z) || y >= top(x, z) || v.get(x, y, z)) continue;
  put(x, y, z, "glowstone"); lit++;
}

// roof plant: gray boxes on a 5x5 grid across the tall roofs, standing on the roof slab
let plant = 0;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z) || top(x, z) < 60) continue;
  const T = top(x, z);
  const interiorTop = SIDES.every(([dx, dz]) => inside(x + dx, z + dz) && top(x + dx, z + dz) >= T);
  if (!interiorTop || x % 5 === 0 || z % 5 === 0 || x % 5 === 4 || z % 5 === 4) continue;
  put(x, T, z, "gray_concrete"); put(x, T + 1, z, "gray_concrete"); plant++;
}

const out = `${DIR}/way_1382247135.nbt`;
const stats = v.save(out);
const count = {};
for (const [x, z] of cells.map((c) => [c[0], c[1]])) count[S[z][x]] = (count[S[z][x]] || 0) + 1;
console.log(JSON.stringify({ footprint: cells.length, maxTop, storeysHist: count, doors: doorsSeen.size, lit, plant, ...stats }));
