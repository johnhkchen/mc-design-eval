// JW Marriott Auckland, as a 1990s-2000s glass hotel tower on a lower wing. The lidar roof says a flat-topped mass
// of ~96 blocks with a plant crown to ~110 on the west, and a six-storey wing (roof ~24) on the east. The tower steps
// down in three setbacks (48, 72, 96) toward its edge, and each cell is a solid mass with a one-block air gap behind
// the glass; every storey has a slab row, so nothing floats. Facade: a 4-block storey (slab / two glazing rows /
// spandrel), piers every third block, warm glow in some bays, a recessed entrance with a canopy on the south face.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_330132975.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_330132975.nbt";
const W = 84, D = 118, MAX_Y = 122;

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const at = Array.from({ length: D }, () => Array(W).fill(null));
for (const [x, z, g, R] of cells) at[z][x] = { g, R, depth: 0, towerD: Infinity, H: 0 };
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && at[z][x] !== null;
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// distance from the mask's outer edge (1 = edge cell), by breadth-first search over 4-neighbours
function edgeDistance(mask) {
  const dist = Array.from({ length: D }, () => Array(W).fill(0));
  const q = [];
  for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    if (!mask(x, z)) continue;
    if (NB.some(([dx, dz]) => !mask(x + dx, z + dz))) { dist[z][x] = 1; q.push([x, z]); }
  }
  for (let i = 0; i < q.length; i++) {
    const [x, z] = q[i];
    for (const [dx, dz] of NB) {
      const nx = x + dx, nz = z + dz;
      if (mask(nx, nz) && !dist[nz][nx]) { dist[nz][nx] = dist[z][x] + 1; q.push([nx, nz]); }
    }
  }
  return dist;
}

// The tower is the lidar's >= 60 cells, pruned of lone cells (a single column with fewer than two tower neighbours is
// noise on the wing's roof, not a tower), so the wing's roof stays flat.
let towerSet = new Set(cells.filter(([x, z, , R]) => R >= 60).map(([x, z]) => x + "," + z));
for (let pass = 0; pass < 3; pass++) {
  const kept = new Set([...towerSet].filter((k) => {
    const [x, z] = k.split(",").map(Number);
    return NB.filter(([dx, dz]) => towerSet.has(x + dx + "," + (z + dz))).length >= 2;
  }));
  towerSet = kept;
}
const isTower = (x, z) => towerSet.has(x + "," + z);

// Each cell's roof tier H: a multiple of 4 (the crown keeps the lidar height to the nearest 2). The tower steps down
// in setbacks toward its edge (48, 72, 96); lone noise cells take the wing's height.
// The crown (plant above 100) is pruned the same way: lone spikes of lidar noise stay at the tower's top tier.
let crownSet = new Set(cells.filter(([x, z, , R]) => R >= 100).map(([x, z]) => x + "," + z));
for (let pass = 0; pass < 3; pass++) {
  crownSet = new Set([...crownSet].filter((k) => {
    const [x, z] = k.split(",").map(Number);
    return NB.filter(([dx, dz]) => crownSet.has(x + dx + "," + (z + dz))).length >= 2;
  }));
}
const isCrown = (x, z) => crownSet.has(x + "," + z);
const towerDist = edgeDistance(isTower);
for (const [x, z, g, R] of cells) {
  const c = at[z][x];
  if (isCrown(x, z)) c.H = Math.round(R / 2) * 2;
  else if (isTower(x, z)) {
    const t = towerDist[z][x];
    c.H = t >= 8 ? 96 : t >= 4 ? 72 : 48;
  } else c.H = R >= 26 ? 24 : Math.max(4 * Math.round(R / 4), g + 4);     // the wing's tier; lone noise above it is not a tower
  c.H = Math.max(c.H, g + 4);
  c.crown = isCrown(x, z);
}

// Depth into the envelope (1 facade, 2 air gap, 3+ core), counted from every exposed side: the footprint's edge or
// a neighbour that stands lower, so each setback has its own facade.
const exposed = (x, z) => {
  const c = at[z][x];
  return NB.some(([dx, dz]) => !inside(x + dx, z + dz) || at[z + dz][x + dx].H < c.H);
};
const sources = Array.from({ length: D }, () => Array(W).fill(0));
const queue = [];
for (const [x, z] of cells.map(([x, z]) => [x, z])) if (exposed(x, z)) { sources[z][x] = 1; queue.push([x, z]); }
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of NB) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && !sources[nz][nx]) { sources[nz][nx] = sources[z][x] + 1; queue.push([nx, nz]); }
  }
}
for (const [x, z] of cells.map(([x, z]) => [x, z])) at[z][x].depth = sources[z][x];

const v = new Voxels([W, MAX_Y, D]);
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

for (const [x, z, g] of cells) {
  const { depth, H, crown } = at[z][x];
  for (let y = 0; y < g; y++) v.set(x, y, z, "stone");     // foundation, from y 0 up to the ground
  const pier = (x + z) % 3 === 0;                          // a pier every third block, on either face
  for (let y = g; y < H; y++) {
    const r = y % 4;
    if (y === H - 1) { v.set(x, y, z, depth === 1 ? "white_concrete" : "gray_concrete"); continue; }   // cornice / roof
    if (depth === 1) {
      if (y < 4) v.set(x, y, z, pier ? "polished_andesite" : y === 3 ? "white_concrete" : "light_blue_stained_glass");
      else if (r === 0 || r === 3) v.set(x, y, z, "white_concrete");                                  // slab, spandrel
      else v.set(x, y, z, pier ? "light_gray_concrete" : crown ? "gray_concrete" : "light_blue_stained_glass");
    } else if (depth === 2) {
      if (r === 0 || r === 3) v.set(x, y, z, "white_concrete");                                       // floor slab
      else if (r === 1 && hash(x, y, z) % 23 === 0) v.set(x, y, z, "glowstone");                      // warm light behind glass
      // else: the air gap behind the glass
    } else v.set(x, y, z, "light_gray_concrete");                                                     // core
  }
}

// Recessed entrance on the south face: the door at the median south-face column, glass beside it, a canopy above.
const south = [];
for (const [x, z] of cells.map(([x, z]) => [x, z])) if (at[z][x].depth === 1 && !inside(x, z + 1)) south.push(x);
south.sort((a, b) => a - b);
const x0 = south[Math.floor(south.length / 2)];
const zEdge = (x) => { let zm = -1; for (let z = 0; z < D; z++) if (inside(x, z)) zm = z; return zm; };
for (let x = x0 - 2; x <= x0 + 2; x++) {
  if (!inside(x, 0) && zEdge(x) < 0) continue;
  const zE = zEdge(x);
  if (zE < 0) continue;
  const { g } = at[zE][x];
  for (let k = 0; k < 2; k++) {
    const z = zE - k;
    if (!inside(x, z)) continue;
    for (let y = g + 3; y <= g + 3; y++) v.set(x, y, z, "polished_andesite");          // canopy over the recess
    if (Math.abs(x - x0) <= 1) {
      for (let y = g; y < g + 3; y++) if (!(x === x0 && k === 0 && y < g + 2)) v.set(x, y, z, "air");
    }
  }
  if (Math.abs(x - x0) === 2) v.set(x, g, zE, "light_blue_stained_glass");
}
{
  const zE = zEdge(x0), { g } = at[zE][x0];
  v.set(x0, g, zE, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  v.set(x0, g + 1, zE, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  v.set(x0, g + 2, zE - 1, "lantern", { hanging: "true" });
  for (const x of [x0 - 1, x0 + 1]) v.set(x, g, zE, "light_blue_stained_glass");
}

// Roof plant: small boxes on the wing's roof and on the tower's top tier, inside the footprint.
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const c = at[z][x];
  const plant = (c.H === 24 && x % 11 === 5 && z % 11 === 5) || (c.H === 96 && x % 13 === 6 && z % 13 === 6);
  if (!plant) continue;
  const block = [[0, 0], [1, 0], [0, 1], [1, 1]].every(([dx, dz]) => inside(x + dx, z + dz) && at[z + dz][x + dx].depth >= 3);
  if (!block) continue;
  for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) for (let y = c.H; y < c.H + 2; y++) v.set(x + dx, y, z + dz, "light_gray_concrete");
}

const counts = v.save(OUT);
console.log(`wrote ${OUT}: ${counts.blocks} blocks, palette ${counts.palette}`);
