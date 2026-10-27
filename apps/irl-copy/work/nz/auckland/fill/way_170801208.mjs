// Faradays: a 1980s precast-and-tinted-glass office block, twelve storeys on a stepped plan. The lidar roof sets each
// cell's top (36 at the wings, 52 at the core); the outer ring steps back a storey per cell inward, so the mass reads as
// tiers from the air. Every column stands from y 0 (foundation), the ring is the facade (glass in white precast, piers
// on a 3-block bay), the cell behind the ring is an air gap with a floor slab per storey, and the rest is solid core.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_170801208.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..66, z 0..55

const W = 67, D = 56, H = 65;
const M = {
  found: "stone_bricks", base: "polished_andesite", body: "white_concrete", pier: "light_gray_concrete",
  string: "smooth_stone", glass: "light_blue_stained_glass", cornice: "smooth_stone", parapet: "light_gray_concrete",
  roof: "gray_concrete", slab: "light_gray_concrete", core: "stone", plant: "light_gray_concrete", light: "glowstone",
};
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const K8 = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
const STOREY = 4, GROUND_TOP = 8;                                    // a double-height shopfront below y 8, then storeys every 4

// the footprint: one record per cell, keyed by x,z
const cell = new Map();
for (const [x, z, g, r] of cells) cell.set(`${x},${z}`, { x, z, g, r });
const at = (x, z) => cell.get(`${x},${z}`);

// lidar roof, smoothed over a 5 x 5 neighbourhood (its 80th percentile, so the core keeps the lidar's crown at about 52
// rather than settling at the median's 48), then quantised to whole storeys (flat tiers)
for (const c of cell.values()) {
  const vals = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const n = at(c.x + dx, c.z + dz); if (n) vals.push(n.r); }
  vals.sort((a, b) => a - b);
  c.med = vals[Math.floor(vals.length * 0.8)];
}

// distance in cells to the outside (8-neighbour), so the ring is every cell touching the edge
const q = [];
for (const c of cell.values()) { c.d = 0; if (K8.some(([dx, dz]) => !at(c.x + dx, c.z + dz))) { c.d = 1; q.push(c); } }
for (let i = 0; i < q.length; i++) { const c = q[i]; for (const [dx, dz] of K8) { const n = at(c.x + dx, c.z + dz); if (n && !n.d) { n.d = c.d + 1; q.push(n); } } }

// top per cell: the quantised lidar roof, capped by setbacks (36 at the ring, +4 per cell inward, 52 at the core)
for (const c of cell.values()) {
  const lidar = Math.min(52, Math.max(c.g + STOREY, Math.round(c.med / STOREY) * STOREY));
  const cap = Math.min(52, 36 + STOREY * (c.d - 1));
  c.top = Math.max(c.g + STOREY, Math.min(lidar, cap));
}

// a face is open at height y when its neighbour is outside the footprint or its top is below y
const openDirs = (c, y) => Object.entries(DIRS).filter(([, [dx, dz]]) => { const n = at(c.x + dx, c.z + dz); return !n || n.top <= y; }).map(([k]) => k);

// the entrance: the ring cell with the lowest ground on a single (not corner) face
let ent = null;
for (const c of cell.values()) {
  if (c.d !== 1) continue;
  const dirs = openDirs(c, c.g);
  if (dirs.length === 1 && (!ent || c.g < ent.c.g)) ent = { c, face: dirs[0] };
}
const entAlong = ent && (ent.face === "north" || ent.face === "south" ? ent.c.x : ent.c.z);

const g3 = new Voxels([W, H, D]);
const bay = (face, c) => (face === "north" || face === "south" ? c.x : c.z);
const hash = (x, y, z) => (x * 31 + z * 17 + y * 7) % 7;
let lights = 0, porch = null;

for (const c of cell.values()) {
  const { g, top: T } = c;
  for (let y = 0; y < T; y++) {
    if (y < g) { g3.set(c.x, y, c.z, M.found); continue; }                       // foundation to the lowest ground under the cell
    const dirs = openDirs(c, y);
    if (y === T - 1) { g3.set(c.x, y, c.z, c.d === 1 ? M.cornice : M.roof); continue; }   // roof surface, the ring's cornice
    if (dirs.length === 0) {                                                      // enclosed: solid core, or the air gap behind the ring's glass
      if (c.d >= 3) g3.set(c.x, y, c.z, M.core);
      else if (y >= GROUND_TOP && y % STOREY === 0) g3.set(c.x, y, c.z, M.slab);  // a floor slab per storey
      continue;
    }
    // exposed: the facade (the ring, and the riser of a setback where the neighbour below is lower)
    // a diagonal edge opens two ways on every stair step, so the first open face carries the bay rhythm there too
    const face = dirs[0];
    const along = bay(face, c), pier = along % 3 === 0;
    const isEnt = ent && c === ent.c;
    const nearEnt = ent && face === ent.face && Math.abs(along - entAlong) === 1 && c.d === 1 && y < g + 3;
    let b;
    if (isEnt && y === g) b = { block: "dark_oak_door", state: { facing: face, half: "lower", hinge: "left", open: "false", powered: "false" } };
    else if (isEnt && y === g + 1) b = { block: "dark_oak_door", state: { facing: face, half: "upper", hinge: "left", open: "false", powered: "false" } };
    else if (isEnt && y === g + 2) b = { block: M.body };
    else if (y === g) b = { block: M.base };
    else if (y < GROUND_TOP) b = { block: y === GROUND_TOP - 1 ? M.body : pier || nearEnt ? M.pier : M.glass };
    else if (y % STOREY === 0) b = { block: M.string };
    else if (y % STOREY === 3) b = { block: M.body };
    else b = { block: pier ? M.pier : M.glass };
    if (b.block === M.glass && c.d === 1 && hash(c.x, y, c.z) === 0) {            // some windows lit, behind the glass
      const [dx, dz] = DIRS[face], n = at(c.x - dx, c.z - dz);
      if (n && n.d === 2 && n.top > y) { g3.set(n.x, y, n.z, M.light); lights++; }
    }
    if (isEnt && y === g) porch = { x: c.x, z: c.z, face, g };
    g3.set(c.x, y, c.z, b.block, b.state);
  }
  if (c.d === 1) g3.set(c.x, T, c.z, M.parapet);                                  // the parapet stands on the cornice
}

// the lobby lantern in the entrance's air gap, on the foundation
if (porch) {
  const [dx, dz] = DIRS[porch.face], n = at(porch.x - dx, porch.z - dz);
  if (n) g3.set(n.x, porch.g, n.z, "lantern", { hanging: "false", waterlogged: "false" });
}

// roof plant: a 5 x 5 box two blocks high on the core's top (the tallest, most inward cell), standing on the roof surface
const topMax = Math.max(...[...cell.values()].map((c) => c.top));
let best = null;
for (const c of cell.values()) if (c.top === topMax && (!best || c.d > best.d)) best = c;
let plant = 0;
if (best) for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
  const n = at(best.x + dx, best.z + dz);
  if (n && n.top === topMax && n.d >= 3) { g3.set(n.x, topMax, n.z, M.plant); g3.set(n.x, topMax + 1, n.z, M.plant); plant++; }
}

g3.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_170801208.nbt");
console.log(JSON.stringify({ cells: cell.size, lights, plant, entrance: ent && { x: ent.c.x, z: ent.c.z, face: ent.face, g: ent.c.g } }));
