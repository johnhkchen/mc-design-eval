import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// General Library, Auckland (OSM way 23893970). A civic building of the 1970s: a stone plinth on a common floor line,
// white-concrete piers and spandrels in a grid of tinted glass, a concrete cornice, and a tower on a four-storey wing.
// Storeys are 4 blocks; the lidar roof heights are snapped to storeys and median-smoothed into flat tiers.
// The facade is a one-cell ring of the footprint, with a one-cell air gap behind the glass; floor slabs span the rest.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_23893970.cells.json`, "utf8"));

const W = 101, D = 80, H = 59;
const idx = (x, z) => z * W + x;
const cell = new Map();
for (const [x, z, ground, roof] of cells) {
  if (x < 0 || z < 0 || x >= W || z >= D) continue;
  const k = idx(x, z), old = cell.get(k);
  if (!old || roof > old.r) cell.set(k, { x, z, g: ground, r: roof });
}
const inFp = (x, z) => x >= 0 && z >= 0 && x < W && z < D && cell.has(idx(x, z));
const cells_ = [...cell.values()];

// the common floor line: the highest ground under the footprint, so every cell's plinth runs up to it
const F = Math.max(...cells_.map((c) => c.g));
const raw = new Map(cells_.map((c) => [idx(c.x, c.z), Math.max(2, Math.round((c.r - F) / 4))]));
for (const c of cells_) {
  // median of the 3x3 neighbourhood: lidar noise becomes flat tiers, and each tier steps in on its own edge
  const vs = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inFp(c.x + dx, c.z + dz)) vs.push(raw.get(idx(c.x + dx, c.z + dz)));
  vs.sort((a, b) => a - b);
  c.n = vs[Math.floor(vs.length / 2)];
  c.top = F + 4 * c.n;                       // storeys run from F up to top (exclusive); top-1 is the roof
}

// footprint depth: 1 at the outer edge of the footprint, 2 one cell in (the air gap behind the facade), and so on
const footDepth = new Map();
const queue = [];
for (const c of cells_) {
  if (!inFp(c.x + 1, c.z) || !inFp(c.x - 1, c.z) || !inFp(c.x, c.z + 1) || !inFp(c.x, c.z - 1)) {
    footDepth.set(idx(c.x, c.z), 1); queue.push(c);
  }
}
for (let i = 0; i < queue.length; i++) {
  const c = queue[i], d = footDepth.get(idx(c.x, c.z));
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const x = c.x + dx, z = c.z + dz;
    if (!inFp(x, z) || footDepth.has(idx(x, z))) continue;
    footDepth.set(idx(x, z), d + 1); queue.push(cell.get(idx(x, z)));
  }
}

// exposure: a storey's wall faces a neighbour that is outside the footprint or has no storey at that level (a setback).
// [north, south, east, west] flags for the cell at storey k; any true means facade at that level.
const exposed = (c, k) => {
  const b = F + 4 * k;
  return [[0, -1], [0, 1], [1, 0], [-1, 0]].map(([dx, dz]) => {
    const x = c.x + dx, z = c.z + dz;
    if (!inFp(x, z)) return true;
    return cell.get(idx(x, z)).top <= b;
  });
};
const facadeAt = (c, k) => exposed(c, k).some(Boolean);
// the ring of the footprint on the ground floor: the depth-1 cells the entrance sits on
const onRing = (c) => facadeAt(c, 0);

// the entrance: the middle ring cell of the northern-most front, which has the outside to its north
const frontRing = cells_.filter((c) => onRing(c) && !inFp(c.x, c.z - 1));
const minZ = Math.min(...frontRing.map((c) => c.z));
const front = frontRing.filter((c) => c.z === minZ).sort((a, b) => a.x - b.x);
const door = front[Math.floor(front.length / 2)];

const g = new Voxels([W, H, D]);
const GLASS = "gray_stained_glass_pane";

for (const c of cells_) {
  const { x, z, n, top } = c;
  const depth = footDepth.get(idx(x, z));
  const alongX = (ex) => ex[0] || ex[1];   // a wall running east-west: exposed to the north or south

  // the plinth from the bottom up to the floor line: stone base course at its top
  for (let y = 0; y < F; y++) g.set(x, y, z, y === F - 1 ? "polished_andesite" : "stone_bricks");

  for (let k = 0; k < n; k++) {
    const b = F + 4 * k;
    g.set(x, b, z, "light_gray_concrete");                   // floor slab, and the string course on the facade
    const ex = exposed(c, k);
    if (!ex.some(Boolean)) {
      // the interior: a warm light in some bays behind the glass, one block in from the facade
      if (depth === 2 && k > 0 && (x * 31 + z * 17 + k * 7) % 9 === 0) g.set(x, b + 1, z, "glowstone");
      continue;
    }
    const p = alongX(ex) ? x : z;
    for (const y of [b + 1, b + 2]) {
      if (p % 3 === 0) g.set(x, y, z, "white_concrete");     // piers between the bays
      else g.set(x, y, z, GLASS, alongX(ex)
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
    }
    g.set(x, b + 3, z, "white_concrete");                    // spandrel
  }

  // the roof: the top course on the interior, a cornice on the facade, and roof plant
  if (!facadeAt(c, n - 1)) {
    g.set(x, top - 1, z, "smooth_stone");
    if (x % 6 === 2 && z % 5 === 2 && top + 2 < H) {
      g.set(x, top, z, "iron_block");
      g.set(x, top + 1, z, "iron_bars");
    }
  } else {
    g.set(x, top, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// entrance: a door in the front ring cell, a lintel canopy over it
for (const c of front) {
  if (Math.abs(c.x - door.x) <= 1) g.set(c.x, F + 3, c.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}
const hinge = { facing: "north", hinge: "left", open: "false", powered: "false" };
g.set(door.x, F + 1, door.z, "oak_door", { ...hinge, half: "lower" });
g.set(door.x, F + 2, door.z, "oak_door", { ...hinge, half: "upper" });

const out = `${DIR}/way_23893970.nbt`;
const res = g.save(out);
console.log(`footprint ${cells_.length} cells; floor ${F}; storeys ${[...new Set(cells_.map((c) => c.n))].sort((a, b) => a - b).join(",")}; ${res.blocks} blocks, ${res.palette} block states -> ${out}`);
