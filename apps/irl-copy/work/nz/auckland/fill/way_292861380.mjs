// Landmark House, Auckland (OSM way 292861380): a 1980s glass-and-concrete office block on a basalt plinth.
// Footprint 40 x 32 blocks; the lidar roof is quantised to four setback tiers (36 / 40 / 44 / 48) on the 4-block storey
// grid, so every slab and tier stands on the course below. Facade = the perimeter voxels (piers, spandrels, tinted
// glass), interior = air with a floor slab per storey. z = 0 is the -z (north) face, where the entrance is.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_292861380.cells.json`, "utf8"));
const g = new Voxels([40, 61, 32]);

// ---- footprint and massing ------------------------------------------------------------------------------------------
const foot = new Map();
for (const [x, z, ground, roof] of cells) foot.set(`${x},${z}`, { x, z, ground, roof });
const cellAt = (x, z) => foot.get(`${x},${z}`);
const NEIGH = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// lidar roof -> 3x3 median (in-footprint), then nearest setback tier (multiples of the 4-block storey)
const TIER_LIMITS = [[38, 36], [42, 40], [45, 44], [Infinity, 48]];
const tierOf = (r) => TIER_LIMITS.find(([lim]) => r <= lim)[1];
const neighbourhood = (x, z) => { const out = []; for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const c = cellAt(x + dx, z + dz); if (c) out.push(c); } return out; };
for (const c of foot.values()) {
  const rs = neighbourhood(c.x, c.z).map((n) => n.roof).sort((a, b) => a - b);
  c.top = tierOf(rs[rs.length >> 1]);
}
// one majority pass on the tiers so no single cell pokes out of its tier
for (const c of foot.values()) {
  const count = new Map();
  for (const n of neighbourhood(c.x, c.z)) count.set(n.top, (count.get(n.top) ?? 0) + 1);
  let best = c.top, bestN = count.get(c.top) ?? 0;
  for (const [t, n] of count) if (n > bestN) { best = t; bestN = n; }
  c.top = best;
}

// a wall voxel at height y is exposed to a side if the neighbour there is outside the footprint or its roof is below y
const exposed = (x, z, y) => NEIGH.filter(([dx, dz]) => { const n = cellAt(x + dx, z + dz); return !n || n.top < y; });
const edgeOfTier = (c) => NEIGH.filter(([dx, dz]) => { const n = cellAt(c.x + dx, c.z + dz); return !n || n.top < c.top; });

// ---- foundation, slabs, walls, roofs ----------------------------------------------------------------------------------
const FLOOR = 2;     // ground floor starts on the plinth top; the plinth (y 0-1) is the foundation under every cell
const SLAB = (y) => y >= 8 && y % 4 === 0;   // first floor and every storey line above it

for (const c of foot.values()) {
  const { x, z, top } = c;
  for (let y = 0; y < FLOOR; y++) g.set(x, y, z, "polished_blackstone_bricks");

  for (let y = FLOOR; y <= top; y++) {
    if (y === top) { g.set(x, y, z, "gray_concrete"); continue; }                      // roof surface
    const ex = exposed(x, z, y);
    if (SLAB(y)) { g.set(x, y, z, ex.length ? "smooth_quartz" : "smooth_stone"); continue; }   // floor slab / storey line
    if (!ex.length) continue;                                                            // interior air

    const xFace = ex.find(([dx]) => dx), zFace = ex.find(([, dz]) => dz);
    const pier = (xFace && zFace) || ((xFace ? z : x) % 3 === 0);                        // corners and every third bay
    if (y < 8) {                                                                          // shopfront storey, y 2-7
      if (y === 7) g.set(x, y, z, "smooth_quartz");
      else if (y === 6) g.set(x, y, z, "polished_blackstone_bricks");
      else g.set(x, y, z, pier ? "white_concrete" : "light_blue_stained_glass");
      continue;
    }
    if (pier) g.set(x, y, z, "white_concrete");
    else if (y % 4 === 1) g.set(x, y, z, "light_gray_concrete");                         // spandrel under each window band
    else g.set(x, y, z, "light_blue_stained_glass");
  }

  // parapet / cornice on the roof edges that face outside or drop to a lower tier
  if (edgeOfTier(c).length) g.set(x, top + 1, z, "smooth_quartz");
}

// ---- warm lights: some upper windows get a glowstone standing on the floor behind the glass -----------------------
for (const c of foot.values()) {
  for (let y = 8; y <= c.top; y++) {
    if (!SLAB(y - 2) || y % 4 !== 2 || y >= c.top) continue;
    const ex = exposed(c.x, c.z, y);
    if (!ex.length) continue;
    const xFace = ex.find(([dx]) => dx), zFace = ex.find(([, dz]) => dz);
    if (xFace && zFace) continue;
    const bay = xFace ? c.z : c.x;
    if (bay % 3 === 0 || bay % 4 !== 1) continue;
    const [dx, dz] = xFace ?? zFace;
    const ix = c.x - dx, iz = c.z - dz, inner = cellAt(ix, iz);
    if (!inner || inner.top < y || exposed(ix, iz, y - 1).length) continue;
    g.set(ix, y - 1, iz, y % 8 === 2 ? "glowstone" : "shroomlight");
  }
}

// ---- entrance: iron-framed door on the north (-z) face, canopy over it, lantern just inside ---------------------------
const northFace = [...foot.values()].filter((c) => !cellAt(c.x, c.z - 1));
const door = northFace.reduce((a, b) => (Math.abs(b.x - 20) < Math.abs(a.x - 20) ? b : a));
const DOOR_STATE = { facing: "north", hinge: "left", open: "false", powered: "false" };
g.set(door.x, FLOOR, door.z, "iron_door", { ...DOOR_STATE, half: "lower" });
g.set(door.x, FLOOR + 1, door.z, "iron_door", { ...DOOR_STATE, half: "upper" });
for (const dx of [-2, -1, 1, 2]) {
  const c = cellAt(door.x + dx, door.z);
  if (c && !cellAt(door.x + dx, door.z - 1)) g.set(door.x + dx, 6, door.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}
g.set(door.x, 6, door.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
g.set(door.x, FLOOR, door.z + 1, "lantern", { hanging: "false", waterlogged: "false" });

// ---- roof plant: a lift-core penthouse on the 44 tier (capped at the 48 roof line), and plant boxes on the 40 tier ------
const tier44 = [...foot.values()].filter((c) => c.top === 44);
const centre = [19.5, 17.5];
let core = null;
for (const c of tier44) {                                                  // a 4 x 4 core with a one-cell margin of tier 44 or taller
  const ok = [];
  for (let dx = -1; dx <= 4; dx++) for (let dz = -1; dz <= 4; dz++) ok.push((cellAt(c.x + dx, c.z + dz)?.top ?? 0) >= 44);
  if (!ok.every(Boolean)) continue;
  if (!core || Math.hypot(c.x - centre[0], c.z - centre[1]) < Math.hypot(core.x - centre[0], core.z - centre[1])) core = c;
}
if (core) {
  for (let dx = 0; dx < 4; dx++) for (let dz = 0; dz < 4; dz++) {
    const x = core.x + dx, z = core.z + dz, edge = dx === 0 || dz === 0 || dx === 3 || dz === 3;
    for (let y = 45; y <= 47; y++) g.set(x, y, z, edge && y === 46 ? "light_blue_stained_glass" : "white_concrete");
    g.set(x, 48, z, "smooth_quartz");
  }
}
for (const c of foot.values()) {
  if (c.top !== 40) continue;
  const block = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([a, b]) => cellAt(c.x + a, c.z + b));
  if (block.some((n) => !n || n.top !== 40 || exposed(n.x, n.z, 41).length)) continue;
  if (c.x % 9 !== 3 || c.z % 9 !== 3) continue;
  for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]]) for (const y of [41, 42]) g.set(c.x + a, y, c.z + b, "light_gray_concrete");
}

const info = g.save(`${DIR}/way_292861380.nbt`);
console.log(JSON.stringify({ door: [door.x, door.z], core: core && [core.x, core.z], ...info }));
