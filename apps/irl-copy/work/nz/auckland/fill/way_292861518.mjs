import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// NZMA: an eleven-storey concrete office block of the 1970s. Lidar roof heights are smoothed into three flat tiers
// (tower 44, podium 38, wing 30); each column stands on its own foundation from y 0, so the downhill faces show extra
// storeys. Facades: white concrete piers on a five-block bay, storey bands, tinted glass in the window rows, a cornice,
// a base course, a two-deep street porch on the north face with a canopy and hanging lanterns, and a rooftop plant box
// with a mast. Glass sits in front of a one-block air gap, lit by glowstone in some windows. Solid concrete core.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_292861518.cells.json`, "utf8"));

const W = 33, D = 35, H = 57;
const GR = Array.from({ length: W }, () => Array(D).fill(0));   // ground under each cell
const TP = Array.from({ length: W }, () => Array(D).fill(0));   // flat roof tier (0 = outside the footprint)
const tier = (r) => (r >= 42 ? 44 : r >= 33 ? 38 : 30);
for (const [x, z, gr, r] of cells) { GR[x][z] = gr; TP[x][z] = tier(r); }

const K = (x, y, z) => `${x},${y},${z}`;
const DIRS = [[0, -1], [0, 1], [1, 0], [-1, 0]];
const inFoot = (x, z) => x >= 0 && z >= 0 && x < W && z < D && TP[x][z] > 0;
const M = {
  plinth: "stone_bricks", base: "polished_andesite", cornice: "polished_andesite", band: "gray_concrete",
  pier: "white_concrete", glass: "light_blue_stained_glass", core: "light_gray_concrete", roof: "gray_concrete",
  canopy: "smooth_stone", box: "light_gray_concrete", boxTop: "gray_concrete",
};
const LIT = "glowstone";

// the street porch: the north row's middle cell, a two-deep recess with the door on its back wall
const row0 = [];
for (let x = 0; x < W; x++) if (inFoot(x, 0)) row0.push(x);
const x0 = row0[row0.length >> 1];
const porchCells = [x0 - 1, x0, x0 + 1].filter((x) => inFoot(x, 0)).map((x) => [x, 0]);
const maxGr = Math.max(GR[x0][1], ...porchCells.map(([x, z]) => GR[x][z]));
const F1 = 4 * Math.floor(maxGr / 4) + 4;            // first storey line above the porch floor

const porch = new Set();
for (const [x, z] of porchCells) for (let y = GR[x][z]; y < F1; y++) porch.add(K(x, y, z));

const isAir = (x, y, z) => !inFoot(x, z) || y >= TP[x][z] || porch.has(K(x, y, z));
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => isAir(x + dx, y, z + dz));
// a stair-stepped outline makes most cells touch two faces: the north-south face wins, so each run keeps its bays
const faceOf = (ex) => ex.find(([, dz]) => dz !== 0) ?? ex[0];

// the doorway, canopy and lanterns, and the roof plant box with its mast
const doors = new Map(), extras = new Map();
const gr1 = GR[x0][1];
doors.set(K(x0, gr1, 1), ["iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }]);
doors.set(K(x0, gr1 + 1, 1), ["iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }]);
for (let x = x0 - 2; x <= x0 + 2; x++) for (const z of [0, 1]) if (inFoot(x, z)) extras.set(K(x, F1, z), [M.canopy]);
for (const x of [x0 - 1, x0 + 1]) extras.set(K(x, F1 - 1, 0), ["lantern", { hanging: "true", waterlogged: "false" }]);

const tower = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inFoot(x, z) && TP[x][z] === 44) tower.push([x, z]);
const cx = Math.round(tower.reduce((s, [x]) => s + x, 0) / tower.length);
const cz = Math.round(tower.reduce((s, [, z]) => s + z, 0) / tower.length);
for (let x = cx - 2; x <= cx + 2; x++) for (let z = cz - 1; z <= cz + 1; z++) {
  if (!inFoot(x, z) || TP[x][z] !== 44) continue;
  extras.set(K(x, 44, z), [M.box]);
  extras.set(K(x, 45, z), [M.box]);
  extras.set(K(x, 46, z), [M.boxTop]);
}
if (inFoot(cx, cz) && TP[cx][cz] === 44)
  for (let y = 47; y <= 52; y++) extras.set(K(cx, y, cz), ["iron_bars", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" }]);

// air gaps behind the glass: one cell in, on window rows only, never next to the outside on another face
const gaps = new Map();
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inFoot(x, z)) continue;
  for (let y = GR[x][z]; y < TP[x][z]; y++) {
    if (y % 4 === 0 || y === GR[x][z] || y === TP[x][z] - 1 || porch.has(K(x, y, z))) continue;
    const ex = exposed(x, y, z);
    if (!ex.length) continue;
    const [dx, dz] = faceOf(ex);
    const bay = dz !== 0 ? x : z;
    if (bay % 5 === 0) continue;
    const gx = x - dx, gz = z - dz;
    if (!inFoot(gx, gz) || y < GR[gx][gz] || y >= TP[gx][gz] || porch.has(K(gx, y, gz))) continue;
    if (exposed(gx, y, gz).length) continue;
    const lit = (gx * 73 + y * 131 + gz * 197) % 11 === 0;
    gaps.set(K(gx, y, gz), lit ? [LIT] : null);
  }
}

function decide(x, y, z) {
  const k = K(x, y, z);
  if (doors.has(k)) return doors.get(k);
  if (extras.has(k)) return extras.get(k);
  if (porch.has(k)) return null;
  if (gaps.has(k)) return gaps.get(k);
  const gr = GR[x][z], t = TP[x][z];
  if (y >= t) return null;
  if (y < gr) return [M.plinth];
  const ex = exposed(x, y, z);
  if (!ex.length) return y === t - 1 ? [M.roof] : [M.core];
  if (y === t - 1) return [M.cornice];
  if (y === gr) return [M.base];
  if (y % 4 === 0) return [M.band];
  const bay = faceOf(ex)[1] !== 0 ? x : z;
  return bay % 5 === 0 ? [M.pier] : [M.glass];
}

const g = new Voxels([W, H, D]);
let placed = 0;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) for (let y = 0; y < H; y++) {
  const b = decide(x, y, z);
  if (!b) continue;
  g.set(x, y, z, b[0], b[1]);
  placed++;
}
const stats = g.save(`${DIR}/way_292861518.nbt`);
console.log(JSON.stringify({ entrance: { x0, F1 }, tower: { cx, cz }, gaps: gaps.size, placed, ...stats }));
