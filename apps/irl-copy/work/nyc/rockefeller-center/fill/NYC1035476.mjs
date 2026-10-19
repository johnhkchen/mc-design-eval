// NYC1035476: 14 East 52nd Street, 1930 mixed residential and commercial building. Eight storeys of brick on a granite
// base, with a shopfront of granite piers, glass and an oxidised copper canopy over a residential door at the street
// (the z 0 face), stone storey lines, a stone cornice and a tar roof. Its rear (z 27 side) steps down to a low wing, and
// its east side looks onto a light court at grade. Windows are glass in the outer layer with an air gap behind them and
// a solid core, so every block stands on something; some gaps hold a lamp.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const W = 9, D = 28, Y = 36;
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035476.cells.json`, "utf8"));

// Ground and lidar roof per footprint cell; cells outside the lot are null.
const G = Array.from({ length: D }, () => Array(W).fill(null));
const R = Array.from({ length: D }, () => Array(W).fill(0));
for (const [x, z, g, r] of cells) { G[z][x] = g; R[z][x] = r; }
const inFP = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[z][x] !== null;

// 1. Lidar cleanup: a low cell inside a tall mass is a drop-out, a tall cell among low ones is a stray.
const NB8 = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
const med = (a) => { const s = [...a].sort((p, q) => p - q), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const H = Array.from({ length: D }, () => Array(W).fill(0));   // built height above y 0 (0 = no building, foundation only)
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inFP(x, z)) continue;
  const nb = NB8.map(([dx, dz]) => [x + dx, z + dz]).filter(([a, b]) => inFP(a, b)).map(([a, b]) => R[b][a]);
  const tall = nb.filter((v) => v >= 12), low = nb.filter((v) => v <= 3);
  let r = R[z][x];
  if (r <= 3 && tall.length > nb.length / 2) r = med(tall);
  if (r >= 12 && low.length > nb.length / 2) r = 0;
  // 2. Snap to the storey grid (multiples of 3 blocks: a 3-block storey per tier).
  H[z][x] = r <= 3 ? 0 : Math.min(24, Math.max(6, Math.round(r / 3) * 3));
}

// Top of the solid massing per cell: the building, or the ground if there is none (foundation only).
const T = (x, z) => (inFP(x, z) ? Math.max(H[z][x], G[z][x]) : 0);
const DIRS = { N: { dx: 0, dz: -1 }, S: { dx: 0, dz: 1 }, E: { dx: 1, dz: 0 }, W: { dx: -1, dz: 0 } };
const exposed = (x, z, y) => Object.entries(DIRS).filter(([, { dx, dz }]) => T(x + dx, z + dz) <= y).map(([d]) => d);
const key = (x, y, z) => `${x},${y},${z}`;
const pane = (d) => (d === "N" || d === "S" ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
const door = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
const lit = (x, y, z) => (x * 3 + y * 5 + z * 2) % 7 === 2;

// Pass 1: windows and their air gaps. A window sits in the outer layer of a storey's middle two rows (the spandrel
// course below is the sill and the slab); the cell behind it is air, unless it holds a lamp.
const win = new Map();   // key -> face direction
const air = new Map();   // key -> { b, s } (a lamp) or {} (empty)
const isWindow = (x, y, z, d) => {
  if (y % 3 === 0 || d === "W") return false;                        // spandrel rows, and the blank party wall
  if (d === "N" && y < 3) return x === 1 || x === 3 || x === 4 || x === 5 || x === 7;   // shopfront glass and the door
  return (d === "N" || d === "S" ? x : z) % 2 === 1;                 // bays: piers on even cells, windows on odd
};
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inFP(x, z)) continue;
  for (let y = G[z][x]; y < T(x, z) - 3; y++) {                      // not the cornice, frieze or cap
    const ex = exposed(x, z, y);
    const d = ["N", "S", "E", "W"].find((k) => ex.includes(k));
    if (!d || !isWindow(x, y, z, d)) continue;
    const ix = x - DIRS[d].dx, iz = z - DIRS[d].dz;
    if (!inFP(ix, iz) || T(ix, iz) <= y || exposed(ix, iz, y).length) continue;   // the gap must sit in the solid core
    win.set(key(x, y, z), d);
    const k = Math.floor(y / 3);
    let lamp = null;
    if (d === "N" && y === 2 && (x === 3 || x === 5)) lamp = { b: "lantern", s: { hanging: "true", waterlogged: "false" } };
    else if (y > 2 && lit(x, y, z)) lamp = { b: "glowstone" };
    air.set(key(ix, y, iz), lamp ?? {});
  }
}

// Pass 2: the massing, cell by cell from the bottom up.
function decide(x, y, z) {
  const t = T(x, z), g = G[z][x];
  if (y >= t) return null;
  const k = key(x, y, z);
  if (air.has(k)) return air.get(k).b ? air.get(k) : null;
  const ex = exposed(x, z, y);
  if (y < g) return { b: ex.includes("N") ? "polished_granite" : "stone" };          // foundation
  if (y === t - 1) return { b: ex.length ? "stone_bricks" : "gray_concrete" };         // parapet cap, or tar roof
  if (!ex.length) return { b: "stone" };                                                // core
  if (y === t - 3) return { b: "smooth_stone" };                                         // cornice
  if (y === t - 2) return { b: "bricks" };                                              // frieze under the cap
  const d = ["N", "S", "E", "W"].find((q) => ex.includes(q));
  const r = y % 3;
  if (r === 0 && y === 0 && d === "N") return { b: "polished_granite" };                // street base course
  if (r === 0) return { b: d === "N" && y === 3 && x >= 3 && x <= 5 ? "oxidized_cut_copper" : "smooth_stone" };   // storey line; canopy over the door
  if (win.has(k)) {
    if (d === "N" && y < 3) return x === 4 ? { b: "iron_door", s: door(r === 1 ? "lower" : "upper") } : { b: "glass_pane", s: pane(d) };
    return { b: "glass_pane", s: pane(d) };
  }
  if (d === "N" && y < 3) return { b: "polished_granite" };                             // shopfront piers
  return { b: "bricks" };
}

const out = new Voxels([W, Y, D]);
let solid = 0;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) for (let y = 0; y < T(x, z); y++) {
  const dd = decide(x, y, z);
  if (!dd) continue;
  out.set(x, y, z, dd.b, dd.s);
  solid++;
}

// Roof plant: two brick chimney stacks on the interior of the tower roof.
for (const [x, z] of [[3, 6], [2, 11]]) {
  if (T(x, z) !== 24 || exposed(x, z, 23).length) continue;
  out.set(x, 24, z, "bricks"); out.set(x, 25, z, "bricks"); out.set(x, 26, z, "stone_bricks");
}

const res = out.save(`${DIR}/NYC1035476.nbt`);
const tiers = [...new Set(H.flat().filter((v) => v > 0))].sort((a, b) => b - a);
console.log(`cells ${cells.length}, tiers ${tiers.join(",")}, solid ${solid}, windows ${win.size}, blocks ${res.blocks}, palette ${res.palette}`);
