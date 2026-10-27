// Malcolm Pacific Immigration (way 154430128): a late-20th-century Auckland office tower. Precast white concrete
// piers and light-grey spandrels, blue-green tinted glazing in pane bands, a dark basalt-look base course and
// a stone-clad podium on the ground. Storeys are 4 blocks (3.3 m); floor lines sit on absolute multiples of 4.
// The lidar roof is de-noised (3x3 median), snapped to storeys and smoothed once more into flat tiers.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_154430128.cells.json`, "utf8"));
const SX = 38, SZ = 47, SY = 81;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// footprint: ground G and lidar roof R (above y 0) per cell
const F = new Map();
for (const [x, z, g, r] of cells) F.set(`${x},${z}`, { g, r });
const inF = (x, z) => F.has(`${x},${z}`);
const G = (x, z) => F.get(`${x},${z}`).g;

// 1. roof: 3x3 median of the lidar, snapped to 4-block storeys, then one more median so the tiers are clean
const median3 = (x, z, val) => {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const q = val(x + dx, z + dz); if (q !== undefined) v.push(q); }
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const snap = new Map();
for (const [k] of F) { const [x, z] = k.split(",").map(Number); snap.set(k, 4 * Math.round(median3(x, z, (a, b) => F.get(`${a},${b}`)?.r) / 4)); }
const R = new Map();
for (const [k] of F) {
  const [x, z] = k.split(",").map(Number);
  const top = median3(x, z, (a, b) => snap.get(`${a},${b}`));
  R.set(k, Math.max(top, 4 * Math.ceil((G(x, z) + 8) / 4)));   // at least two storeys above its own ground
}
const top = (x, z) => R.get(`${x},${z}`);

// 2. envelope cells: on the outside of the footprint or where the roof tier steps; the rest are hollow with floor slabs
const env = (x, z) => DIRS.some(([dx, dz]) => !inF(x + dx, z + dz) || top(x + dx, z + dz) !== top(x, z));

// 3. blocks: a sparse map so pane connections can be worked out before the volume is written
const B = new Map();
const put = (x, y, z, block, state) => B.set(`${x},${y},${z}`, { block, state });
const at = (x, y, z) => B.get(`${x},${y},${z}`);

for (const [k] of F) {
  const [x, z] = k.split(",").map(Number), g = G(x, z), t = top(x, z), e = env(x, z);
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");                    // foundation: solid from y 0 up to the ground
  put(x, t - 1, z, "stone");                                                    // flat roof, every cell
  for (let y = g; y < t - 1; y++) {
    const m = y % 4;
    if (!e) { if (y > g && m === 0) put(x, y, z, "light_gray_concrete"); continue; }   // hollow: floor slabs only
    if (y === g) put(x, y, z, "polished_deepslate");                            // base course
    else if (m === 0) put(x, y, z, "light_gray_concrete");                      // storey line
    else if (m === 3) put(x, y, z, "white_concrete");                           // head course over the glazing
    else put(x, y, z, (x + z) % 3 === 0 ? "white_concrete" : "cyan_stained_glass_pane");   // glazing bay, pier every third
  }
  if (e) put(x, t, z, "smooth_quartz_slab", { type: "bottom" });                // cornice on the parapet line
}

// 4. entrance: the north-most envelope cell nearest the middle of the front, with a stone canopy over the door
const mx = [...F.keys()].map((k) => +k.split(",")[0]).reduce((a, b) => a + b, 0) / F.size;
const front = [...F.keys()].map((k) => k.split(",").map(Number)).filter(([x, z]) => env(x, z) && !inF(x, z - 1))
  .sort((a, b) => a[1] - b[1] || Math.abs(a[0] - mx) - Math.abs(b[0] - mx));
if (front.length) {
  const [dx0, dz0] = front[0], g0 = G(dx0, dz0);
  put(dx0, g0 + 1, dz0, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(dx0, g0 + 2, dz0, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const ox of [-1, 0, 1]) if (inF(dx0 + ox, dz0)) put(dx0 + ox, g0 + 3, dz0, "stone_brick_slab", { type: "bottom" });
  if (inF(dx0, dz0 + 1)) put(dx0, g0, dz0 + 1, "lantern", { hanging: "false", waterlogged: "false" });
}

// 5. rooftop plant: one plant room on the tower with a lattice mast, and one grouped plant room on the slab tier
for (const [k] of F) {
  const [x, z] = k.split(",").map(Number);
  if (top(x, z) === 68 && x >= 11 && x <= 14 && z >= 21 && z <= 25) { put(x, 68, z, "light_gray_concrete"); put(x, 69, z, "white_concrete"); }
  if (top(x, z) === 60 && !env(x, z) && x >= 21 && x <= 24 && z >= 31 && z <= 34) { put(x, 60, z, "light_gray_concrete"); put(x, 61, z, "white_concrete"); }
}
for (let y = 70; y <= 74; y++) put(12, y, 23, "iron_bars", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
put(12, 75, 23, "lightning_rod", { facing: "up", powered: "false" });

// 6. warm light: glowstone behind some glazing, on the hollow side of the envelope
for (const [k] of F) {
  const [x, z] = k.split(",").map(Number);
  if (!env(x, z)) continue;
  for (let y = G(x, z) + 1; y < top(x, z) - 1; y++) {
    const m = y % 4; if (m !== 1 && m !== 2) continue;
    if ((x * 7 + y * 5 + z * 3) % 9 !== 0 || (x + z) % 3 === 0) continue;
    const q = DIRS.map(([dx, dz]) => [x + dx, z + dz]).find(([a, b]) => inF(a, b) && !env(a, b) && G(a, b) < y);
    if (q && !at(q[0], y, q[1])) put(q[0], y, q[1], "glowstone");
  }
}

// 7. panes: connect to neighbouring panes and to solid blocks, as the game does
const FULL = new Set(["white_concrete", "light_gray_concrete", "stone", "stone_bricks", "polished_deepslate", "glowstone", "shroomlight"]);
const joins = (n) => !!n && (n.block.endsWith("_glass_pane") || FULL.has(n.block));
for (const [k, c] of B) {
  if (!c.block.endsWith("_glass_pane")) continue;
  const [x, y, z] = k.split(",").map(Number), b = (v) => (v ? "true" : "false");
  c.state = { north: b(joins(at(x, y, z - 1))), south: b(joins(at(x, y, z + 1))), east: b(joins(at(x + 1, y, z))), west: b(joins(at(x - 1, y, z))), waterlogged: "false" };
}

// 8. write the volume
const g = new Voxels([SX, SY, SZ]);
for (const [k, c] of B) { const [x, y, z] = k.split(",").map(Number); g.set(x, y, z, c.block, c.state); }
const out = g.save(`${DIR}/way_154430128.nbt`);
console.log(JSON.stringify({ blocks: out.blocks, palette: out.palette, maxY: Math.max(...[...B.keys()].map((k) => +k.split(",")[1])) }));
