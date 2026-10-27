// Grand Millennium Auckland: a late-20th-century concrete-and-glass hotel tower on a podium. The lidar roof (66 blocks
// over the lowest ground) gives about 16 storeys of 4 blocks; the footprint steps down from a 64-block core to 24-32 block
// wings. Facade: a light-concrete base course and spandrels, white piers every third block, tinted glass between, a
// cornice and parapet; a recessed entrance under a canopy with a door and hanging lanterns; warm glowstone behind some
// windows; plant boxes on the roof. The core is solid (no interiors), with a one-block air gap behind the glazing.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const CELLS = `${DIR}/way_260078287.cells.json`;
const OUT = `${DIR}/way_260078287.nbt`;

const X = 94, Z = 122, Y = 79;
const N = X * Z;
const ix = (x, z) => x * Z + z;
const inside = (x, z) => x >= 0 && z >= 0 && x < X && z < Z;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const fp = new Uint8Array(N), G = new Int32Array(N), R = new Int32Array(N);
for (const [x, z, g, r] of cells) { fp[ix(x, z)] = 1; G[ix(x, z)] = g; R[ix(x, z)] = r; }
const inFP = (x, z) => inside(x, z) && fp[ix(x, z)] === 1;

// Tiers: each cell's roof is the median of the lidar roofs within 2 cells (kills noise), quantized to 8 blocks; the
// ground band (shopfront) ends on an absolute 4-block storey line, so every storey line lines up across the building.
const ceil4 = (v) => Math.ceil(v / 4) * 4;
const T = new Int32Array(N), GB = new Int32Array(N);
for (const [x, z] of cells) {
  const vals = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (inFP(x + dx, z + dz)) vals.push(R[ix(x + dx, z + dz)]);
  vals.sort((a, b) => a - b);
  const med = vals[vals.length >> 1], c = ix(x, z);
  GB[c] = ceil4(G[c] + 3);
  T[c] = Math.max(Math.round(med / 8) * 8, GB[c] + 4);
}
const maxT = Math.max(...cells.map(([x, z]) => T[ix(x, z)]));

// A side is exposed at height y when the neighbour is off the footprint or has no body that high (a setback).
const exposedDirs = (x, z, y) => DIRS.filter(([dx, dz]) => {
  const nx = x + dx, nz = z + dz;
  return !inFP(nx, nz) || y >= T[ix(nx, nz)];
});

// Facade role of an exposed cell at height y: base course, cornice, spandrels (storey lines), piers, glazing.
function facadeKind(x, z, y, dirs) {
  const c = ix(x, z), g = G[c], gb = GB[c], t = T[c];
  if (y === t - 1) return "cornice";
  const u = dirs.some(([dx]) => dx !== 0) ? z : x;     // the bay axis runs along the wall
  if (y < gb) {
    if (y === g) return "base";
    if (y === gb - 1) return "spandrel";
  } else if (((y - gb) % 4) === 0 || ((y - gb) % 4) === 3) return "spandrel";
  return u % 3 === 0 ? "pier" : "glass";
}
const BLOCK = {
  base: "polished_andesite", spandrel: "light_gray_concrete", pier: "white_concrete",
  glass: "light_blue_stained_glass", cornice: "smooth_stone",
};

// Air behind a glazed cell: an interior cell with a glass facade on its far side at the same height.
function behindGlass(x, z, y) {
  for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (!inFP(nx, nz)) continue;
    const n = ix(nx, nz);
    if (y < G[n] || y >= T[n]) continue;
    const ed = exposedDirs(nx, nz, y);
    if (!ed.some(([ex, ez]) => ex === dx && ez === dz)) continue;   // its outward side faces us
    if (facadeKind(nx, nz, y, ed) === "glass") return true;
  }
  return false;
}

// Deterministic per-window hash: about 12% of the air-gapped windows are lit.
const lit = (x, y, z) => (((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0) % 100 < 12;

const g = new Voxels([X, Y, Z]);

for (const [x, z] of cells) {
  const c = ix(x, z), gc = G[c], t = T[c];
  for (let y = 0; y < gc; y++) g.set(x, y, z, "stone");          // foundation: nothing floats on the slope
  for (let y = gc; y < t; y++) {
    const ed = exposedDirs(x, z, y);
    if (ed.length) {
      g.set(x, y, z, BLOCK[facadeKind(x, z, y, ed)]);
    } else if (behindGlass(x, z, y)) {
      if (lit(x, y, z)) g.set(x, y, z, "glowstone");
    } else {
      g.set(x, y, z, y === t - 1 ? "gray_concrete" : "stone");   // roof membrane over the core
    }
  }
  if (exposedDirs(x, z, t).length) g.set(x, t, z, "white_concrete");   // parapet on the outer edge
}

// Entrance: the lowest straight run of five facade cells, recessed one cell with a door, lanterns and a canopy.
let ent = null;
for (const [x, z] of cells) for (const d of DIRS) {
  const y0 = G[ix(x, z)] + 1, [dx, dz] = d;
  if (!exposedDirs(x, z, y0).some(([ex, ez]) => ex === dx && ez === dz)) continue;
  const along = dx !== 0 ? [0, 1] : [1, 0];
  let ok = true;
  for (let k = -2; k <= 2 && ok; k++) {
    const px = x + k * along[0], pz = z + k * along[1];
    ok = inFP(px, pz) && exposedDirs(px, pz, y0).some(([ex, ez]) => ex === dx && ez === dz) && Math.abs(G[ix(px, pz)] - G[ix(x, z)]) <= 1;
  }
  if (!ok) continue;
  const score = G[ix(x, z)] * 1000 - T[ix(x, z)];
  if (!ent || score < ent.score) ent = { x, z, dx, dz, along, score };
}
if (ent) {
  const { x: ex, z: ez, dx, dz, along } = ent;
  const gE = G[ix(ex, ez)];
  const at = (k, dep) => [ex + k * along[0] - dep * dx, ez + k * along[1] - dep * dz];   // dep 0 = facade, 1 = just inside
  const facing = { "0,-1": "north", "0,1": "south", "1,0": "east", "-1,0": "west" }[`${dx},${dz}`];
  const doorState = (half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });
  for (let k = -2; k <= 2; k++) for (let dep = 0; dep <= 1; dep++) {          // canopy, carried on the walls either side
    const [px, pz] = at(k, dep);
    if (inFP(px, pz)) g.set(px, gE + 3, pz, "smooth_stone");
  }
  for (let k = -1; k <= 1; k++) for (let dep = 0; dep <= 1; dep++) {          // the recess: air up to the canopy
    if (k === 0 && dep === 0) continue;
    const [px, pz] = at(k, dep);
    if (!inFP(px, pz)) continue;
    for (let y = G[ix(px, pz)]; y < gE + 2; y++) g.set(px, y, pz, "air");
  }
  for (const k of [-1, 1]) {                                                    // lanterns hang under the canopy
    const [px, pz] = at(k, 0);
    if (inFP(px, pz)) g.set(px, gE + 2, pz, "lantern", { hanging: "true", waterlogged: "false" });
  }
  const [dpx, dpz] = at(0, 0);
  g.set(dpx, gE + 2, dpz, "light_gray_concrete");                               // lintel over the door
  g.set(dpx, gE, dpz, "oak_door", doorState("lower"));
  g.set(dpx, gE + 1, dpz, "oak_door", doorState("upper"));
}

// Roof: plant room on the tallest core, with a glazed band and a cap; a few air-handling units on the tiers below.
const top = cells.filter(([x, z]) => T[ix(x, z)] === maxT);
const cx = top.reduce((s, [x]) => s + x, 0) / top.length, cz = top.reduce((s, [, z]) => s + z, 0) / top.length;
const inTop = (x, z) => inFP(x, z) && T[ix(x, z)] === maxT;
const plant = top.filter(([x, z]) => Math.abs(x - cx) <= 7 && Math.abs(z - cz) <= 4 &&
  DIRS.every(([dx, dz]) => inTop(x + dx, z + dz)));
const inPlant = new Set(plant.map(([x, z]) => ix(x, z)));
for (const [x, z] of plant) {
  const edge = DIRS.some(([dx, dz]) => !inPlant.has(ix(x + dx, z + dz)));
  for (let y = maxT; y < maxT + 2; y++) g.set(x, y, z, edge && y === maxT + 1 ? "light_blue_stained_glass" : "light_gray_concrete");
  g.set(x, maxT + 2, z, "smooth_stone");
}
for (const [x, z] of cells) {
  const c = ix(x, z);
  if (T[c] >= maxT || !DIRS.every(([dx, dz]) => inFP(x + dx, z + dz) && T[ix(x + dx, z + dz)] === T[c])) continue;
  if (((x * 31 + z * 17) % 23) === 0) g.set(x, T[c], z, "iron_block");
}

const stats = g.save(OUT);
console.log(`way_260078287: ${cells.length} cells, tiers ${[...new Set(cells.map(([x, z]) => T[ix(x, z)]))].sort((a, b) => a - b).join(",")}, top ${maxT}, ${JSON.stringify(stats)}`);
