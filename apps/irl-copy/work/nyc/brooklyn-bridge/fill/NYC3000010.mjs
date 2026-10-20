import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3000010";
const W = 46, H = 49, D = 44;

// 20 Jay Street, DUMBO, 1909: red-brick loft/office block on a granite base,
// stone string courses, a shopfront with a central entrance, a stone cornice, flat roof.
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : raw.cells;

const key = (x, z) => `${x},${z}`;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ---- cell map -----------------------------------------------------------
const cellMap = new Map();
for (const c of list) {
  const [x, z, gr, rf] = c;
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const g0 = clamp(Math.round(gr), 0, H - 12);
  cellMap.set(key(x, z), { x, z, g0, rawRoof: rf, top: 0 });
}
const has = (x, z) => cellMap.has(key(x, z));

// ---- roof massing: wider smoothing, even tiers, then a flat main roof ---
// Wide average removes lidar noise; even snapping gives storey-aligned tiers.
for (const c of cellMap.values()) {
  let sum = 0, n = 0;
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    const o = cellMap.get(key(c.x + dx, c.z + dz));
    if (o) { sum += o.rawRoof; n++; }
  }
  const mean = sum / n;
  c.top = clamp(2 * Math.round(mean / 2), c.g0 + 8, H - 4);
}

// Snap cells within 2 blocks of the dominant roof height onto it, so the
// main roof reads as one flat plane; real setbacks (further down) are kept.
{
  const counts = new Map();
  for (const c of cellMap.values()) counts.set(c.top, (counts.get(c.top) || 0) + 1);
  let mode = null, best = -1;
  for (const [t, k] of counts) if (k > best) { best = k; mode = t; }
  for (const c of cellMap.values()) {
    if (Math.abs(c.top - mode) <= 2) c.top = mode;
  }
}

// ---- exposure helpers ---------------------------------------------------
function exposure(c) {
  return {
    N: !has(c.x, c.z - 1), // -z
    S: !has(c.x, c.z + 1), // +z
    W: !has(c.x - 1, c.z), // -x
    E: !has(c.x + 1, c.z), // +x
  };
}

// ---- entrance: on the north (-z) street face, at the middle of the frontage
let doorCell = null, doorFacing = "north";
{
  const cands = [...cellMap.values()].filter(c => exposure(c).N);
  if (cands.length) {
    cands.sort((a, b) => a.x - b.x);
    doorCell = cands[Math.floor(cands.length / 2)];
  } else {
    const any = [...cellMap.values()].filter(c => { const e = exposure(c); return e.N || e.S || e.W || e.E; });
    if (any.length) { doorCell = any[Math.floor(any.length / 2)]; doorFacing = "south"; }
  }
}
const isDoorCell = (x, z) => doorCell && doorCell.x === x && doorCell.z === z;
// Cells flanking the door along the wall get granite jambs.
const isJamb = (x, z) => doorCell && doorFacing === "north" && z === doorCell.z &&
  (Math.abs(x - doorCell.x) === 1);

// ---- build --------------------------------------------------------------
const g = new Voxels([W, H, D]);

for (const c of cellMap.values()) {
  const { x, z, g0, top } = c;
  const e = exposure(c);
  const wall = e.N || e.S || e.W || e.E;
  const alongX = (e.N || e.S) && !(e.W || e.E);
  const alongZ = (e.W || e.E) && !(e.N || e.S);
  const corner = (e.N || e.S) && (e.W || e.E);
  const u = alongX ? x : (alongZ ? z : x + z);

  // foundation under every cell, so nothing floats on the slope
  for (let y = 0; y < g0; y++) g.set(x, y, z, "stone_bricks");

  if (!wall) {
    // interior: loft floors with air between, roof slab on top; no rooftop spikes
    g.set(x, g0, z, "stone");
    for (let y = g0 + 2; y < top - 1; y += 2) g.set(x, y, z, "smooth_stone");
    g.set(x, top - 1, z, "stone_bricks");
    continue;
  }

  for (let y = g0; y < top; y++) {
    const rel = y - g0;
    let blk = null, props;

    if (y < g0 + 2) {
      // granite base course
      blk = "polished_granite";
    } else if (y < g0 + 4) {
      // ground-floor shopfront with entrance
      if (isDoorCell(x, z)) {
        blk = "dark_oak_door";
        props = { facing: doorFacing, half: y === g0 + 2 ? "lower" : "upper",
                  hinge: "left", open: "false", powered: "false" };
      } else if (isJamb(x, z)) {
        blk = "polished_granite";
      } else if (corner || u % 4 === 0) {
        blk = "polished_andesite";
      } else {
        blk = "glass";
      }
    } else if (y >= top - 3) {
      // cornice and parapet
      if (y === top - 3) blk = "bricks";
      else if (y === top - 2) blk = "stone_bricks";
      else blk = "smooth_stone";
    } else if (rel % 4 === 0) {
      // storey string course
      blk = "stone_bricks";
    } else if (rel % 4 === 2) {
      // spandrel: brick, with a lintel course of stone above the windows
      blk = "bricks";
    } else {
      // window row: brick piers, glass panes between, some lit from behind
      if (corner || u % 3 === 0) {
        blk = "bricks";
      } else {
        const lit = ((x * 7 + z * 13 + y * 5) % 9) === 0;
        blk = lit ? "glowstone" : "glass";
      }
    }

    if (blk) g.set(x, y, z, blk, props);
  }

  // roof cap
  g.set(x, top - 1, z, "stone_bricks");
}

g.save(`${DIR}/${ID}.nbt`);
