// 1345 Avenue of the Americas (Alliance Capital, 1968): a Miesian office slab. A granite podium of two storeys
// (shopfront at street level, a portal on the south face), then a tinted curtain wall on 3-block storeys with
// light-concrete piers, spandrels, iron mullions, lit bays and a north crown. Roof tiers come from the lidar
// (5x5 median of the valid returns, snapped to the three heights the roof keeps: 167 lower wing, 174 main roof,
// 178 north crown). Foundations run from y 0 up to each cell's ground; the storeys stand on the plinth at y 2.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const W = 58, D = 17, H = 190;
const BASE = 2, STOREY = 3;
const lastX = W - 1, lastZ = D - 1;

const cells = JSON.parse(readFileSync(`${DIR}/NYC1083719.cells.json`, "utf8"));
const ground = new Map(), lidar = new Map();
for (const [x, z, g, r] of cells) { ground.set(`${x},${z}`, g); lidar.set(`${x},${z}`, r); }

const TIERS = [167, 174, 178];
function roofTop(x, z) {
  const v = [];
  for (let i = Math.max(0, x - 2); i <= Math.min(lastX, x + 2); i++)
    for (let j = Math.max(0, z - 2); j <= Math.min(lastZ, z + 2); j++) { const r = lidar.get(`${i},${j}`); if (r >= 100) v.push(r); }
  v.sort((a, b) => a - b);
  const m = v.length ? v[v.length >> 1] : 174;
  return TIERS.reduce((a, b) => (Math.abs(b - m) < Math.abs(a - m) ? b : a));
}

// Deterministic per-cell hash, so the lit bays and the glass tint are the same on every run.
const hash = (...a) => a.reduce((h, v) => Math.imul(h ^ v, 2654435761) >>> 0, 2166136261) >>> 0;

const ring = (x, z) => x === 0 || x === lastX || z === 0 || z === lastZ;
// Piers every 6 cells on each face (and at the ends), two cells deep so the facade has relief.
const pierN = (x) => x % 6 === 0 || x === lastX;
const pierW = (z) => z % 6 === 0 || z === lastZ;
function pier(x, z) {
  if ((z === 0 || z === lastZ) && pierN(x)) return true;
  if ((x === 0 || x === lastX) && pierW(z)) return true;
  if (z === 1 && x >= 1 && x <= lastX - 1 && pierN(x)) return true;
  if (z === lastZ - 1 && x >= 1 && x <= lastX - 1 && pierN(x)) return true;
  if (x === 1 && z >= 1 && z <= lastZ - 1 && pierW(z)) return true;
  if (x === lastX - 1 && z >= 1 && z <= lastZ - 1 && pierW(z)) return true;
  return false;
}
// Interior cell directly behind a glass cell on the ring (where a warm light sits in the air gap).
function behind(x, z) {
  if (z === 0) return [x, 1];
  if (z === lastZ) return [x, lastZ - 1];
  if (x === 0) return [1, z];
  return [lastX - 1, z];
}
// Structural columns in the open floor plate, so every slab stands on something.
const COLUMNS = new Set();
for (const x of [8, 20, 32, 44]) for (const z of [5, 11]) COLUMNS.add(`${x},${z}`);

const TINT = (x, y, z) => (hash(x, y, z) % 5 === 0 ? "gray_stained_glass" : "light_blue_stained_glass");

// What stands at (x, y, z): [block, state] or null for air.
function facade(x, y, z, T, edge) {
  const k = Math.floor((y - BASE) / STOREY), p = (y - BASE) % STOREY;
  if (y === T - 1) return edge ? ["polished_granite"] : ["gray_concrete"];        // roof cap / cornice
  if (z === lastZ && x >= 37 && x <= 39 && (y === 3 || y === 4)) {                 // south portal: iron door, glass, lanterns
    if (x === 38) return ["iron_door", { facing: "south", half: y === 3 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
    if (y === 4) return ["lantern", { hanging: "true", waterlogged: "false" }];
    return ["light_blue_stained_glass"];
  }
  if (!edge && COLUMNS.has(`${x},${z}`)) return ["light_gray_concrete"];
  if (pier(x, z)) return [k < 2 ? "polished_granite" : "light_gray_concrete"];
  if (!edge) return p === 0 ? ["smooth_stone"] : null;                              // floor slab, air gap above
  if (p === 0 || p === 2) return [k < 2 ? "polished_granite" : "gray_concrete"];    // base course / lintel / spandrel
  const mull = (z === 0 || z === lastZ) ? x % 3 === 0 : z % 3 === 0;
  if (mull) return [k < 2 ? "polished_granite" : "iron_block"];
  if (k === 0) return ["light_blue_stained_glass"];
  return [TINT(x, y, z)];
}

const g = new Voxels([W, H, D]);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const gr = ground.get(`${x},${z}`), T = roofTop(x, z), edge = ring(x, z);
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");                            // foundation up to the ground
  for (let y = gr; y < BASE; y++) g.set(x, y, z, edge ? "polished_granite" : "stone"); // plinth to the storeys
  for (let y = BASE; y < T; y++) {
    const f = facade(x, y, z, T, edge);
    if (!f) continue;
    g.set(x, y, z, f[0], f[1]);
    // Lit bays: a glowstone (shroomlight in the shopfront) behind a glass cell in the air gap.
    const k = Math.floor((y - BASE) / STOREY), p = (y - BASE) % STOREY;
    const isGlass = edge && p === 1 && !pier(x, z) && f[0].endsWith("glass");
    if (isGlass && (k === 0 ? hash(x, y, z) % 3 === 0 : hash(x, y, z) % 9 === 0)) {
      const [bx, bz] = behind(x, z);
      g.set(bx, y, bz, k === 0 ? "shroomlight" : "glowstone");
    }
  }
}

// Roof plant on the main roof, lanterns along the crown's north parapet.
const plant = [[18, 21, 6, 7, 2, "light_gray_concrete"], [38, 41, 9, 10, 2, "light_gray_concrete"], [26, 29, 4, 5, 1, "iron_block"]];
for (const [x0, x1, z0, z1, h, b] of plant)
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) for (let y = 174; y < 174 + h; y++) g.set(x, y, z, b);
for (const x of [16, 24, 32, 40]) g.set(x, 178, 0, "lantern", { hanging: "false", waterlogged: "false" });

const out = g.save(`${DIR}/NYC1083719.nbt`);
console.log(JSON.stringify(out));
