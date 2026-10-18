// Lake Street on the oak-lake land: one straight street along the lake's west side with the mail-order kit's eight
// 16 x 20 plots in a row on its west side, facing east toward the street and the lake. Changes as little as it can: only
// the street and the plots are touched; the rest of the export stays byte-for-byte as it was.
//   node site-plan.mjs [outDir]  -> layout.json, site.nbt (whole export, street + pads), site-changes.nbt (only the
//   changed cells, explicit air where earth was cut)
import { readSite, GRADE } from "./site.mjs";
import { slabProfile } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/terrain.mjs";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { mkdirSync, writeFileSync } from "node:fs";

const OUT = process.argv[2] ?? new URL("../delivery", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const site = readSite(), { g, X, Z, H } = site, before = g.clone(), Y = g.size[1];

// ---- the street: gravel road x 40..42, smooth stone sidewalk x 38..39 on the plot side, z 0 .. Z-1 ------------------
const ROAD = [40, 42], WALK = [38, 39], PLOT = [18, 37], N = 8, W = 16, Z0 = 8;
const plots = Array.from({ length: N }, (_, i) => ({ module: i, x0: PLOT[0], x1: PLOT[1], z0: Z0 + W * i, z1: Z0 + W * i + W - 1, face: "east" }));

// pad levels (relative to the lake): least earth moved, neighbours within 1 so the street between them is half steps
const earth = (p, lv) => { let e = 0; for (let z = p.z0; z <= p.z1; z++) for (let x = p.x0; x <= WALK[1]; x++) e += Math.abs(H[z][x] - lv); return e; };
const LV = [...Array(14).keys()].map((k) => k + 4);
let cost = LV.map((lv) => earth(plots[0], lv)), from = [];
for (let i = 1; i < N; i++) { const prev = cost; from[i] = []; cost = LV.map((lv, a) => { let best = Infinity;
  LV.forEach((_, b) => { if (Math.abs(a - b) <= 1 && prev[b] < best) { best = prev[b]; from[i][a] = b; } }); return best + earth(plots[i], lv); }); }
let a = cost.indexOf(Math.min(...cost)); for (let i = N - 1; i >= 0; i--) { plots[i].pad = LV[a]; if (i) a = from[i][a]; }

// street profile along z: level across each plot's front, ground elsewhere; then half steps only (3, landing 2)
const ground = (z) => { const hs = []; for (let x = WALK[0]; x <= ROAD[1]; x++) if (!site.water[z][x]) hs.push(H[z][x]); hs.sort((p, q) => p - q); return hs.length ? hs[hs.length >> 1] : 0; };
// each plot's front is pinned level at its pad; the gaps between (and the street's two ends) are solved in half steps
// from pin to pin
const pin = Array.from({ length: Z }, (_, z) => plots.find((p) => z >= p.z0 + 3 && z <= p.z1 - 3)?.pad ?? null);
const prof = pin.slice();
for (let z = 0; z < Z; ) {
  if (pin[z] != null) { z++; continue; }
  let e = z; while (e < Z && pin[e] == null) e++;
  const a = Math.max(0, z - 1), b = Math.min(Z - 1, e), seg = [];
  // between two plots the street runs straight from pad to pad; past the last plot it follows the ground
  const both = pin[a] != null && pin[b] != null;
  for (let k = a; k <= b; k++) seg.push(pin[k] ?? (both ? pin[a] + (pin[b] - pin[a]) * (k - a) / (b - a) : ground(k)));
  const solved = slabProfile(seg, { startY: pin[a] ?? undefined, endY: pin[b] ?? undefined });
  for (let k = a; k <= b; k++) if (pin[k] == null) prof[k] = solved[k - a];
  z = e;
}
for (const p of plots) for (let z = p.z0 + 5; z <= p.z0 + 10; z++) if (prof[z] !== p.pad) console.warn(`plot ${p.module}: street at z ${z} is ${prof[z]}, pad ${p.pad}`);

// ---- writing the changes -----------------------------------------------------------------------------------------
const AT = (y) => y + GRADE;
const PLANT = /leaves|_log$|_wood$|short_grass|tall_grass|fern|flower|tulip|poppy|dandelion|bush|sapling|vine|mushroom|lily|azure|orchid|allium|cornflower|daisy|rose/;
const clearAbove = (x, z, y0) => { for (let y = y0; y < Y; y++) { const c = g.get(x, y, z); if (c && !/air$/.test(c.block)) g.set(x, y, z, "air"); } };
// a column to a top height t (half blocks: a bottom slab of `slab` over full blocks), `top` the surface block
function column(x, z, t, top, slab) {
  const full = Math.floor(t), half = t - full > 0;
  for (let y = AT(full) ; y >= 0; y--) { const c = g.get(x, y, z), b = c?.block ?? "air";
    if (y < AT(full) - 3 && !/air$|water|leaves|_log$/.test(b)) break;      // reached the land's own fill
    g.set(x, y, z, y === AT(full) ? top : /stone|ore|andesite|diorite|granite|tuff|deepslate|gravel/.test(b) && y < AT(full) - 1 ? b : "dirt"); }
  clearAbove(x, z, AT(full) + 1);
  if (half) g.set(x, AT(full) + 1, z, slab, { type: "bottom" });
}
// trees that stand on the plots and the street go (their leaves hang over the build); felled whole, not chopped
const touched = (x, z) => x >= PLOT[0] && x <= ROAD[1] && z >= 0 && z < Z;
const felled = new Set();
for (let z = 0; z < Z; z++) for (let x = PLOT[0]; x <= ROAD[1]; x++) if (site.tree[z][x]) felled.add(`${x},${z}`);
// a tree's crown: leaves within 3 of a felled trunk column, above the ground
for (const k of felled) { const [tx, tz] = k.split(",").map(Number);
  for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) { const x = tx + dx, z = tz + dz; if (x < 0 || z < 0 || x >= X || z >= Z) continue;
    for (let y = AT(H[tz][tx]) + 1; y < Y; y++) { const c = g.get(x, y, z); if (c && PLANT.test(c.block)) g.set(x, y, z, "air"); } } }

for (let z = 0; z < Z; z++) {
  const t = prof[z];
  for (let x = WALK[0]; x <= ROAD[1]; x++) {
    const surf = x >= ROAD[0] ? "gravel" : "smooth_stone", slab = x >= ROAD[0] ? "andesite_slab" : "smooth_stone_slab";
    column(x, z, t, surf, slab);
  }
}
const masonry = (x, y, z) => ((x * 7 + y * 13 + z * 3) % 9 === 0 ? "mossy_stone_bricks" : "stone_bricks");
for (const p of plots) {
  for (let z = p.z0; z <= p.z1; z++) for (let x = p.x0; x <= p.x1; x++) column(x, z, p.pad, "grass_block");
  // where the land outside the plot's back or sides sits 2+ above or below the pad: a stone retaining wall on the line
  for (let z = p.z0; z <= p.z1; z++) for (const [x, ox] of [[p.x0, -1]]) { const h = H[z][x + ox]; if (h - p.pad >= 2) for (let y = AT(p.pad) + 1; y <= AT(h); y++) g.set(x, y, z, masonry(x, y, z)); }
  for (const [z, oz] of [[p.z0, -1], [p.z1, 1]]) { if (plots.some((q) => q !== p && z + oz >= q.z0 && z + oz <= q.z1)) continue;
    for (let x = p.x0; x <= p.x1; x++) { const h = H[z + oz]?.[x]; if (h != null && h - p.pad >= 2) for (let y = AT(p.pad) + 1; y <= AT(h); y++) g.set(x, y, z, masonry(x, y, z)); } }
}

// ---- outputs ---------------------------------------------------------------------------------------------------------
const changes = new Grid(g.size, { dataVersion: g.dataVersion });
let cut = 0, placed = 0;
for (let y = 0; y < Y; y++) for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const a = before.get(x, y, z), b = g.get(x, y, z), ab = a?.block ?? "minecraft:air", bb = b?.block ?? "minecraft:air";
  if (ab === bb && JSON.stringify(a?.state ?? {}) === JSON.stringify(b?.state ?? {})) continue;
  changes.set(x, y, z, bb, b?.state); if (/air$/.test(bb)) cut++; else placed++;
}
g.save(`${OUT}/site.nbt`); changes.save(`${OUT}/site-changes.nbt`);
const layout = { file: "oak_lake_001.nbt", grade: GRADE, street: { road: ROAD, walk: WALK, profile: prof }, plots };
writeFileSync(`${OUT}/layout.json`, JSON.stringify(layout, null, 1) + "\n");
console.log(JSON.stringify({ pads: plots.map((p) => p.pad), trees: felled.size, cleared: cut, placed, changed: cut + placed }));
