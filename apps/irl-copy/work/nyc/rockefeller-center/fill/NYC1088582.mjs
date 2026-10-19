// NYC1088582: 510 Madison Avenue (2007, commercial and office). A glass office tower on a granite-based
// 8-storey podium, the tower stepping in twice as it rises (96 and 108) to a 120-block crown with plant boxes.
// Massing follows the lidar roof per cell, quantised to clean tiers; the walls are a one-block shell with an air
// gap, a floor slab per storey, and the glass band reads as panes in light-grey frames.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1088582.cells.json`, "utf8"));   // [x, z, ground, roof]
const W = 43, D = 25, H = 133;

const key = (x, z) => `${x},${z}`;
const key3 = (x, y, z) => `${x},${y},${z}`;
const raw = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inFoot = (x, z) => raw.has(key(x, z));
const DIRS = [[1, 0, "x+"], [-1, 0, "x-"], [0, 1, "z+"], [0, -1, "z-"]];

// 1. Lidar roof -> clean tiers: open ground, low pavilion, 8-storey podium, light-court tier, tower crown.
const tierOf = (r) => (r <= 2 ? 0 : r <= 10 ? 6 : r <= 100 ? 24 : r <= 117 ? 114 : 120);
const tier0 = new Map([...raw].map(([k, c]) => [k, tierOf(c.r)]));

// 2. One 3x3 mode pass: a cell whose 8 neighbours mostly agree takes their tier (closes lidar holes and specks).
const tier = new Map();
for (const [k, c] of raw) {
  const counts = new Map();
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    if (!dx && !dz) continue;
    const nk = key(c.x + dx, c.z + dz);
    if (tier0.has(nk)) counts.set(tier0.get(nk), (counts.get(tier0.get(nk)) || 0) + 1);
  }
  let best = tier0.get(k), n = 0;
  for (const [t, m] of counts) if (m >= 6 && m > n) { best = t; n = m; }
  tier.set(k, best);
}

// 3. Tower depth: 1 = outer ring of the tower, 2 = next ring in. Each ring steps down as it rises.
const isTower = (x, z) => inFoot(x, z) && tier.get(key(x, z)) >= 114;
const depth = new Map(), queue = [];
for (const [k, c] of raw) {
  if (!isTower(c.x, c.z)) continue;
  if (DIRS.some(([dx, dz]) => !isTower(c.x + dx, c.z + dz))) { depth.set(k, 1); queue.push(k); }
}
for (let q = 0; q < queue.length; q++) {
  const [x, z] = queue[q].split(",").map(Number), d = depth.get(queue[q]);
  for (const [dx, dz] of DIRS) {
    const nk = key(x + dx, z + dz);
    if (isTower(x + dx, z + dz) && !depth.has(nk)) { depth.set(nk, d + 1); queue.push(nk); }
  }
}

// Top of each column (exclusive): open ground stops at its ground; everything else at its tier, stepped.
const T = (x, z) => {
  const k = key(x, z), { g } = raw.get(k), t = tier.get(k);
  if (t === 0) return g;
  if (t >= 114) {
    const d = depth.get(k) ?? 99;
    const step = d === 1 ? 96 : d === 2 ? 108 : 120;
    return Math.max(g + 1, Math.min(t, step));
  }
  return Math.max(g + 1, t);
};
const occ = (x, y, z) => inFoot(x, z) && y < T(x, z);
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => !occ(x + dx, y, z + dz)).map(([, , n]) => n);
const edge = (x, z) => DIRS.some(([dx, dz]) => !inFoot(x + dx, z + dz) || T(x + dx, z + dz) < T(x, z));

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const PANE_Z = { east: "true", west: "true", north: "false", south: "false" };   // pane on a z-facing wall
const PANE_X = { north: "true", south: "true", east: "false", west: "false" };   // pane on an x-facing wall
const DOOR = { facing: "north", hinge: "left", open: "false", powered: "false" };
const lights = new Set();

function wall(x, y, z, dirs, top) {
  const zFace = dirs.some((n) => n[0] === "z");
  const i = zFace ? x : z;
  const pane = zFace ? PANE_Z : PANE_X;
  // Entrance on the tower's south face (z = D-1): double door at x 20-21, lobby opening at y 1-2, canopy above.
  if (zFace && z === D - 1 && (x === 20 || x === 21) && (y === 1 || y === 2)) {
    if (x === 20) put(x, y, z, "iron_door", { ...DOOR, half: y === 1 ? "lower" : "upper" });
    return;
  }
  if (y === top - 1) return put(x, y, z, "polished_granite");                      // cornice course
  if (y < 3 && y === g_of(x, z)) return put(x, y, z, "polished_granite");           // plinth at ground
  if (y < 3) {                                                                    // shopfront storey
    return i % 3 === 0 ? put(x, y, z, "polished_granite") : put(x, y, z, "light_blue_stained_glass_pane", pane);
  }
  if (y % 3 === 0) {                                                              // storey line; canopy over the entrance
    const canopy = zFace && z === D - 1 && x >= 18 && x <= 23 && y === 3;
    return put(x, y, z, canopy ? "black_concrete" : "gray_concrete");
  }
  if (i % 3 === 0) return put(x, y, z, "light_gray_concrete");                     // mullion frame
  put(x, y, z, "light_blue_stained_glass_pane", pane);
  // Warm light behind some panes: stands on the storey slab in the air gap, next to the glass.
  const [ix, iz] = zFace ? [x, z - Math.sign(dirs.includes("z+") ? 1 : -1)] : [x - Math.sign(dirs.includes("x+") ? 1 : -1), z];
  if (y % 3 === 1 && y > g_of(x, z) && (i * 7 + y) % 17 === 0 && inFoot(ix, iz) && y < T(ix, iz) && exposed(ix, y, iz).length === 0) {
    lights.add(key3(ix, y, iz));
    put(ix, y, iz, (i + y) % 2 ? "glowstone" : "shroomlight");
  }
}
const g_of = (x, z) => raw.get(key(x, z)).g;

for (const [k, c] of raw) {
  const { x, z, g: gr } = c, top = T(x, z);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");                          // foundation
  if (top === gr) { put(x, gr, z, "smooth_stone"); continue; }                        // open ground: paving
  for (let y = gr; y < top; y++) {
    if (lights.has(key3(x, y, z))) continue;
    const dirs = exposed(x, y, z);
    if (dirs.length) wall(x, y, z, dirs, top);
    else if (y === gr || y === top - 1) put(x, y, z, y === top - 1 ? "light_gray_concrete" : "gray_concrete");
    else if (y % 3 === 0) put(x, y, z, "gray_concrete");                              // interior storey slab
  }
  if (edge(x, z) && top < H) put(x, top, z, "polished_granite");                      // parapet / coping
}

// Roof plant on the 120-block crown, and a planted terrace on the podium roof.
const boxAt = (x0, z0, w, d) => {
  for (let x = x0; x < x0 + w; x++) for (let z = z0; z < z0 + d; z++) if (!(inFoot(x, z) && T(x, z) === 120)) return false;
  return true;
};
if (boxAt(7, 8, 4, 3)) for (let x = 7; x < 11; x++) for (let z = 8; z < 11; z++) for (let y = 120; y < 122; y++) put(x, y, z, "light_gray_concrete");
if (boxAt(23, 9, 3, 3)) for (let x = 23; x < 26; x++) for (let z = 9; z < 12; z++) for (let y = 120; y < 122; y++) put(x, y, z, "light_gray_concrete");
for (const [k, c] of raw) {
  const { x, z } = c;
  if (T(x, z) !== 24 || edge(x, z) || x % 4 !== 1 || z % 5 !== 2) continue;
  put(x, 24, z, "oak_leaves", { persistent: "true" });
}

const stats = g.save(`${DIR}/NYC1088582.nbt`);
console.log(`NYC1088582: ${stats.blocks} blocks, ${stats.palette} palette entries; tower cells ${[...raw.keys()].filter((k) => isTower(...k.split(",").map(Number))).length}, lit windows ${lights.size}`);
