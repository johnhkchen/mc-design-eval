// Toi o Tāmaki / Auckland Art Gallery (way 154430110), Wellesley Street, Auckland CBD.
// Massing from the lidar roof record: each cell's roof is median-smoothed over its 5x5 footprint neighbourhood and
// quantised to 5-block storey lines. A stone plinth runs from the street up to the ground-floor line (10 on the low
// side, the next line above the ground on the slope), so the downhill side shows extra storeys. Above it, cream
// plaster-and-stone classical storeys with a pier-and-window rhythm and a glazed ground floor; the highest tier is a
// lighter concrete volume. Every storey has a floor slab (solid across the footprint), the interiors are air behind the
// glass, and every wall and tier stands on the slab beneath it. A parapet caps each roof edge; a stone porch with a
// canopy, lanterns and stepped approach marks the entrance on the lowest street face.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_154430110.cells.json", "utf8"));
const grid = new Map();
for (const [x, z, ground, roof] of cells) grid.set(`${x},${z}`, { x, z, g: ground, r: roof });
const at = (x, z) => grid.get(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const median = (a) => { a.sort((p, q) => p - q); return a[a.length >> 1]; };

const FOUND = "stone_bricks", SLAB = "smooth_stone", FRAME = "polished_andesite", PIER = "quartz_block";
const UPPER_TIER = 35;

// ---- massing: one column per footprint cell -------------------------------------------------------------------------
for (const c of grid.values()) {
  const vals = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) { const n = at(c.x + dx, c.z + dz); if (n) vals.push(n.r); }
  c.P = c.g <= 10 ? 10 : 5 * Math.floor(c.g / 5) + 5;   // ground-floor line: the plinth top
  c.T = Math.max(5 * Math.round(median(vals) / 5), c.P + 5);   // roof slab on a storey line, at least one storey up
}
const Tmax = Math.max(...[...grid.values()].map((c) => c.T));

// a face is exterior where there is no footprint cell, or where the neighbour's roof is below this height
const exposed = (c, y) => DIRS.filter(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || y > n.T; });
const outward = (c, y) => { const d = exposed(c, y); return d.find(([dx, dz]) => !at(c.x + dx, c.z + dz)) ?? d[0]; };

// ---- entrance: the lowest exterior face, two cells wide, with a short stepped approach -------------------------------
const cx = [...grid.values()].reduce((s, c) => s + c.x, 0) / grid.size, cz = [...grid.values()].reduce((s, c) => s + c.z, 0) / grid.size;
const alongOf = (d) => (d[0] !== 0 ? [0, 1] : [1, 0]);
const clearOut = (x, z, d) => { for (let j = 1; j <= 4; j++) for (let u = -2; u <= 3; u++) {
  const [ax, az] = alongOf(d); const px = x + d[0] * j + ax * u, pz = z + d[1] * j + az * u;
  if (at(px, pz)) return false; } return true; };
let door = null;
for (const c of grid.values()) for (const d of DIRS) {
  if (at(c.x + d[0], c.z + d[1])) continue;
  const steps = c.P + 1 - c.g; if (steps < 1 || steps > 6 || !clearOut(c.x, c.z, d)) continue;
  const [ax, az] = alongOf(d);
  const other = [c.x + ax, c.z + az], otherB = [c.x - ax, c.z - az];
  const faceOut = (p) => { const n = at(p[0], p[1]); return n && n.P === c.P && !at(p[0] + d[0], p[1] + d[1]); };
  const pair = faceOut(other) ? [[c.x, c.z], other] : faceOut(otherB) ? [[c.x, c.z], otherB] : null;
  if (!pair) continue;
  const score = steps + 0.001 * Math.hypot(c.x - cx, c.z - cz);
  if (!door || score < door.score) door = { score, d, cells: pair.map(([x, z]) => ({ x, z, g: at(x, z).g })), P: c.P, F: c.P + 1 };
}
const doorKeys = new Set(door.cells.map((c) => `${c.x},${c.z}`));
const doorBlock = (half) => ["dark_oak_door", { facing: FACING[door.d.join(",")], half, hinge: "left", open: "false", powered: "false" }];

// ---- the building ----------------------------------------------------------------------------------------------------
const v = new Voxels([76, 52, 121]);
const glow = [];
const tiers = {};
for (const c of grid.values()) {
  const { x, z, P, T } = c;
  for (let y = 0; y < P; y++) v.set(x, y, z, FOUND);                    // foundation and plinth
  for (let y = P; y <= T; y++) {
    if (y % 5 === 0) { v.set(x, y, z, SLAB); continue; }                // floor slab / string course per storey
    const dirs = exposed(c, y);
    if (!dirs.length) continue;                                          // interior air
    const d = outward(c, y), r = y % 5, L = y - r, u = d[0] !== 0 ? z : x;
    if (doorKeys.has(`${x},${z}`) && d.join() === door.d.join() && (y === P + 1 || y === P + 2)) {
      const [name, st] = doorBlock(y === P + 1 ? "lower" : "upper");
      v.set(x, y, z, name, st); continue;
    }
    const pier = ((u % 5) + 5) % 5 === 0;
    const mat = T >= UPPER_TIER ? "light_gray_concrete" : PIER;
    if (pier) v.set(x, y, z, mat);
    else if (L === P) v.set(x, y, z, r === 4 ? FOUND : "glass");          // glazed ground floor, stone lintel
    else if (r === 1 || r === 4) v.set(x, y, z, FRAME);                  // sill and head of each window
    else v.set(x, y, z, "glass");
    const lamp = (u % 10 === 2 && (L / 5) % 2 === 0) || (u % 10 === 7 && (L / 5) % 2 === 1);
    if (r === 2 && !pier && lamp) glow.push([x - d[0], y, z - d[1]]);     // warm lamp in the room behind the glass
  }
  if (exposed(c, T + 1).length) v.set(x, T + 1, z, FOUND);               // parapet on every edge that is not a higher tier
  else if (T === Tmax && x % 11 === 5 && z % 11 === 5) {                  // roof plant on the top tier
    v.set(x, T + 1, z, "light_gray_concrete"); v.set(x, T + 2, z, "light_gray_concrete");
  }
  tiers[T] = (tiers[T] || 0) + 1;
}
for (const [x, y, z] of glow) if (!v.get(x, y, z)) v.set(x, y, z, "glowstone");

// ---- entrance: stepped stone approach, a porch canopy on posts, hanging lanterns --------------------------------------
{
  const [dx, dz] = door.d, F = door.F;
  const fx = door.cells[0].x, fz = door.cells[0].z;
  const u0 = dz !== 0 ? Math.min(door.cells[0].x, door.cells[1].x) : Math.min(door.cells[0].z, door.cells[1].z);
  const at2 = (u, j) => (dz !== 0 ? [u, fz + dz * j] : [fx + dx * j, u]);
  for (const c of door.cells) for (let j = 1; j <= door.F - c.g; j++) {
    const [sx, sz] = dz !== 0 ? [c.x, c.z + dz * j] : [c.x + dx * j, c.z];
    const sy = F - j;
    for (let y = c.g; y < sy; y++) v.set(sx, y, sz, FOUND);
    v.set(sx, sy, sz, "stone_brick_stairs", { facing: FACING[door.d.join(",")], half: "bottom", shape: "straight", waterlogged: "false" });
  }
  for (let j = 1; j <= 2; j++) for (let u = u0 - 1; u <= u0 + 2; u++) {
    const [px, pz] = at2(u, j);
    v.set(px, F + 2, pz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
  for (const u of [u0 - 1, u0 + 2]) {
    const [px, pz] = at2(u, 2);
    for (let y = door.cells[0].g; y < F + 2; y++) v.set(px, y, pz, FOUND);
  }
  for (const u of [u0, u0 + 1]) {
    const [lx, lz] = at2(u, 1);
    v.set(lx, F + 1, lz, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

const stats = v.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_154430110.nbt");
console.log("entrance", door.d, door.cells.map((c) => [c.x, c.z, c.g]), "plinth top", door.P, "floor", door.F);
console.log("roof tiers", JSON.stringify(tiers), "glow", glow.length);
console.log("saved", stats);
