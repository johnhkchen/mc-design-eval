// Way 942047378: a Queen Street-era office tower (1980s concrete frame, tinted glass in white-concrete mullions, a stone
// base) on the CBD ridge. Lidar roofs are snapped to storey tiers (4 blocks); each column is solid from its ground up
// to its tier, so every setback stands on what is under it. Interiors are air behind the glass, with a slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_942047378.cells.json", "utf8"));
const W = 45, D = 29, YS = 70, SH = 4;
const DIRS = [{ dx: 1, dz: 0, name: "east" }, { dx: -1, dz: 0, name: "west" }, { dx: 0, dz: 1, name: "south" }, { dx: 0, dz: -1, name: "north" }];
const key = (x, z) => x + "," + z;
const FP = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inF = (x, z) => FP.has(key(x, z));
const G = (x, z) => FP.get(key(x, z)).g;

// lidar roof -> storey tier; 0-4 blocks means no roof read (the west wing), so it is a 2-storey lower wing
const raw = (r) => (r <= 4 ? 8 : Math.max(8, Math.round(r / SH) * SH));
const tier0 = new Map([...FP].map(([k, v]) => [k, raw(v.r)]));
// a median over each cell and its footprint neighbours (3 x 3): lidar noise goes, the steps between tiers stay
const TIER = new Map();
for (const [k] of FP) {
  const [x, z] = k.split(",").map(Number);
  const vals = [];
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const n = key(x + i, z + j); if (tier0.has(n)) vals.push(tier0.get(n)); }
  vals.sort((a, b) => a - b);
  TIER.set(k, Math.max(vals[vals.length >> 1], G(x, z) + 8));
}
// a lone spike (a column taller than all but one of its footprint neighbours) is lidar noise: it drops to its tallest neighbour
for (const [k, h] of [...TIER]) {
  const [x, z] = k.split(",").map(Number);
  const nb = DIRS.map((d) => TIER.get(key(x + d.dx, z + d.dz))).filter((v) => v !== undefined);
  const taller = nb.filter((v) => v >= h).length, tallest = Math.max(...nb, 0);
  if (taller <= 1 && h > tallest + 4) TIER.set(k, Math.max(tallest, G(x, z) + 8));
}
const H = (x, z) => TIER.get(key(x, z));
const HMAX = Math.max(...TIER.values());

// the penthouse: the largest rectangle that fits on the top tier, nearest its centre
const top = [...TIER].filter(([, h]) => h === HMAX).map(([k]) => k.split(",").map(Number));
const cxT = top.reduce((s, [x]) => s + x, 0) / top.length, czT = top.reduce((s, [, z]) => s + z, 0) / top.length;
const topSet = new Set(top.map(([x, z]) => key(x, z)));
let pent = null;
for (const [w, d] of [[9, 7], [7, 5], [5, 5]]) {
  let best = null;
  for (let x0 = 0; x0 + w <= W; x0++) for (let z0 = 0; z0 + d <= D; z0++) {
    let ok = true;
    for (let i = 0; i < w && ok; i++) for (let j = 0; j < d && ok; j++) ok = topSet.has(key(x0 + i, z0 + j));
    if (!ok) continue;
    const score = Math.abs(x0 + (w - 1) / 2 - cxT) + Math.abs(z0 + (d - 1) / 2 - czT);
    if (!best || score < best.score) best = { score, x0, z0 };
  }
  if (best) { pent = { x0: best.x0, x1: best.x0 + w - 1, z0: best.z0, z1: best.z0 + d - 1, y0: HMAX, y1: HMAX + 3 }; break; }
}
const MAST = pent ? { x: (pent.x0 + pent.x1) >> 1, z: (pent.z0 + pent.z1) >> 1, y0: pent.y1 + 1, y1: pent.y1 + 6 } : null;
const inPent = (x, y, z) => !!pent && x >= pent.x0 && x <= pent.x1 && z >= pent.z0 && z <= pent.z1 && y >= pent.y0 && y <= pent.y1;
const penShell = (x, y, z) => y === pent.y1 || x === pent.x0 || x === pent.x1 || z === pent.z0 || z === pent.z1;
const inMast = (x, y, z) => !!MAST && x === MAST.x && z === MAST.z && y >= MAST.y0 && y <= MAST.y1;

// the directions in which a cell at this height faces outside: no footprint there, or its neighbour's tier is below
const exposedDirs = (x, y, z) => DIRS.filter((d) => !inF(x + d.dx, z + d.dz) || H(x + d.dx, z + d.dz) <= y);

// is the cell filled? (structure only: the pane connections read this, so it must not depend on states)
function occ(x, y, z) {
  if (inPent(x, y, z)) return penShell(x, y, z);
  if (inMast(x, y, z)) return true;
  if (!inF(x, z)) return false;
  const g = G(x, z), h = H(x, z);
  if (y < g) return true;
  if (y >= h) return false;
  if (exposedDirs(x, y, z).length) return true;
  return (y - g) % SH === 0 || y === h - 1;
}

// the entrance: the longest run of street-level wall on one side, its middle cell gets the door
const ringRuns = new Map();
for (const [x, z, g] of cells) {
  const ex = exposedDirs(x, g + 1, z);
  if (ex.length !== 1 || H(x, z) < 40) continue;                          // the tower's street front, not the wing
  const fixed = ex[0].dz ? z : x, along = ex[0].dz ? x : z;
  const k = ex[0].name + "|" + fixed;
  if (!ringRuns.has(k)) ringRuns.set(k, []);
  ringRuns.get(k).push({ x, z, along, d: ex[0] });
}
let ENTRY = null, bestRun = [];
for (const list of ringRuns.values()) {
  list.sort((a, b) => a.along - b.along);
  let run = [];
  for (const c of list) {
    if (run.length && c.along !== run[run.length - 1].along + 1) { if (run.length > bestRun.length) bestRun = run; run = []; }
    run.push(c);
  }
  if (run.length > bestRun.length) bestRun = run;
}
if (bestRun.length) {
  const mid = bestRun[bestRun.length >> 1];
  const ks = new Set(bestRun.slice(Math.max(0, (bestRun.length >> 1) - 1), (bestRun.length >> 1) + 2).map((c) => key(c.x, c.z)));
  ENTRY = { x: mid.x, z: mid.z, d: mid.d, canopy: ks };
}

// what a cell is made of: null is air
function kind(x, y, z) {
  if (inPent(x, y, z)) {
    if (!penShell(x, y, z)) return null;
    if (y === pent.y1) return ["smooth_stone"];
    if ((x === pent.x0 || x === pent.x1) && (z === pent.z0 || z === pent.z1)) return ["white_concrete"];
    if (y === pent.y0) return ["light_gray_concrete"];
    if ((x + z) % 4 === 0) return ["white_concrete"];
    return pane(x, y, z);
  }
  if (inMast(x, y, z)) return ["iron_bars"];
  if (!inF(x, z)) return null;
  const g = G(x, z), h = H(x, z);
  if (y < g) return ["stone"];
  if (y >= h) return null;
  const ex = exposedDirs(x, y, z);
  const isTop = y === h - 1, kf = Math.floor((y - g) / SH), j = (y - g) % SH;
  if (!ex.length) {
    if (isTop) return ["gray_concrete"];
    if (j === 0) return ["light_gray_concrete"];
    return null;
  }
  if (ENTRY && x === ENTRY.x && z === ENTRY.z) {
    const facing = ENTRY.d.name;
    if (y === g) return ["stone_brick_stairs", { facing, half: "bottom", shape: "straight", waterlogged: "false" }];
    if (y === g + 1) return ["iron_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" }];
    if (y === g + 2) return ["iron_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" }];
  }
  if (ENTRY && y === g + 3 && ENTRY.canopy.has(key(x, z))) return ["stone_brick_slab", { type: "top", waterlogged: "false" }];
  if (isTop) return ["smooth_stone"];                                    // parapet cap
  if (y === h - 2) return ["stone_bricks"];                              // cornice
  if (kf === 0 && j === 0) return ["stone_bricks"];                      // base course
  if (j === 0) return ["light_gray_concrete"];                           // storey line
  if (j === 3) return kf === 0 ? ["stone_bricks"] : ["light_gray_concrete"];
  if (ex.length >= 2) return ["white_concrete"];                         // corner column
  if ((x + z) % 4 === 0) return kf === 0 ? ["stone_bricks"] : ["white_concrete"];
  return pane(x, y, z);
}

// a glass pane joins whatever filled cell is beside it on each side
function pane(x, y, z) {
  const s = { waterlogged: "false" };
  for (const d of DIRS) s[d.name] = occ(x + d.dx, y, z + d.dz) ? "true" : "false";
  return ["light_blue_stained_glass_pane", s];
}

// warm lights: a lantern on the floor just inside some windows
const LANTERNS = new Map();
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inF(x, z)) continue;
  const g = G(x, z), h = H(x, z);
  for (let y = g + 1; y < h - 2; y += SH) {
    const ex = exposedDirs(x, y, z);
    if (ex.length !== 1 || (ENTRY && x === ENTRY.x && z === ENTRY.z)) continue;
    const k = kind(x, y, z);
    if (!k || k[0] !== "light_blue_stained_glass_pane") continue;
    if ((x * 7 + z * 5 + y) % 6 !== 0) continue;
    const ix = x - ex[0].dx, iz = z - ex[0].dz;
    if (!inF(ix, iz) || occ(ix, y, iz) || !occ(ix, y - 1, iz)) continue;
    LANTERNS.set(key(ix, y) + "|" + iz, ["lantern", { hanging: "false", waterlogged: "false" }]);
  }
}

const g = new Voxels([W, YS, D]);
let n = 0;
for (let y = 0; y < YS; y++) for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const lamp = LANTERNS.get(key(x, y) + "|" + z);
  const k = lamp || kind(x, y, z);
  if (!k) continue;
  g.set(x, y, z, k[0], k[1]);
  n++;
}
const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_942047378.nbt";
const info = g.save(out);
console.log(JSON.stringify({ blocks: info.blocks, palette: info.palette, tiers: [...new Set(TIER.values())].sort((a, b) => a - b), penthouse: pent, entry: ENTRY && { x: ENTRY.x, z: ENTRY.z, facing: ENTRY.d.name }, lanterns: LANTERNS.size }));
