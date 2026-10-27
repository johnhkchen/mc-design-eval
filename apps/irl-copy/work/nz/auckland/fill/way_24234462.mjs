// Auckland High Court, seen from Maungawhau: a pale-stone civic block with a stepped tower core. The record (lidar roof
// heights 19-44 blocks, a 106 x 85 footprint, the core highest) reads as a 1980s-style courthouse: stone-clad, dark string
// courses, smoked glazing, a recessed entrance under a hood. Storeys are 4 blocks, floors on absolute 4-block lines.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_24234462.cells.json`, "utf8"));

const M = {
  plinth: "stone_bricks",      // foundation, base course, string courses
  wall: "smooth_quartz",       // piers and spandrels
  tower: "white_concrete",     // piers on the tall core
  glass: "gray_stained_glass", // smoked glazing
  slab: "light_gray_concrete", // floor slabs in the interior
  roof: "stone",
  cap: "stone_brick_slab",     // parapet
  plant: "light_gray_concrete",
  canopy: "stone_bricks",
};

const W = 106, D = 85, H = 57;
const G = new Map(), R = new Map();                        // keyed by z * W + x
for (const [x, z, g, r] of cells) { G.set(z * W + x, g); R.set(z * W + x, r); }
const ck = (x, z) => z * W + x;
const inF = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G.has(ck(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Tiers: a 5x5 median of the lidar roof, snapped to 4-block storeys, then the mode of each 3x3 so the tier edges run
// straight; at least 3 storeys, and 2 above the ground under it.
const snap = (v) => 4 * Math.round(v / 4);
const med = (k, n, val) => {
  const x = k % W, z = (k - x) / W, vals = [];
  for (let dz = -n; dz <= n; dz++) for (let dx = -n; dx <= n; dx++) if (inF(x + dx, z + dz)) vals.push(val(ck(x + dx, z + dz)));
  vals.sort((a, b) => a - b);
  return vals[vals.length >> 1];
};
const S = new Map();
for (const k of G.keys()) S.set(k, snap(med(k, 2, (c) => R.get(c))));
const T = new Map();
for (const k of G.keys()) {
  const x = k % W, z = (k - x) / W, count = new Map();
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inF(x + dx, z + dz)) { const v = S.get(ck(x + dx, z + dz)); count.set(v, (count.get(v) || 0) + 1); }
  let mode = S.get(k), n = -1;
  for (const [v, c] of count) if (c > n || (c === n && v > mode)) { mode = v; n = c; }
  T.set(k, Math.max(12, G.get(k) + 8, mode));
}

// Outward faces that see air: off the footprint, or over a lower neighbouring tier.
const exposed = (x, z) => {
  const t = T.get(ck(x, z)), out = [];
  for (const [dx, dz] of DIRS) if (!inF(x + dx, z + dz) || T.get(ck(x + dx, z + dz)) < t) out.push([dx, dz]);
  return out;
};

const B = new Map();                                        // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => B.set(`${x},${y},${z}`, { block, state });
const del = (x, y, z) => B.delete(`${x},${y},${z}`);
const has = (x, y, z) => B.has(`${x},${y},${z}`);

// Pass 1: foundation, walls with windows, interior floors, roof and parapet, one column per cell.
for (const k of G.keys()) {
  const x = k % W, z = (k - x) / W, g = G.get(k), t = T.get(k);
  const ex = exposed(x, z), shell = ex.length > 0, corner = ex.length > 1;
  const along = shell && ex[0][0] !== 0 ? z : x;           // index along the exposed face: mullions line up down a face
  const tower = t >= 36;
  for (let y = 0; y < g; y++) put(x, y, z, M.plinth);       // foundation to the cell's own ground: nothing floats on a slope
  for (let y = g; y <= t - 2; y++) {
    if (shell) {
      if (y === g) put(x, y, z, M.plinth);                  // base course
      else if (y % 4 === 0) put(x, y, z, M.plinth);         // string course at each floor
      else if (y % 4 === 3 || corner || along % 3 === 0) put(x, y, z, tower ? M.tower : M.wall);
      else put(x, y, z, M.glass);
    } else if (y % 4 === 0 && y > g && y <= t - 3) put(x, y, z, M.slab);
  }
  put(x, t - 1, z, M.roof);
  if (shell) put(x, t, z, M.cap, { type: "bottom", waterlogged: "false" });
}

// Pass 2: warm lanterns standing on the floor just behind some lit-by-storey windows (air behind the glass).
for (const k of G.keys()) {
  const x = k % W, z = (k - x) / W, g = G.get(k), t = T.get(k), ex = exposed(x, z);
  if (ex.length !== 1) continue;
  const [dx, dz] = ex[0], along = dx !== 0 ? z : x, ix = x - dx, iz = z - dz;
  if (!inF(ix, iz) || exposed(ix, iz).length) continue;
  for (let y = g + 1; y <= t - 3; y++) {
    if (y % 4 !== 1) continue;
    const s = (y - 1) / 4;
    if ((along + s) % 4 !== 0 || s % 2 !== 0) continue;
    if (!has(ix, y - 1, iz) || has(ix, y, iz) || !has(x, y, z)) continue;
    put(ix, y, iz, "lantern", { hanging: "false" });
  }
}

// Pass 3: a recessed entrance on the lowest street-side face: three ring cells, door in the middle, pillars, a hood.
let best = null;
for (const k of G.keys()) {
  const x = k % W, z = (k - x) / W, t = T.get(k);
  if (t > 24) continue;
  for (const [dx, dz] of DIRS) {
    if (inF(x + dx, z + dz)) continue;
    const tx = dz !== 0 ? 1 : 0, tz = dx !== 0 ? 1 : 0;   // tangent along the face
    const ok = [-1, 0, 1].every((o) => {
      const cx = x + o * tx, cz = z + o * tz;
      return inF(cx, cz) && !inF(cx + dx, cz + dz) && inF(cx - dx, cz - dz) && T.get(ck(cx, cz)) <= 24;
    });
    if (!ok) continue;
    const score = G.get(k) * 100 + t;
    if (!best || score < best.score) best = { x, z, dx, dz, tx, tz, g: G.get(k), score };
  }
}
if (best) {
  const { x, z, dx, dz, tx, tz, g } = best;
  for (const o of [-1, 0, 1]) {
    const cx = x + o * tx, cz = z + o * tz;
    for (let y = g; y <= g + 2; y++) del(cx, y, cz);
    if (o !== 0) for (let y = g; y <= g + 2; y++) put(cx, y, cz, "quartz_pillar", { axis: "y" });
    put(cx, g + 3, cz, M.canopy);
  }
  for (let y = g; y <= g + 2; y++) del(x - dx, y, z - dz);   // the door opens onto a clear hall
  const facing = dz !== 0 ? (dz > 0 ? "south" : "north") : (dx > 0 ? "east" : "west");
  const door = { facing, hinge: "left", open: "false", powered: "false" };
  put(x, g, z, "dark_oak_door", { ...door, half: "lower" });
  put(x, g + 1, z, "dark_oak_door", { ...door, half: "upper" });
}

// Roof plant on the tallest tier: boxes on the roof, a warm shroomlight on top of one of them.
const topT = Math.max(...T.values());
for (const k of G.keys()) {
  const x = k % W, z = (k - x) / W, t = T.get(k);
  if (t !== topT || exposed(x, z).length || x % 8 < 3 || x % 8 > 5 || z % 8 < 3 || z % 8 > 4) continue;
  put(x, t, z, M.plant); put(x, t + 1, z, M.plant);
  if (x % 8 === 4 && z % 8 === 4) put(x, t + 2, z, "shroomlight");
}

// Check: every block must hang together with the ground (face-connected to y = 0), or it is floating.
const seen = new Set(), q = [];
for (const key of B.keys()) if (key.split(",")[1] === "0") { seen.add(key); q.push(key); }
while (q.length) {
  const [x, y, z] = q.pop().split(",").map(Number);
  for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
    const n = `${x + dx},${y + dy},${z + dz}`;
    if (B.has(n) && !seen.has(n)) { seen.add(n); q.push(n); }
  }
}
const floating = [...B.keys()].filter((key) => !seen.has(key));

const out = new Voxels([W, H, D]);
for (const [key, { block, state }] of B) { const [x, y, z] = key.split(",").map(Number); out.set(x, y, z, block, state); }
const stats = out.save(`${DIR}/way_24234462.nbt`);
console.log(JSON.stringify({ blocks: stats.blocks, palette: stats.palette, floating: floating.length, floatingSample: floating.slice(0, 5), topT, tiers: [...new Set(T.values())].sort((a, b) => a - b), entrance: best ? { x: best.x, z: best.z, g: best.g } : null }));
