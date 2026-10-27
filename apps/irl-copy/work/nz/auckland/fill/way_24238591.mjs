// Way 24238591: a 1930s reinforced-concrete commercial block in Auckland's cream plaster and granite-plinth idiom.
// Five storeys of 4 blocks over a ground floor shopfront, a stepped roofline read from the lidar (22 / 24 / 28), a
// glazed street front on the low north side, a solid concrete core (no rooms) with a 1-block air gap behind each window.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const N = 26, H = 40;
const cells = JSON.parse(readFileSync(`${DIR}/way_24238591.cells.json`, "utf8"));   // [x, z, ground, roof]

const inF = Array.from({ length: N }, () => Array(N).fill(false));
const rawG = Array.from({ length: N }, () => Array(N).fill(0));
const rawR = Array.from({ length: N }, () => Array(N).fill(0));
for (const [x, z, g, r] of cells) { inF[z][x] = true; rawG[z][x] = g; rawR[z][x] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < N && z < N && inF[z][x];

// median over the footprint (radius r): lidar noise becomes flat tiers and a smooth ground line
const med = (grid, x, z, r = 1) => {
  const v = [];
  for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) if (inside(x + dx, z + dz)) v.push(grid[z + dz][x + dx]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
// roof tiers: main 22 (five storeys + parapet), core 24, a 28 bay on the east edge
const tierOf = (m) => (m <= 22 ? 22 : m <= 25 ? 24 : 28);
const G = Array.from({ length: N }, () => Array(N).fill(0));
const T = Array.from({ length: N }, () => Array(N).fill(0));
for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) if (inF[z][x]) { G[z][x] = med(rawG, x, z); T[z][x] = tierOf(med(rawR, x, z, 2)); }

// exposed sides of a cell (outside the footprint, or beside a lower tier), outside sides first
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const exposed = (x, z) => DIRS.filter(([dx, dz]) => !inside(x + dx, z + dz) || T[z + dz][x + dx] < T[z][x])
  .sort((a, b) => (inside(x + a[0], z + a[1]) ? 1 : 0) - (inside(x + b[0], z + b[1]) ? 1 : 0));
// along a face the bay rhythm: piers every third cell, the last one a corner pier
const faceCoord = (dx, x, z) => (dx !== 0 ? z : x);
const isPier = (c) => c % 3 === 0 || c === N - 1;

const K = (x, y, z) => `${x},${y},${z}`;
const plan = new Map(), carve = new Set(), glow = new Map();
const put = (x, y, z, name, state) => plan.set(K(x, y, z), { x, y, z, name, state });

// the solid massing with its facade: every column is solid from y 0 to its tier, so nothing floats
for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
  if (!inF[z][x]) continue;
  const g = G[z][x], t = T[z][x], ex = exposed(x, z), ring = ex.length > 0;
  const [dx] = ex[0] ?? [0, 0];
  const pier = isPier(faceCoord(dx, x, z));
  for (let y = 0; y < t; y++) {
    if (!ring) { put(x, y, z, y === t - 1 ? "smooth_stone" : "stone"); continue; }
    if (y < g) put(x, y, z, "stone_bricks");
    else if (y === t - 1) put(x, y, z, "smooth_quartz");                   // coping
    else if (y === t - 2) put(x, y, z, "chiseled_quartz_block");           // cornice
    else if (y === g) put(x, y, z, "polished_granite");                    // base course
    else if (y % 4 === 0) put(x, y, z, "smooth_quartz");                   // storey string course
    else if (y % 4 === 3) put(x, y, z, "quartz_block");                    // spandrel
    else if (pier) put(x, y, z, "quartz_pillar", { axis: "y" });
    else put(x, y, z, y < 4 ? "glass" : "glass_pane");                     // shopfront glass / window glass
  }
  // air gap behind each window: one cell in from the face, bounded by the string courses
  if (ring && !pier) for (let y = g + 1; y < t - 2; y++) {
    if (y % 4 !== 1 && y % 4 !== 2) continue;
    const [ndx, ndz] = ex[0];
    const ix = x - ndx, iz = z - ndz;
    if (!inside(ix, iz)) continue;
    carve.add(K(ix, y, iz));
    if (y % 4 === 1 && y >= 5 && (x + z + y) % 7 === 0) glow.set(K(ix, y, iz), { x: ix, y, z: iz, name: "glowstone" });
  }
}

// the entrance: a lit street door on the lowest outward face, away from the corners
let door = null;
for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
  if (!inF[z][x]) continue;
  const ex = exposed(x, z), [dx, dz] = ex[0] ?? [0, 0];
  if (!ex.length || inside(x + dx, z + dz)) continue;
  const c = faceCoord(dx, x, z);
  if (isPier(c)) continue;
  const score = G[z][x] * 100 + Math.abs(c - 12.5);
  if (!door || score < door.score) door = { x, z, dx, dz, g: G[z][x], score };
}
const facing = door.dz === -1 ? "north" : door.dz === 1 ? "south" : door.dx === 1 ? "east" : "west";
for (let y = door.g; y < door.g + 3; y++) carve.add(K(door.x - door.dx, y, door.z - door.dz));
put(door.x, door.g + 2, door.z, "polished_granite");                    // lintel over the door
put(door.x, door.g, door.z, "iron_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
put(door.x, door.g + 1, door.z, "iron_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });

// a 3x3 interior square, all on one tier, not exposed: the penthouse; 2x2 interior squares: plant
const interiorSquare = (n, tier, used) => {
  let best = null;
  for (let z = 0; z + n <= N; z++) for (let x = 0; x + n <= N; x++) {
    let ok = true;
    for (let dz = 0; dz < n && ok; dz++) for (let dx = 0; dx < n && ok; dx++) {
      const X = x + dx, Z = z + dz;
      ok = inside(X, Z) && T[Z][X] === tier && exposed(X, Z).length === 0 && !used.has(K(X, 0, Z));
    }
    if (!ok) continue;
    const d = Math.hypot(x + (n - 1) / 2 - 12.5, z + (n - 1) / 2 - 12.5);
    if (!best || d < best.d) best = { x, z, d };
  }
  return best;
};
const used = new Set();
const pent = interiorSquare(3, 24, used) ?? interiorSquare(3, 22, used);
if (pent) {
  const t = T[pent.z + 1][pent.x + 1];
  for (let dz = 0; dz < 3; dz++) for (let dx = 0; dx < 3; dx++) used.add(K(pent.x + dx, 0, pent.z + dz));
  const X = pent.x, Z = pent.z;
  for (let y = t; y < t + 2; y++) for (let dz = 0; dz < 3; dz++) for (let dx = 0; dx < 3; dx++) {
    const edge = dx === 0 || dx === 2 || dz === 0 || dz === 2, mid = (dx === 1) !== (dz === 1);
    if (!edge) continue;
    put(X + dx, y, Z + dz, mid ? "glass_pane" : "smooth_quartz");
  }
  for (let dz = 0; dz < 3; dz++) for (let dx = 0; dx < 3; dx++) put(X + dx, t + 2, Z + dz, "smooth_quartz");
}
for (let i = 0; i < 2; i++) {
  const plant = interiorSquare(2, 22, used);
  if (!plant) break;
  for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 2; dx++) {
    used.add(K(plant.x + dx, 0, plant.z + dz));
    put(plant.x + dx, 22, plant.z + dz, "iron_block");
  }
}

const g = new Voxels([N, H, N]);
for (const p of plan.values()) if (!carve.has(K(p.x, p.y, p.z))) g.set(p.x, p.y, p.z, p.name, p.state);
for (const p of glow.values()) g.set(p.x, p.y, p.z, p.name);
const out = `${DIR}/way_24238591.nbt`;
const stats = g.save(out);
console.log(`way_24238591: ${stats.blocks} blocks, ${stats.palette} palette entries, door ${facing} at x${door.x} z${door.z} y${door.g}, ` +
  `tiers 22/24/28 ${pent ? "penthouse at x" + pent.x + " z" + pent.z : "no penthouse"} -> ${out}`);
