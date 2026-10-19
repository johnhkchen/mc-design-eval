// DC87515: E. Barrett Prettyman U.S. Courthouse, 333 Constitution Ave NW, as a 1.21.1 module.
// A 1950s federal courthouse: a limestone-clad (calcite) block with a stone base, a chiseled cornice and a parapet,
// and tall window bays on every face. The lidar roof is median-smoothed (3x3) and snapped to four flat tiers
// (10, 12, 14, 16 above y 0), so the wings are lower and the centre pavilion stands above the main block.
// Storeys are 4 blocks: a spandrel course, two rows of glazing, and a lintel course. Every column is solid from
// y 0 to its tier, so nothing floats on the slope. Glass sits in a one-deep air gap behind the outer wall, with
// lanterns in a quarter of the windows. The main entrance is a recessed bay with a door, two columns and a lintel.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC87515.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC87515.nbt";

const W = 61, H = 27, D = 55;
const CALCITE = "calcite", FOUND = "stone_bricks", BASE = "stone_bricks", CORNICE = "chiseled_stone_bricks";
const ROOF = "smooth_stone", PARAPET = "stone_brick_slab", GLASS = "light_blue_stained_glass_pane";
const BOX = "light_gray_concrete", DOOR = "iron_door", COLUMN = "quartz_pillar";

const key = (x, z) => `${x},${z}`;
const k3 = (x, y, z) => `${x},${y},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inF = (x, z) => F.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];                 // east, west, south, north
const DIR_NAME = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const exposure = (x, z) => DIRS.filter(([dx, dz]) => !inF(x + dx, z + dz));

// Smoothed roof: median of the footprint cells in the 3x3 around each cell, then snapped to the four flat tiers.
const TIERS = [10, 12, 14, 16];
const snap = (v) => (v <= 10 ? 10 : v <= 12 ? 12 : v <= 14 ? 14 : 16);   // ties go up
const T = new Map();
for (const c of F.values()) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = F.get(key(c.x + dx, c.z + dz)); if (n) vals.push(n.r);
  }
  vals.sort((a, b) => a - b);
  T.set(key(c.x, c.z), snap(vals[vals.length >> 1]));
}
const top = (x, z) => T.get(key(x, z));

// Depth: 0 on the outer ring, then one more per step inward (breadth-first over footprint neighbours).
const depth = new Map(); const q = [];
for (const c of F.values()) if (exposure(c.x, c.z).length) { depth.set(key(c.x, c.z), 0); q.push(c); }
for (let i = 0; i < q.length; i++) {
  const c = q[i], d = depth.get(key(c.x, c.z));
  for (const [dx, dz] of DIRS) {
    const k = key(c.x + dx, c.z + dz);
    if (F.has(k) && !depth.has(k)) { depth.set(k, d + 1); q.push(F.get(k)); }
  }
}
const dep = (x, z) => depth.get(key(x, z));

// Storey bands from y 2: y%4 offset 0 = spandrel, 1 and 2 = glazing, 3 = lintel.
const band = (y) => (y >= 2 ? (y - 2) % 4 : -1);

// Overrides: windows (outer panes), the air gap behind them, and the entrance bay.
const win = new Map(), gap = new Map(), ent = new Map();

// Main entrance: the longest run of single-exposure outer cells (tier 12 or above) on one face.
const faces = new Map();
for (const c of F.values()) {
  const ex = exposure(c.x, c.z);
  if (ex.length !== 1 || top(c.x, c.z) < 12) continue;
  const [dx, dz] = ex[0];
  const k = `${dx},${dz}`, a = dz !== 0 ? c.x : c.z;
  if (!faces.has(k)) faces.set(k, []);
  faces.get(k).push({ a, c });
}
let best = null;
for (const [k, list] of faces) {
  list.sort((p, q2) => p.a - q2.a);
  let run = [];
  for (const item of list) {
    if (run.length && item.a !== run[run.length - 1].a + 1) { run = []; }
    run.push(item);
    if (!best || run.length > best.run.length) best = { dir: k, run: [...run] };
  }
}
let entrance = null;
if (best && best.run.length >= 5) {
  const [dx, dz] = best.dir.split(",").map(Number);
  const lo = best.run[0].a, hi = best.run[best.run.length - 1].a, cA = Math.floor((lo + hi) / 2);
  const face = best.run.find((r) => r.a === cA).c;
  const inward = { x: face.x - dx, z: face.z - dz };
  if (inF(inward.x, inward.z) && dep(inward.x, inward.z) >= 1) entrance = { dx, dz, face, inward, cA };
}

// Glass panes on the outer ring: not at corners, not on the pier grid (every third cell along the face).
// The pane connects along the face; the air gap behind it is the next cell in (depth 1).
const lit = (x, y, z) => (x + z + Math.floor(y / 4)) % 4 === 0;
for (const c of F.values()) {
  if (dep(c.x, c.z) !== 0) continue;
  const ex = exposure(c.x, c.z);
  if (ex.length !== 1) continue;
  const [dx, dz] = ex[0];
  const a = dz !== 0 ? c.x : c.z;
  if (a % 3 === 0) continue;
  const ix = c.x - dx, iz = c.z - dz;
  if (!inF(ix, iz) || dep(ix, iz) < 1) continue;
  const alongX = dz !== 0;                                     // a north or south face runs along x
  for (let y = Math.max(c.g, 2); y <= top(c.x, c.z) - 2; y++) {
    const b = band(y);
    if (b !== 1 && b !== 2) continue;
    const pane = { east: alongX ? "true" : "false", west: alongX ? "true" : "false",
      north: alongX ? "false" : "true", south: alongX ? "false" : "true", waterlogged: "false" };
    win.set(k3(c.x, y, c.z), { block: GLASS, state: pane });
    gap.set(k3(ix, y, iz), lit(c.x, y, c.z) ? { block: "lantern", state: { hanging: "false", waterlogged: "false" } } : { block: "air" });
  }
}

// Entrance bay: a door on the face (lower and upper halves), two columns flanking it, air in the vestibule.
if (entrance) {
  const { dx, dz, face, inward, cA } = entrance;
  const facing = DIR_NAME[`${dx},${dz}`];
  const along = (o) => (dz !== 0 ? { x: cA + o, z: face.z } : { x: face.x, z: cA + o });
  const door = { facing, hinge: "left", open: "false", powered: "false" };
  const d0 = along(0);
  for (let y = face.g; y <= face.g + 3; y++) {
    for (const o of [-1, 1]) {
      const p = along(o);
      if (inF(p.x, p.z)) ent.set(k3(p.x, y, p.z), { block: COLUMN, state: { axis: "y" } });
    }
    gap.set(k3(inward.x, y, inward.z), { block: "air" });
  }
  ent.set(k3(d0.x, face.g, d0.z), { block: DOOR, state: { ...door, half: "lower" } });
  ent.set(k3(d0.x, face.g + 1, d0.z), { block: DOOR, state: { ...door, half: "upper" } });
  for (let y = face.g + 2; y <= face.g + 3; y++) ent.set(k3(d0.x, y, d0.z), { block: CALCITE });
}

// Roof plant: small light-grey boxes on the interior of the tallest tiers, 2 by 2, standing on the roof.
const boxes = new Set();
for (const c of F.values()) {
  if (dep(c.x, c.z) < 3 || top(c.x, c.z) < 14) continue;
  if (c.x % 12 !== 6 || c.z % 9 !== 4) continue;
  const quad = [[c.x, c.z], [c.x + 1, c.z], [c.x, c.z + 1], [c.x + 1, c.z + 1]];
  if (quad.every(([x, z]) => inF(x, z) && dep(x, z) >= 2 && top(x, z) === top(c.x, c.z)))
    for (const [x, z] of quad) boxes.add(key(x, z) + "," + top(c.x, c.z));
}

// Build: column per footprint cell from y 0 up to its tier.
const v = new Voxels([W, H, D]);
for (const c of F.values()) {
  const { x, z, g } = c, t = top(x, z), d = dep(x, z), outer = d === 0;
  for (let y = 0; y < t; y++) {
    const k = k3(x, y, z);
    if (ent.has(k)) { const e = ent.get(k); v.set(x, y, z, e.block, e.state); continue; }
    if (gap.has(k)) { const e = gap.get(k); v.set(x, y, z, e.block, e.state); continue; }
    if (win.has(k)) { const e = win.get(k); v.set(x, y, z, e.block, e.state); continue; }
    if (y < g) { v.set(x, y, z, FOUND); continue; }                            // foundation under the ground
    if (y === t - 1) { v.set(x, y, z, outer ? CORNICE : ROOF); continue; }     // top course or roof cover
    if (outer && y === 2) { v.set(x, y, z, BASE); continue; }                  // base course at the street
    v.set(x, y, z, CALCITE);
  }
  if (outer) v.set(x, t, z, PARAPET, { type: "bottom", waterlogged: "false" });   // parapet on the outer ring
}
for (const s of boxes) {
  const [x, z, y] = s.split(",").map(Number);
  v.set(x, y, z, BOX);
  v.set(x, y + 1, z, BOX);
}
// The air gaps are holes in the solid interior: a gap cell that the column loop skipped must be air, which it is.

const out = v.save(OUT);
console.log(JSON.stringify({ blocks: out.blocks, palette: out.palette, entrance: entrance ? { dir: DIR_NAME[`${entrance.dx},${entrance.dz}`], at: [entrance.face.x, entrance.face.z] } : null, windows: win.size, boxes: boxes.size }));
