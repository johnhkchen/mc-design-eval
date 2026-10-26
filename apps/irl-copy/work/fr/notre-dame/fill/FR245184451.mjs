// FR245184451: the Préfecture de police, a commercial block of six storeys (1800) on the lidar footprint, stone with a
// dark attic. Storey lines sit on absolute levels (plinth to y 6, then a 5-block storey: course, sill, two rows of glass,
// lintel), so every tier lands on a lintel and the lidar's tiers read as setbacks. Each cell stands on its own foundation
// (solid from y 0 to its ground); the attic and the tower are set back from the outer walls, so they step in as they rise.
// Interiors are air behind one-block facades, with a floor slab per storey and a roof row; a few windows hold glowstone.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR245184451.cells.json`, "utf8"));

const W = 146, H = 61, D = 167;
const PLINTH = 6;                                          // the ground floor's slab: every cell's base course runs to y 6
const TIERS = [11, 16, 21, 26, 31, 36, 41, 46];            // storey tops: six storeys to 36, the attic to 41, the tower to 46
const ATTIC = 36;                                          // from here up the walls are slate, not stone
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const OPP = { north: "south", south: "north", west: "east", east: "west" };
const PANE = { north: "true", south: "true", east: "true", west: "true" };

const fp = new Map();
const key = (x, z) => `${x},${z}`;
for (const [x, z, g, r] of cells) fp.set(key(x, z), { x, z, g, r, low: r - g <= 1, R: r, T: 0, dist: 0, faces: [] });
const at = (x, z) => fp.get(key(x, z));
const bld = (x, z) => { const c = at(x, z); return !!c && !c.low; };
const cellsOf = (fn) => [...fp.values()].filter(fn);

// 1. Spurs: a building cell with fewer than two building neighbours is a lidar sliver, not a wall, so it goes to the ground.
for (const c of cellsOf((c) => !c.low)) c.spur = Object.values(DIRS).filter(([dx, dz]) => bld(c.x + dx, c.z + dz)).length < 2;
for (const c of cellsOf((c) => c.spur)) c.low = true;

// 2. Lidar noise: a 3x3 median of the building cells' roof heights, then the nearest storey top.
for (const c of cellsOf((c) => !c.low)) {
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (bld(c.x + dx, c.z + dz)) vals.push(at(c.x + dx, c.z + dz).r);
  vals.sort((a, b) => a - b);
  c.R = vals[vals.length >> 1];
  c.T = TIERS.reduce((best, t) => (Math.abs(t - c.R) < Math.abs(best - c.R) ? t : best));
}

// 3. Setbacks: distance inward from the outer edge (a missing or low neighbour). The attic needs 2 blocks in, the tower 4.
const queue = cellsOf((c) => !c.low && Object.values(DIRS).some(([dx, dz]) => !bld(c.x + dx, c.z + dz)));
const seen = new Set(queue.map((c) => key(c.x, c.z)));
for (const c of queue) c.dist = 0;
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  for (const [dx, dz] of Object.values(DIRS)) {
    const n = at(c.x + dx, c.z + dz);
    if (!n || n.low || seen.has(key(n.x, n.z))) continue;
    seen.add(key(n.x, n.z)); n.dist = c.dist + 1; queue.push(n);
  }
}
const cap = (d) => (d >= 4 ? 46 : d >= 2 ? 41 : ATTIC);
for (const c of cellsOf((c) => !c.low)) c.T = Math.min(c.T, cap(c.dist));

// 4. Exposed faces: an outer side (missing or low neighbour) or a side that drops to a lower tier.
for (const c of cellsOf((c) => !c.low)) {
  c.faces = Object.keys(DIRS).filter((d) => {
    const [dx, dz] = DIRS[d]; const n = at(c.x + dx, c.z + dz);
    return !n || n.low || n.T < c.T;
  });
}

// Doors: one per long run (24+ blocks) of single-face outer wall, at the run's middle pane column.
const doors = new Map();
const runs = new Map();
for (const c of cellsOf((c) => !c.low && c.faces.length === 1)) {
  const f = c.faces[0];
  const line = f === "north" || f === "south" ? `${f}:${c.z}` : `${f}:${c.x}`;
  if (!runs.has(line)) runs.set(line, []);
  runs.get(line).push(c);
}
for (const [line, list] of runs) {
  const f = line.split(":")[0];
  const along = (c) => (f === "north" || f === "south" ? c.x : c.z);
  list.sort((a, b) => along(a) - along(b));
  let run = [];
  const flush = () => {
    if (run.length >= 24) {
      const mid = run[Math.floor(run.length / 2)];
      const pane = run.filter((c) => along(c) % 4 === 1 || along(c) % 4 === 3);
      const at0 = pane.reduce((best, c) => (Math.abs(along(c) - along(mid)) < Math.abs(along(best) - along(mid)) ? c : best), pane[0] ?? mid);
      if (at0) doors.set(key(at0.x, at0.z), OPP[f]);
    }
    run = [];
  };
  for (const c of list) {
    if (run.length && along(c) !== along(run[run.length - 1]) + 1) flush();
    run.push(c);
  }
  flush();
}

const g = new Voxels([W, H, D]);
const hash = (x, y, z) => (x * 7919 + y * 104729 + z * 1299709) % 1009;

for (const c of cellsOf((c) => true)) {
  const { x, z } = c;
  if (c.low) {                                              // courtyards and quays: foundation, then paving at the ground
    for (let y = 0; y < c.g; y++) g.set(x, y, z, "stone");
    g.set(x, c.g, z, "stone_bricks");
    if (hash(x, c.g, z) % 61 === 0) g.set(x, c.g + 1, z, "lantern", { hanging: "false" });
    continue;
  }
  const top = c.T - 1;
  for (let y = 0; y < c.g; y++) g.set(x, y, z, "stone");   // foundation: nothing floats on the slope
  for (let y = c.g; y < PLINTH; y++) g.set(x, y, z, "stone_bricks");
  const facade = c.faces.length > 0;
  const cornerish = c.faces.includes("north") || c.faces.includes("south") ? c.faces.includes("east") || c.faces.includes("west") : false;
  const u = c.faces.includes("north") || c.faces.includes("south") ? x : z;
  for (let y = PLINTH; y <= top; y++) {
    if (y === top) { g.set(x, y, z, facade ? "smooth_stone" : "deepslate_tiles"); continue; }   // cornice or roof covering
    if (!facade) { if ((y - PLINTH) % 5 === 0) g.set(x, y, z, "stone"); continue; }             // air, with the floor slabs
    const r = (y - PLINTH) % 5;                            // 0 course, 1 sill, 2-3 glass, 4 lintel
    const glassRow = y <= 9 ? y >= 7 : r === 2 || r === 3; // the ground floor is shopfront glass
    const body = y >= ATTIC ? "deepslate_tiles" : "calcite";
    if (!glassRow) { g.set(x, y, z, "smooth_stone"); continue; }
    if (cornerish || u % 4 === 0 || u % 4 === 2) { g.set(x, y, z, body); continue; }
    g.set(x, y, z, "glass_pane", PANE);
  }
  // Doors: two blocks, the lower on the ground, the upper above, the glass above it kept as a transom
  if (doors.has(key(x, z)) && c.faces.length === 1) {
    const facing = doors.get(key(x, z));
    g.set(x, 7, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, 8, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  }
}

// Warm light: glowstone in the air gap behind some glass, one block in from the facade.
for (const c of cellsOf((c) => !c.low && c.faces.length > 0)) {
  for (let y = 7; y < c.T - 1; y++) {
    const r = (y - PLINTH) % 5;
    if (!(y <= 9 || r === 2 || r === 3) || (c.x + y + c.z) % 2) continue;
    if (hash(c.x, y, c.z) % 9 !== 0 || doors.has(key(c.x, c.z))) continue;
    const f = c.faces[0];
    const [dx, dz] = DIRS[OPP[f]];
    const n = at(c.x + dx, c.z + dz);
    if (!n || n.low || n.faces.length || y >= n.T - 1 || (y - PLINTH) % 5 === 0) continue;
    g.set(c.x + dx, y, c.z + dz, "glowstone");
  }
}

// Roof plant: a few brick flues on the attic and tower roofs, set well in from the edge.
for (const c of cellsOf((c) => !c.low && c.faces.length === 0 && c.T >= ATTIC && c.dist >= 3)) {
  if (c.x % 13 !== 6 || c.z % 11 !== 5) continue;
  for (let y = c.T; y <= c.T + 2; y++) g.set(c.x, y, c.z, "bricks");
}

const stats = g.save(`${DIR}/FR245184451.nbt`);
console.log(JSON.stringify({ cells: cells.length, ...stats, doors: doors.size }));
