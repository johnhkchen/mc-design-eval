import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499705";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 12, H = 30, D = 12;
const g = new Voxels([W, H, D]);

// ---- footprint and lidar record ----
const fpKeys = new Set();
const info = new Map();
for (const c of cells) {
  const [x, z, gr, rf] = c;
  if (x < 0 || z < 0 || x >= W || z >= D) continue;
  const k = x + "," + z;
  fpKeys.add(k);
  info.set(k, { gr, rf });
}
if (fpKeys.size === 0) throw new Error("empty footprint");
const has = (x, z) => fpKeys.has(x + "," + z);

const grs = [...info.values()].map(v => v.gr).sort((a, b) => a - b);
const rfs = [...info.values()].map(v => v.rf).sort((a, b) => a - b);
const L = Math.max(0, Math.round(grs[grs.length - 1]));          // common ground-floor level
const median = Math.round(rfs[Math.floor(rfs.length / 2)]);       // smoothed roof height
const S = Math.max(3, Math.floor((median - L - 2) / 4));          // storey height
const f = [0, 1, 2, 3, 4].map(k => L + k * S);                    // f[0]=ground floor, f[4]=roof deck
const top = Math.max(median, f[4] + 1);                           // roof cap level
const PIL = [0, 3, 8, 11];                                        // pilaster bays along each face

// Entrance: south-facing perimeter cell nearest the middle of the facade
const southCells = [...fpKeys]
  .map(k => k.split(",").map(Number))
  .filter(([x, z]) => !has(x, z + 1))
  .sort((a, b) => Math.abs(a[0] - 5) - Math.abs(b[0] - 5));
const door = southCells.length ? southCells[0] : null;
const doorX = door ? door[0] : -99;
const doorZ = door ? door[1] : -99;

const isCore = (x, z) => x >= 4 && x <= 7 && z >= 4 && z <= 7;

// ---- build column by column ----
for (const key of fpKeys) {
  const [x, z] = key.split(",").map(Number);
  const nN = !has(x, z - 1), nS = !has(x, z + 1);
  const nW = !has(x - 1, z), nE = !has(x + 1, z);
  const per = nN || nS || nW || nE;
  const ns = nN || nS;
  const ew = nW || nE;

  // foundation: solid from 0 up to the common floor level
  for (let y = 0; y < L; y++) g.set(x, y, z, "granite");

  if (!per) {
    // interior: floor slabs, service core, air elsewhere
    if (isCore(x, z)) {
      for (let y = L; y <= f[4]; y++) g.set(x, y, z, "stone_bricks");
    } else {
      for (let k = 0; k < 4; k++) g.set(x, f[k], z, "smooth_stone");
      g.set(x, f[4], z, "deepslate_tiles");
    }
    continue;
  }

  // perimeter: walls, storey lines, window bands, parapet and coping
  const corner = ns && ew;
  const idx = ns ? x : z;
  const pilaster = corner || PIL.includes(idx);
  // door surround: the bays either side of the entrance
  const nearDoor = ns && nS && z === doorZ && Math.abs(x - doorX) === 1;

  for (let y = L; y <= top; y++) {
    if (y > f[4]) {
      if (y === top) g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      else g.set(x, y, z, "calcite");
      continue;
    }
    if (y === f[4]) { g.set(x, y, z, "stone_bricks"); continue; }
    let k = 0;
    for (let i = 0; i < 4; i++) if (f[i] <= y) k = i;
    if (y === f[k]) {
      g.set(x, y, z, k === 0 ? "granite" : "stone_bricks");
      continue;
    }
    // window band (f[k]+1 .. f[k]+S-1)
    if (pilaster || (k === 0 && nearDoor)) {
      g.set(x, y, z, "stone_bricks");
    } else {
      g.set(x, y, z, "glass_pane", {
        north: ns ? "true" : "false",
        south: ns ? "true" : "false",
        east: ew ? "true" : "false",
        west: ew ? "true" : "false",
        waterlogged: "false",
      });
    }
  }
}

// ---- entrance door on the south face, on the ground floor ----
if (door) {
  const [dx, dz] = door;
  g.set(dx, L + 1, dz, "oak_door", { facing: "south", hinge: "left", open: "false", powered: "false", half: "lower" });
  g.set(dx, L + 2, dz, "oak_door", { facing: "south", hinge: "left", open: "false", powered: "false", half: "upper" });
}

// ---- rooftop plant housing on the deck ----
for (const [x, z] of [[8, 2], [9, 2], [8, 3], [9, 3]]) {
  if (!has(x, z)) continue;
  for (let y = f[4] + 1; y <= f[4] + 2 && y < H; y++) g.set(x, y, z, "smooth_stone");
}

// ---- warm lanterns standing on the floor slabs, behind some windows ----
for (const key of fpKeys) {
  const [x, z] = key.split(",").map(Number);
  if (isCore(x, z)) continue;
  const ring = x === 1 || x === 10 || z === 1 || z === 10;
  if (!ring) continue;
  for (let k = 0; k < 4; k++) {
    if ((x + z + k) % 4 === 0) {
      g.set(x, f[k] + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
