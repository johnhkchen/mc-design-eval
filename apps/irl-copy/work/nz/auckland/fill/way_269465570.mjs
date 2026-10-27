// Auckland City Mission Distribution Centre (way 269465570): a 1990s-2000s concrete tilt-slab distribution shed
// with a three-bay glazed office-and-dock frontage, set into the slope. Massing follows the lidar roof (3x3 smoothed,
// snapped to 8 / 10 / 12 tiers, at least one storey above its own ground); each footprint cell is a column from its
// own ground, so the storey lines stay on common 4-block datums and the downhill side shows its extra storeys.
// The walls are one cell thick with an air gap behind the glass; floors are slabs per storey, columns carry the
// interior slabs, and nothing is left floating.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_269465570.cells.json`, "utf8"));

const X = 64, Y = 24, Z = 38;
const g = new Voxels([X, Y, Z]);
const set = (x, y, z, block, state) => g.set(x, y, z, block, state);

// ---- footprint and massing -------------------------------------------------------------------------------------
const fp = new Map();
for (const [x, z, gr, rf] of cells) fp.set(`${x},${z}`, { x, z, gr, rf, exp: [] });
const cellAt = (x, z) => fp.get(`${x},${z}`);
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const ORDER = ["north", "south", "east", "west"];
const OPP = { north: "south", south: "north", east: "west", west: "east" };
const inward = (c, d) => cellAt(c.x - DIRS[d][0], c.z - DIRS[d][1]);

for (const c of fp.values()) {
  let sum = 0, n = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const o = cellAt(c.x + dx, c.z + dz); if (o) { sum += o.rf; n++; }
  }
  const s = sum / n;
  const tier = s < 9 ? 8 : s < 11 ? 10 : 12;      // lidar roof, smoothed then snapped to flat tiers
  c.T = Math.max(tier, c.gr + 4);                  // roof top: at least one storey above its own ground
  for (const d of ORDER) if (!cellAt(c.x + DIRS[d][0], c.z + DIRS[d][1])) c.exp.push(d);
}

// ---- entrance (a porch bay on the longest outside run) and loading dock (two bays on the opposite side) ---------
// The outline is a rotated slab: its outside runs are short sawtooth steps, so the porch is one bay with a canopy
// over it, the door one bay in, and the bays either side are the shell.
const runs = [];
for (const d of ORDER) {
  const horiz = d === "north" || d === "south";
  const groups = new Map();
  for (const c of fp.values()) if (c.exp.includes(d)) {
    const key = horiz ? c.z : c.x;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(c);
  }
  for (const arr of groups.values()) {
    arr.sort((a, b) => (horiz ? a.x - b.x : a.z - b.z));
    let run = [arr[0]];
    for (let i = 1; i < arr.length; i++) {
      const p = arr[i - 1], c = arr[i];
      if (horiz ? c.x === p.x + 1 : c.z === p.z + 1) run.push(c);
      else { runs.push({ d, cells: run }); run = [c]; }
    }
    runs.push({ d, cells: run });
  }
}
runs.sort((a, b) => b.cells.length - a.cells.length);

const isPerim = (c) => c.exp.length > 0;
let entrance = null;
for (const r of runs) {
  const mid = r.cells[Math.floor(r.cells.length / 2)];
  const cand = [mid, ...r.cells].find((c) => inward(c, r.d) && !isPerim(inward(c, r.d)));
  if (cand) { entrance = { c: cand, d: r.d }; break; }
}
if (!entrance) throw new Error("no outside bay with an interior behind it for the door");
const ed = entrance.d;
const porch = [entrance.c];                                                  // outer bay, open to the street
const porchKeys = new Set(porch.map((c) => `${c.x},${c.z}`));

let dock = null;
for (const r of runs) {
  if (r.cells.length < 2 || r.d !== OPP[ed]) continue;
  const j = Math.floor((r.cells.length - 2) / 2);
  const pair = r.cells.slice(j, j + 2);
  if (pair.some((c) => porchKeys.has(`${c.x},${c.z}`))) continue;
  dock = pair; break;
}
const dockKeys = new Set((dock ?? []).map((c) => `${c.x},${c.z}`));

// ---- fill --------------------------------------------------------------------------------------------------------
const glass = [];
for (const c of fp.values()) {
  const { x, z, gr, T } = c;
  const P = c.exp.length > 0;
  const k = c.exp.includes("north") || c.exp.includes("south") ? x : z;   // bay index along the face
  for (let y = 0; y < gr; y++) set(x, y, z, "stone");                       // foundation under the slope

  // storey datums: the ground floor at this cell's ground, then common 4-block lines above it, roof membrane last
  const F = [gr];
  for (const L of [4, 8, 12]) if (L > gr && L <= T - 3) F.push(L);
  const ends = [...F.slice(1), T - 1];

  if (!P) {
    const col = x % 6 === 3 && z % 6 === 3;                                  // interior columns carry the slabs
    if (col) for (let y = gr; y <= T - 1; y++) set(x, y, z, "light_gray_concrete");
    else for (const fl of F) set(x, fl, z, "smooth_stone");
    set(x, T - 1, z, "stone");                                               // roof membrane (mid-grey reads from the air at dusk)
  } else {
    for (let i = 0; i < F.length; i++) {
      const fl = F[i], nx = ends[i];
      set(x, fl, z, i === 0 ? "stone_bricks" : "light_gray_concrete");       // base course / storey line
      for (let y = fl + 1; y <= nx - 1; y++) {
        if (y === nx - 1) { set(x, y, z, "light_gray_concrete"); continue; }   // lintel band
        if (k % 4 !== 0) { set(x, y, z, "light_blue_stained_glass_pane"); glass.push({ x, y, z, fl, c }); }
        else set(x, y, z, "white_concrete");                                  // pier between bays
      }
    }
    set(x, T - 1, z, "light_gray_concrete");                                  // cornice band
    set(x, T, z, "smooth_stone");                                             // parapet coping
  }
}

// entrance porch: an open outer bay under a canopy and a hanging lantern, the door one bay in
{
  const c = porch[0];
  set(c.x, c.gr, c.z, "smooth_stone");                                         // porch floor (ground level)
  set(c.x, c.gr + 1, c.z, "air"); set(c.x, c.gr + 2, c.z, "air");
  set(c.x, c.gr + 3, c.z, "smooth_stone");                                     // canopy, held by the bays either side
  set(c.x, c.gr + 2, c.z, "lantern", { hanging: "true", waterlogged: "false" });
  const door = inward(c, ed);
  const facing = ed;
  set(door.x, door.gr + 1, door.z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  set(door.x, door.gr + 2, door.z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
}

// loading dock: a two-bay roll-up shutter on the opposite face
for (const c of dock ?? []) {
  set(c.x, c.gr + 1, c.z, "iron_block");
  set(c.x, c.gr + 2, c.z, "iron_block");
}

// warm light behind some windows: a glowstone in the air gap, on the storey floor
for (const w of glass) {
  if (porchKeys.has(`${w.c.x},${w.c.z}`) || dockKeys.has(`${w.c.x},${w.c.z}`)) continue;
  if (g.get(w.x, w.y, w.z)?.block !== "minecraft:light_blue_stained_glass_pane") continue;
  const d = w.c.exp[0];
  const b = inward(w.c, d);
  if (!b || b.exp.length) continue;
  const k = w.c.exp.includes("north") || w.c.exp.includes("south") ? w.c.x : w.c.z;
  if (k % 8 !== 1 || w.y !== w.fl + 1) continue;
  if (g.get(b.x, w.y, b.z)) continue;
  set(b.x, w.y, b.z, "glowstone");
}

// rooftop plant: 2x2 units on flat interior roof, two blocks high
for (const c of fp.values()) {
  if (c.exp.length || c.x % 9 !== 4 || c.z % 7 !== 3) continue;
  const quad = [cellAt(c.x, c.z), cellAt(c.x + 1, c.z), cellAt(c.x, c.z + 1), cellAt(c.x + 1, c.z + 1)];
  if (quad.some((q) => !q || q.exp.length || q.T !== c.T)) continue;
  for (const q of quad) for (const y of [c.T, c.T + 1]) set(q.x, y, q.z, "light_gray_concrete");
}

// glass panes connect to whatever stands beside them in the wall plane, as a real glazing bar does
for (const w of glass) {
  if (!g.get(w.x, w.y, w.z)?.block.endsWith("stained_glass_pane")) continue;
  const side = (dx, dz) => (g.get(w.x + dx, w.y, w.z + dz) ? "true" : "false");
  set(w.x, w.y, w.z, "light_blue_stained_glass_pane", {
    north: side(0, -1), south: side(0, 1), east: side(1, 0), west: side(-1, 0), waterlogged: "false",
  });
}

const counts = g.save(`${DIR}/way_269465570.nbt`);
const tiers = {};
for (const c of fp.values()) tiers[c.T] = (tiers[c.T] ?? 0) + 1;
console.log(JSON.stringify({ entrance: { face: ed, bay: entrance.m }, dock: dock ? dock.length : 0, tiers, ...counts }));
