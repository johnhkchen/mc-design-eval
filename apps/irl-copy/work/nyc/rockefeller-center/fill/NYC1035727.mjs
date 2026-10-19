// 512 Madison Avenue, 1982 commercial and office building: an early-1980s glass-and-granite office tower. Footprint 65 x 51
// (x across the block, low x = the Madison Avenue frontage, where the lobby is at the middle of the face). Lidar roof is
// read as clean tiers: the roof is median-smoothed and rounded to 3-block storeys, so a 9-block podium rises to a
// 21-30-39 setback stack and a 147-153-159 tower block with a penthouse on top. Each column is solid from y 0 up to its
// own top, so every tier stands on the one below and nothing hangs. Facade: polished granite base course and ground-floor
// shopfronts, light-grey spandrels at each storey line, blue glass between iron mullions, a granite cornice on every tier.
// The glass is one block out from a solid core with an air gap behind it and a floor slab in each storey (no interiors).
// Warm glowstone sits behind some panes, and the roofs carry equipment boxes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035727.cells.json`, "utf8"));
const X = 65, Y = 172, Z = 51;
const MAX_ROOF = 159;                         // 53 storeys of 3 blocks; the lidar's 160 rounded to a storey line

const key = (x, z) => `${x},${z}`;
const foot = new Map();
for (const [x, z, g, r] of cells) foot.set(key(x, z), { x, z, g, r, building: r >= 6, H: 0, top: 0 });

// Lidar roof -> storey heights, then a 3x3 median so the tiers come out flat (ground-level cells count as 0).
const q = (r) => Math.round(r / 3) * 3;
for (const c of foot.values()) c.H0 = c.building ? q(c.r) : 0;
for (const c of foot.values()) {
  if (!c.building) continue;
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = foot.get(key(c.x + dx, c.z + dz)); if (n) vals.push(n.H0); }
  vals.sort((a, b) => a - b);
  c.H = Math.min(MAX_ROOF, Math.max(9, vals[Math.floor(vals.length / 2)], c.g + 3));
}
for (const c of foot.values()) c.top = c.building ? c.H : c.g;

const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// Open at height y: outside the footprint, or the neighbour's top is at or below y.
const open = (x, z, y) => { const n = foot.get(key(x, z)); return !n || n.top <= y; };
// Facade: a building cell under its top with an open side at this height.
const perimeter = (x, z, y) => {
  const c = foot.get(key(x, z));
  return !!c && c.building && y < c.H && NB.some(([dx, dz]) => open(x + dx, z + dz, y));
};
// Air gap: inside the facade ring, next to it.
const gap = (x, z, y) => {
  const c = foot.get(key(x, z));
  return !!c && c.building && y < c.H && !perimeter(x, z, y) && NB.some(([dx, dz]) => perimeter(x + dx, z + dz, y));
};
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

const g = new Voxels([X, Y, Z]);
const ENTRANCE_Z = 25;                        // the lobby sits at the middle of the Madison Avenue face (x = 0)
const DOOR = { facing: "west", hinge: "left", open: "false", powered: "false" };

// Ground and foundations, then each column's building from its ground up to its own top.
for (const c of foot.values()) {
  const { x, z } = c;
  if (!c.building) {
    for (let y = 0; y < c.g - 1; y++) g.set(x, y, z, "stone");
    if (c.g >= 1) g.set(x, c.g - 1, z, "smooth_stone");            // paved ground
    continue;
  }
  for (let y = 0; y < c.g; y++) g.set(x, y, z, "stone");
  for (let y = c.g; y < c.H; y++) {
    const per = perimeter(x, z, y);
    if (per) {
      const along = x === 0 || x === X - 1 ? z : x;                // position along the face, for the mullion grid
      if (y === c.H - 1) g.set(x, y, z, "polished_granite");       // cornice on every tier
      else if (y === c.g) g.set(x, y, z, "polished_granite");      // base course
      else if (y % 3 === 0) g.set(x, y, z, "light_gray_concrete"); // storey-line spandrel
      else if (y < c.g + 3) g.set(x, y, z, along % 3 === 0 ? "polished_granite" : "light_blue_stained_glass"); // shopfront
      else g.set(x, y, z, along % 3 === 0 ? "iron_block" : "light_blue_stained_glass");                         // tower glass
    } else if (y === c.H - 1) {
      g.set(x, y, z, "smooth_stone");                              // roof
    } else if (gap(x, z, y)) {
      if (y % 3 === 0) g.set(x, y, z, "light_gray_concrete");      // floor slab across the gap
      else if (y > c.g && hash(x, y, z) % 10 === 0) g.set(x, y, z, "glowstone");   // warm light behind a pane
    } else {
      g.set(x, y, z, "stone");                                     // solid core
    }
  }
}

// Lobby: granite pillars either side of the glass, the door in the middle, a granite canopy over the entrance.
for (const c of foot.values()) {
  if (c.x !== 0 || !c.building) continue;
  const dz = Math.abs(c.z - ENTRANCE_Z);
  if (dz > 2) continue;
  for (const y of [c.g + 1, c.g + 2]) {
    if (dz === 2) g.set(0, y, c.z, "polished_granite");
    else if (dz === 0) g.set(0, y, c.z, "dark_oak_door", { ...DOOR, half: y === c.g + 1 ? "lower" : "upper" });
    else g.set(0, y, c.z, "light_blue_stained_glass");
  }
}
for (let z = ENTRANCE_Z - 3; z <= ENTRANCE_Z + 3; z++) {
  const c = foot.get(key(0, z));
  if (!c || !c.building) continue;
  for (let x = 0; x <= 2; x++) g.set(x, c.g + 3, z, "polished_granite");
}

// Roof equipment on the lower tiers, and a penthouse on the tower's top tier.
for (const c of foot.values()) {
  if (!c.building || c.H >= MAX_ROOF) continue;
  if (gap(c.x, c.z, c.H - 1) || perimeter(c.x, c.z, c.H - 1)) continue;
  if ((c.x * 5 + c.z * 3) % 13 !== 0) continue;
  g.set(c.x, c.H, c.z, "light_gray_concrete");
  g.set(c.x, c.H + 1, c.z, "light_gray_concrete");
  g.set(c.x, c.H + 2, c.z, "polished_granite");                       // flat cap: no stray spikes on the roofs
}
const crown = [...foot.values()].filter((c) => c.building && c.H === MAX_ROOF);
const inset = { x0: Math.min(...crown.map((c) => c.x)) + 6, x1: Math.max(...crown.map((c) => c.x)) - 6,
  z0: Math.min(...crown.map((c) => c.z)) + 6, z1: Math.max(...crown.map((c) => c.z)) - 6 };
for (let x = inset.x0; x <= inset.x1; x++) for (let z = inset.z0; z <= inset.z1; z++) {
  const c = foot.get(key(x, z));
  if (!c || !c.building || c.H !== MAX_ROOF) continue;
  const ring = x === inset.x0 || x === inset.x1 || z === inset.z0 || z === inset.z1;
  for (let k = 0; k < 5; k++) {
    const y = MAX_ROOF + k;
    let b = "stone";
    if (k === 4) b = "smooth_stone";
    else if (ring) b = k === 0 ? "polished_granite" : k === 3 ? "polished_granite" : k === 1 || k === 2 ? "light_blue_stained_glass" : "light_gray_concrete";
    else if (k === 3) b = "light_gray_concrete";
    g.set(x, y, z, b);
  }
}

const stats = g.save(`${DIR}/NYC1035727.nbt`);
console.log(JSON.stringify({ ...stats, tallest: MAX_ROOF + 5, cells: cells.length }));
