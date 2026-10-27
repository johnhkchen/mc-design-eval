// Norman NG Building, Auckland CBD edge: a brick-and-render commercial block of the 1920s-30s, read from the lidar record.
// Two clean tiers (a 2-storey podium at roof 12, a 4-storey tower at roof 20 with a parapet), a shopfront at street level,
// a stone base course on a plinth, and a rooftop plant room. Storeys are 4 blocks from a floor datum at y 4.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162091753.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162091753.nbt";
const [X, Y, Z] = [18, 34, 42];
const DATUM = 4;                          // street floor slab; storey lines every 4 blocks above it
const FLOORS = [4, 8, 12, 16];

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const C = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { g, r }]));
const cellAt = (x, z) => C.get(`${x},${z}`);

// Lidar roof -> two flat tiers: podium 12 (under 16 blocks) and tower 20. A 3x3 majority vote removes single-cell noise.
const snap = (r) => (r <= 15 ? 12 : 20);
const T = new Map();
for (const [k, c] of C) {
  const [x, z] = k.split(",").map(Number);
  const v = { 12: 0, 20: 0 };
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = cellAt(x + dx, z + dz); if (n) v[snap(n.r)]++; }
  T.set(k, v[20] > v[12] ? 20 : v[12] > v[20] ? 12 : snap(c.r));
}
const tierAt = (x, z) => T.get(`${x},${z}`) ?? 0;
const env = (x, y, z) => { const t = tierAt(x, z); return t > 0 && y < t; };   // solid envelope column: on the footprint, below its tier
const DIRS = [["N", 0, -1], ["S", 0, 1], ["E", 1, 0], ["W", -1, 0]];
const exposed = (x, y, z) => DIRS.filter(([, dx, dz]) => !env(x + dx, y, z + dz));

// Rooftop plant room: a 3x3 box where the tower is at least 2 cells clear of its edge, nearest the tower's centre.
function plantCentre() {
  const tower = [...T].filter(([, t]) => t === 20).map(([k]) => k.split(",").map(Number));
  const mx = tower.reduce((s, [x]) => s + x, 0) / tower.length, mz = tower.reduce((s, [, z]) => s + z, 0) / tower.length;
  let best = null;
  for (const [x, z] of tower) {
    let ok = true;
    for (let dz = -2; dz <= 2 && ok; dz++) for (let dx = -2; dx <= 2 && ok; dx++) if (tierAt(x + dx, z + dz) !== 20) ok = false;
    if (ok && (!best || Math.hypot(x - mx, z - mz) < best.d)) best = { x, z, d: Math.hypot(x - mx, z - mz) };
  }
  return best;
}

const g = new Voxels([X, Y, Z]);
const lit = [];                            // interior cells just behind a window that gets a light
for (const [k, c] of C) {
  const [x, z] = k.split(",").map(Number);
  const t = tierAt(x, z);
  for (let y = 0; y < c.g; y++) g.set(x, y, z, "stone");                         // foundation up to the lidar ground
  for (let y = c.g; y < t; y++) {
    const ex = exposed(x, y, z);
    if (y < DATUM) { g.set(x, y, z, y === 3 ? "polished_andesite" : "stone_bricks"); continue; }   // plinth + base course
    if (y === t - 1) { g.set(x, y, z, ex.length ? "smooth_sandstone" : "light_gray_concrete"); continue; }  // cornice / roof
    if (FLOORS.includes(y)) { g.set(x, y, z, "smooth_sandstone"); continue; }    // floor slab / string course
    if (!ex.length) continue;                                                    // interior: air behind the glass
    const base = FLOORS.filter((f) => f <= y).pop(), rel = y - base, ground = base === DATUM;
    if (rel === 3) { g.set(x, y, z, ground ? "polished_granite" : "smooth_sandstone"); continue; }   // head / fascia band
    const alongNS = ex.some(([d]) => d === "N" || d === "S");
    const alongEW = ex.some(([d]) => d === "E" || d === "W");
    const u = alongNS ? x : z;                                                   // position along the wall
    if (alongNS && alongEW) { g.set(x, y, z, "smooth_sandstone"); continue; }    // corner quoin
    if (u % 3 === 0) { g.set(x, y, z, ground ? "smooth_sandstone" : "bricks"); continue; }   // pier
    g.set(x, y, z, "glass_pane", alongNS
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
    const bay = Math.floor(u / 3);
    const isLit = ground ? bay % 2 === 0 : (bay + base / 4) % 3 === 1;
    if (rel === 1 && isLit) {
      const [, dx, dz] = ex[0];
      lit.push([x - dx, y, z - dz, "glowstone"]);
    }
  }
  // parapet on the tower's edge, above the cornice
  if (t === 20 && exposed(x, 19, z).length) g.set(x, 20, z, "smooth_sandstone");
}
for (const [x, y, z, b] of lit) if (!exposed(x, y, z).length && tierAt(x, z) && y >= DATUM) g.set(x, y, z, b);

// The street entrance on the north face: a recessed door, a stone canopy over it, and two lanterns hung from it.
for (const [y, half] of [[4, "lower"], [5, "upper"]]) g.set(9, y, 0, "dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
for (const x of [8, 9, 10]) g.set(x, 6, 0, "polished_granite");
for (const x of [8, 10]) g.set(x, 5, 0, "lantern", { hanging: "true", waterlogged: "false" });

// Plant room on the tower roof: smooth-stone walls two high with a concrete cap.
const pc = plantCentre();
if (pc) {
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const x = pc.x + dx, z = pc.z + dz;
    g.set(x, 20, z, "smooth_stone"); g.set(x, 21, z, "smooth_stone");
    g.set(x, 21, z, "light_gray_concrete");
  }
}

// Check: every block is on the ground, on a block below, or against a block beside it.
const solid = (x, y, z) => g.val(x, y, z) !== 0;
let floating = 0;
for (let z = 0; z < Z; z++) for (let y = 1; y < Y; y++) for (let x = 0; x < X; x++) {
  if (!solid(x, y, z) || solid(x, y - 1, z)) continue;
  if (!(solid(x - 1, y, z) || solid(x + 1, y, z) || solid(x, y, z - 1) || solid(x, y, z + 1))) floating++;
}
const info = g.save(OUT);
console.log(`blocks ${info.blocks}, palette ${info.palette}, floating ${floating}, plant room at ${pc ? `${pc.x},${pc.z}` : "none"}`);
