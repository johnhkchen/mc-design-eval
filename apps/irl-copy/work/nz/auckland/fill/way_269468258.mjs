// Eden 3 (way 269468258), Mt Eden / Eden Terrace: a 1970s-80s concrete office block, five storeys at its core
// stepping down to three and one at the wings. Concrete frame with string courses and piers, a band of tinted glass
// between them, a dark base course, a shopfront on the downhill side, and a glazed penthouse on the core.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_269468258.cells.json`, "utf8"));   // [x, z, ground, roof]

const W = 57, H = 35, D = 45;
const DATUM = 3;      // ground-floor slab: the highest ground under the footprint; the plinth fills 0..2 under every cell
const PLINTH = 3;
const GLASS = "light_blue_stained_glass_pane";
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];                                     // [dx, dz]
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const FULL = new Set(["white_concrete", "light_gray_concrete", "gray_concrete", "smooth_stone", "polished_andesite",
  "black_concrete", "iron_block", "glowstone"]);

const key = (x, z) => `${x},${z}`;
const G = new Map(), RF = new Map();
for (const [x, z, g, r] of cells) { G.set(key(x, z), g); RF.set(key(x, z), r); }
const inF = (x, z) => G.has(key(x, z));

// 1. smooth the lidar roof with a 3x3 mean inside the footprint, then quantise to storeys of 4 blocks
const T = new Map();
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  let s = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inF(x + dx, z + dz)) { s += RF.get(key(x + dx, z + dz)); n++; }
  T.set(key(x, z), Math.round(s / n));
}
// body storeys kc in 1..4: the body's roof slab sits at DATUM + 4*kc, its parapet one block above
const K = new Map();
for (const k of G.keys()) K.set(k, Math.min(4, Math.max(1, Math.round((T.get(k) - 5) / 4))));
const lvl = (x, z) => (inF(x, z) ? K.get(key(x, z)) : -1);

// 2. the penthouse: the core where the lidar reads 22+ blocks, set in at least 3 cells from the 21-block body's edge
const dist = new Map();
const queue = [];
for (const k of G.keys()) {
  const [x, z] = k.split(",").map(Number);
  const edge = K.get(k) < 4 || DIRS.some(([dx, dz]) => !inF(x + dx, z + dz));
  dist.set(k, edge ? 0 : Infinity); if (edge) queue.push([x, z]);
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i], d = dist.get(key(x, z));
  for (const [dx, dz] of DIRS) {
    const nk = key(x + dx, z + dz);
    if (inF(x + dx, z + dz) && dist.get(nk) > d + 1) { dist.set(nk, d + 1); queue.push([x + dx, z + dz]); }
  }
}
let P = new Set();
for (const k of G.keys()) if (K.get(k) === 4 && T.get(k) >= 22 && dist.get(k) >= 3) P.add(k);
// square off the core's ragged outline: two passes of a 3x3 majority (a cell joins if 5+ of its 9 are core)
for (let pass = 0; pass < 2; pass++) {
  const next = new Set();
  for (const k of G.keys()) {
    const [x, z] = k.split(",").map(Number);
    let n = 0;
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (P.has(key(x + dx, z + dz))) n++;
    if (n >= 5 && K.get(k) === 4 && dist.get(k) >= 2) next.add(k);
  }
  P = next;
}
const isP = (x, z) => P.has(key(x, z));

// 3. the shell: each cell's plinth, floors, walls, parapet; interiors are air, the floor slabs span them
// two rooftop plant units (3 x 2 blocks, two high) on the body's roof, clear of the penthouse and the parapet
const roofUnits = [];
for (let z = 0; z < D - 1 && roofUnits.length < 2; z++) for (let x = 0; x < W - 2 && roofUnits.length < 2; x++) {
  const fits = [0, 1, 2].every((i) => [0, 1].every((j) => {
    const k = key(x + i, z + j);
    return inF(x + i, z + j) && K.get(k) === 4 && !isP(x + i, z + j) && dist.get(k) >= 2;
  }));
  if (fits && roofUnits.every((u) => Math.abs(u.x - x) + Math.abs(u.z - z) >= 14)) roofUnits.push({ x, z });
}

const B = new Map();   // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  B.set(`${x},${y},${z}`, { block, state });
};
const downhill = (x, z) => G.get(key(x, z)) <= 1;

// the street-level shopfront cells, so the entrances can be chosen from them
const shops = [];
for (const k of G.keys()) {
  const [x, z] = k.split(",").map(Number);
  const open = DIRS.filter(([dx, dz]) => lvl(x + dx, z + dz) <= 0);
  if (open.length === 1 && downhill(x, z)) shops.push({ x, z, open: open[0] });
}
shops.sort((a, b) => (a.open.join() + a.x * 100 + a.z).localeCompare(b.open.join() + b.x * 100 + b.z, undefined, { numeric: true }));
const entrances = shops.length ? [shops[Math.floor(shops.length / 2)]] : [];
const isEntrance = (x, z) => entrances.some((e) => e.x === x && e.z === z);

for (const k of G.keys()) {
  const [x, z] = k.split(",").map(Number);
  const kc = K.get(k);
  for (let y = 0; y < PLINTH; y++) put(x, y, z, "polished_andesite");

  // floor slabs over the whole footprint: a string course where the wall is exposed, else light concrete
  for (let j = 0; j < kc; j++) {
    const yS = DATUM + 4 * j;
    const exposed = DIRS.some(([dx, dz]) => lvl(x + dx, z + dz) <= j);
    put(x, yS, z, exposed ? "smooth_stone" : "light_gray_concrete");
  }
  put(x, DATUM + 4 * kc, z, "gray_concrete");   // the roof membrane

  // walls: a storey at j is a slab, two rows of glass, and a head band; piers every third block
  for (let j = 0; j < kc; j++) {
    const open = DIRS.filter(([dx, dz]) => lvl(x + dx, z + dz) <= j);
    if (!open.length) continue;
    const y4 = DATUM + 4 * j + 1, y5 = y4 + 1, y6 = y4 + 2;
    if (open.length >= 2) {
      put(x, y4, z, "white_concrete"); put(x, y5, z, "white_concrete"); put(x, y6, z, "white_concrete");
      continue;
    }
    const [dx] = open[0], along = dx !== 0 ? z : x;
    const shop = j === 0 && downhill(x, z);
    if (shop) {
      if (isEntrance(x, z)) {
        const facing = FACING[open[0].join(",")];
        put(x, y4, z, "iron_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
        put(x, y5, z, "iron_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
        put(x, y6, z, "smooth_stone");
      } else {
        put(x, y4, z, GLASS); put(x, y5, z, GLASS); put(x, y6, z, "black_concrete");
      }
    } else if (along % 3 === 0) {
      put(x, y4, z, "white_concrete"); put(x, y5, z, "white_concrete"); put(x, y6, z, "white_concrete");
    } else {
      put(x, y4, z, GLASS); put(x, y5, z, GLASS); put(x, y6, z, "light_gray_concrete");
      // a warm light on the floor behind the lower glass row, in some windows
      const [ix, iz] = [x - open[0][0], z - open[0][1]];
      if (inF(ix, iz) && lvl(ix, iz) > j && (x * 31 + z * 17 + j * 7) % 5 === 0) put(ix, y4, iz, "glowstone");
    }
  }

  // the parapet: a coping course on the top's exposed edge (not under the penthouse)
  const topEdge = DIRS.some(([dx, dz]) => lvl(x + dx, z + dz) < kc);
  if (topEdge && !isP(x, z)) put(x, DATUM + 4 * kc + 1, z, "smooth_stone");

}

for (const u of roofUnits) for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
  put(u.x + i, DATUM + 16 + 1, u.z + j, "light_gray_concrete");
  put(u.x + i, DATUM + 16 + 2, u.z + j, "iron_block");
}

// the penthouse: a light concrete sill, a glass band (piers on the grid), and a coping roof at y 22
for (const k of P) {
  const [x, z] = k.split(",").map(Number);
  const edge = DIRS.some(([dx, dz]) => !isP(x + dx, z + dz));
  if (!edge) { put(x, 22, z, "gray_concrete"); continue; }
  const [, dz] = DIRS.find(([dx, dz]) => !isP(x + dx, z + dz));
  const along = dz !== 0 ? x : z;
  put(x, 20, z, "light_gray_concrete");
  put(x, 21, z, along % 3 === 0 ? "white_concrete" : GLASS);
  put(x, 22, z, "smooth_stone");
}

// 4. panes take their connections from their neighbours (panes and solid cubes), then the whole volume is written
for (const [k, v] of B) {
  if (!v.block.endsWith("_glass_pane")) continue;
  const [x, y, z] = k.split(",").map(Number);
  const joins = (dx, dz) => { const n = B.get(`${x + dx},${y},${z + dz}`); return !!n && (n.block.endsWith("_glass_pane") || FULL.has(n.block)); };
  v.state = { north: String(joins(0, -1)), south: String(joins(0, 1)), east: String(joins(1, 0)), west: String(joins(-1, 0)), waterlogged: "false" };
}

const g = new Voxels([W, H, D]);
for (const [k, v] of B) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, v.block, v.state);
}
const out = `${DIR}/way_269468258.nbt`;
const stats = g.save(out);
const pc = [...K.values()].reduce((m, v) => { m[v] = (m[v] || 0) + 1; return m; }, {});
console.log(JSON.stringify({ cells: cells.length, tiers: pc, penthouse: P.size, entrances: entrances.length, ...stats }));
