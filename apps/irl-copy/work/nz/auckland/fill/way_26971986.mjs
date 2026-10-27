// A 1970s office block (precast concrete over a basalt-clad plinth, tinted glazing in grey frames) on a
// footprint that steps from a lower wing (9) through the body (13) to a 4-storey tower (17). Lidar roofs are
// median-filtered, then quantised to those three flat tiers so the setbacks read as tiers, not noise.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${HERE}/way_26971986.cells.json`, "utf8"));
const OUT = `${HERE}/way_26971986.nbt`;
const W = 66, H = 30, D = 59;

const k = (x, z) => `${x},${z}`;
const DIR = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const OPP = { north: "south", south: "north", west: "east", east: "west" };
const NS = (d) => d === "north" || d === "south";

const roofRaw = new Map();
for (const [x, z, , r] of cells) roofRaw.set(k(x, z), r);

// Top of each column: lidar median over the 3x3 neighbourhood, quantised to three flat tiers, and at least one storey over its ground.
const top = new Map();
for (const [x, z, g] of cells) {
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const r = roofRaw.get(k(x + dx, z + dz)); if (r !== undefined) vals.push(r);
  }
  vals.sort((a, b) => a - b);
  const s = vals[vals.length >> 1];
  const tier = s <= 11 ? 9 : s <= 15 ? 13 : 17;
  top.set(k(x, z), Math.max(tier, g + 4));
}

// A face is an outside wall where the neighbour is off the footprint, or where the neighbour stands lower than height y (a setback).
const exposed = (x, z, y) => Object.keys(DIR).filter((d) => {
  const [dx, dz] = DIR[d]; const n = k(x + dx, z + dz);
  return !top.has(n) || y >= top.get(n);
});

// Entrances: on each side, the middles of the two longest straight runs of outside faces (3+ cells), each with its inner cell in the footprint.
const doors = new Map();
for (const d of Object.keys(DIR)) {
  const [dx, dz] = DIR[d];
  const lines = new Map();
  for (const [x, z] of cells) {
    if (top.has(k(x + dx, z + dz))) continue;
    const line = NS(d) ? z : x, along = NS(d) ? x : z;
    if (!lines.has(line)) lines.set(line, []);
    lines.get(line).push(along);
  }
  const runs = [];
  for (const [line, alongs] of lines) {
    alongs.sort((a, b) => a - b);
    let run = [];
    for (const a of alongs) {
      if (run.length && a !== run[run.length - 1] + 1) { runs.push({ line, run }); run = []; }
      run.push(a);
    }
    if (run.length) runs.push({ line, run });
  }
  runs.sort((p, q) => q.run.length - p.run.length);
  for (const { line, run } of runs.slice(0, 2)) {
    if (run.length < 3) continue;
    const a = run[run.length >> 1];
    const [x, z] = NS(d) ? [a, line] : [line, a];
    if (top.has(k(x - dx, z - dz))) doors.set(k(x, z), d);
  }
}

const v = new Voxels([W, H, D]);
// Pane connections run along the wall, so a window band reads as one continuous glazed strip.
const pane = (face) => NS(face)
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const door = (facing, half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });

for (const [x, z, g] of cells) {
  const t = top.get(k(x, z));
  for (let y = 0; y < g; y++) v.set(x, y, z, "deepslate_bricks");           // basalt foundation up to the ground
  for (let y = g; y < t; y++) {
    const rel = y - g, b = rel % 4, ex = exposed(x, z, y);
    if (y === t - 1) { v.set(x, y, z, "light_gray_concrete"); continue; }    // roof deck
    if (!ex.length) { if (b === 0) v.set(x, y, z, "smooth_stone"); continue; } // interior: floor slab, air gap otherwise
    if (y === t - 2) { v.set(x, y, z, "white_concrete"); continue; }         // cornice
    if (rel === 0) { v.set(x, y, z, "polished_deepslate"); continue; }      // base course
    if (b === 0) { v.set(x, y, z, "white_concrete"); continue; }            // string course at each floor
    const face = ex[0];
    if (b === 3) {                                                          // fascia / spandrel; lintel over an entrance
      v.set(x, y, z, doors.has(k(x, z)) && rel === 3 ? "white_concrete" : "light_gray_concrete");
      continue;
    }
    if (doors.has(k(x, z)) && rel <= 2) {                                   // entrance door, two halves
      v.set(x, y, z, "dark_oak_door", door(doors.get(k(x, z)), rel === 1 ? "lower" : "upper")); continue;
    }
    const along = NS(face) ? x : z;
    const ground = rel < 4;
    if (ground ? along % 4 === 0 : along % 3 === 0) { v.set(x, y, z, "gray_concrete"); continue; } // dark frame mullions
    v.set(x, y, z, "light_blue_stained_glass_pane", pane(face));
    // a warm lamp on the floor just behind some panes
    if (b === 1 && (x * 31 + z * 17 + y * 7) % 6 === 0) {
      const [ix, iz] = [x + DIR[OPP[face]][0], z + DIR[OPP[face]][1]];
      const ig = k(ix, iz);
      if (top.has(ig) && y < top.get(ig) && !exposed(ix, iz, y).length && !doors.has(ig)) v.set(ix, y, iz, "glowstone");
    }
  }
}

// Roof plant: a few grey units on the body roof, well inside the edges (one 2x2 unit per 16-block cell).
const roofInner = (x, z, t) => [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]
  .every(([dx, dz]) => top.has(k(x + dx, z + dz)) && top.get(k(x + dx, z + dz)) >= t);
for (const [x, z] of cells) {
  const t = top.get(k(x, z));
  if (t === 13 && x % 16 === 6 && z % 16 === 6 && roofInner(x, z, t)) {
    v.set(x, t, z, "light_gray_concrete"); v.set(x, t + 1, z, "iron_block");
  }
}

// Tower: a 3x3 stair-and-lift penthouse on the top tier, centred on the tower cell nearest its centroid.
const tower = cells.filter(([x, z]) => top.get(k(x, z)) === 17);
if (tower.length) {
  const cx = tower.reduce((s, [x]) => s + x, 0) / tower.length, cz = tower.reduce((s, [, z]) => s + z, 0) / tower.length;
  const [tx, tz] = tower.reduce((best, c) => Math.hypot(c[0] - cx, c[1] - cz) < Math.hypot(best[0] - cx, best[1] - cz) ? c : best);
  let whole = true;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (top.get(k(tx + dx, tz + dz)) !== 17) whole = false;
  if (whole) for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    v.set(tx + dx, 17, tz + dz, "light_gray_concrete");
    v.set(tx + dx, 18, tz + dz, "light_gray_concrete");
    v.set(tx + dx, 19, tz + dz, "white_concrete");
  }
}

const stats = v.save(OUT);
console.log(JSON.stringify({ cells: cells.length, tiers: [...new Set([...top.values()])].sort((a, b) => a - b), doors: doors.size, ...stats }));
