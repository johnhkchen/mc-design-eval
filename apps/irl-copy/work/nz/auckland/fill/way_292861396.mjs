// Windsor House, Auckland (Eden Terrace side of the CBD): a 1960s-70s concrete-framed office block, a ground
// storey of glass and a 10-storey slab that steps up to a 17-storey core. Massing is the lidar roof, median-filtered
// over 3x3 and snapped to 4-block storeys (floors at y = 4k, so every tier stands on the one below). Structure is solid
// from y 0 to each tier (foundation included); the facade is precast spandrels, mullions and tinted glass, each window
// is a one-block air pocket behind the glass with a floor slab above and below, and a few pockets hold glowstone.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292861396.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292861396.nbt";
const X = 69, Z = 31, Y = 81;

const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inF = (x, z) => F.has(key(x, z));

// roof: 5x5 median over footprint neighbours (kills lidar spikes and thin noisy ridges), then one tier per cell
const median = (x, z) => {
  const v = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const c = F.get(key(x + dx, z + dz)); if (c) v.push(c.r); }
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
// tiers: <= 4 blocks is a low terrace deck (solid to y 2); otherwise whole storeys, top = 4 x storeys
const tierOf = (rs) => (rs <= 4 ? 2 : Math.max(4, 4 * Math.round(rs / 4)));
const TOP = new Map();
for (const [x, z] of cells.map(([x, z]) => [x, z])) TOP.set(key(x, z), tierOf(median(x, z)));
// a tier of a dozen cells or fewer is a lidar ridge, not a building part: it drops a storey until it joins a tier
for (let pass = 0; pass < 8; pass++) {
  const n = new Map(); for (const t of TOP.values()) n.set(t, (n.get(t) || 0) + 1);
  for (const [k, t] of TOP) if (t > 4 && n.get(t) <= 12) TOP.set(k, t - 4);
}
const topAt = (x, z) => TOP.get(key(x, z)) ?? -1;
const maxT = Math.max(...TOP.values());

const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
const FACING = { N: "north", S: "south", E: "east", W: "west" };
// the faces a cell shows: outside the footprint, or onto a lower tier (from that tier's top up to its own)
const exposed = (x, z, T) => Object.entries(DIRS).map(([d, [dx, dz]]) => {
  const nT = topAt(x + dx, z + dz);
  return nT < T ? { d, lo: Math.max(0, nT) } : null;
}).filter(Boolean);
const isEdge = (x, z) => exposed(x, z, topAt(x, z)).length > 0;

// the entrance: the face with the most ground-storey frontage, its middle cell
const frontage = { N: [], S: [], E: [], W: [] };
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const T = topAt(x, z); if (T < 4) continue;
  for (const e of exposed(x, z, T)) if (e.lo <= 1) frontage[e.d].push(e.d === "N" || e.d === "S" ? x : z);
}
const doorFace = Object.keys(frontage).sort((a, b) => frontage[b].length - frontage[a].length)[0];
const doorS = frontage[doorFace].sort((a, b) => a - b)[frontage[doorFace].length >> 1];
const door = { d: doorFace, s: doorS };

const g = new Voxels([X, Y, Z]);

// 1. massing: solid from y 0 up to each tier (foundation and all), the roof deck on top
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const T = topAt(x, z);
  for (let y = 0; y < T; y++) g.set(x, y, z, "light_gray_concrete");
  g.set(x, T - 1, z, T === 2 ? "smooth_stone" : "gray_concrete");   // roof deck (terrace paving on the low wings)
}

// 2. facade: rows of a storey: 0 spandrel (base course on the ground storey), 1-2 window bays, 3 cornice band
const facadeAt = (x, z, d, y, T) => {
  const k = Math.floor(y / 4), row = y % 4, s = d === "N" || d === "S" ? x : z;
  if (T === 2 || (k === 0 && row === 0)) return ["polished_andesite"];
  if (row === 0) return ["light_gray_concrete"];
  if (row === 3) return ["white_concrete"];
  if (k === 0 && d === door.d && s === door.s) {
    return ["dark_oak_door", { facing: FACING[d], half: row === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
  }
  if (k === 0 && d === door.d && Math.abs(s - door.s) === 1) return ["polished_andesite"];
  if (s % 6 === 0) return ["white_concrete"];        // structural piers every 6 cells
  if (s % 3 === 0) return ["gray_concrete"];         // window mullions
  return ["light_blue_stained_glass", "glass"];
};

const pockets = [];
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const T = topAt(x, z);
  for (const e of exposed(x, z, T)) {
    const [dx, dz] = DIRS[e.d];
    for (let y = e.lo; y < T; y++) {
      const [block, state] = facadeAt(x, z, e.d, y, T);
      g.set(x, y, z, block, state);
      if (block === "light_blue_stained_glass" && (y % 4 === 1 || y % 4 === 2)) pockets.push([x - dx, z - dz, y]);
    }
  }
}

// 3. air gap behind each window (interior cells only), a glowstone in some of them, warm at dusk
const lit = (x, y, z) => (x * 31 + z * 17 + y * 7) % 5 === 0;
for (const [px, pz, y] of pockets) {
  if (!inF(px, pz) || isEdge(px, pz) || y >= topAt(px, pz)) continue;
  if (y % 4 === 1 && lit(px, y, pz) && y >= 4) g.set(px, y, pz, "glowstone");
  else g.set(px, y, pz, "air");
}

// 4. roof plant: one lift and stair penthouse, 3 x 3, on the top tier (replaces the 1-cell masts that read as stray posts)
const top = cells.map(([x, z]) => [x, z]).filter(([x, z]) => topAt(x, z) === maxT);
const cx = Math.round(top.reduce((n, [x]) => n + x, 0) / top.length), cz = Math.round(top.reduce((n, [, z]) => n + z, 0) / top.length);
for (let z = cz - 1; z <= cz + 1; z++) for (let x = cx - 1; x <= cx + 1; x++) {
  if (topAt(x, z) !== maxT || isEdge(x, z)) continue;
  g.set(x, maxT, z, "light_gray_concrete");
  g.set(x, maxT + 1, z, "light_gray_concrete");
  g.set(x, maxT + 2, z, "white_concrete");
}

const r = g.save(OUT);
console.log(JSON.stringify({ saved: OUT, blocks: r.blocks, palette: r.palette, maxT, doorFace, doorS, pockets: pockets.length }));
