// Auckland Central City Library: a 2000s civic block of glass, precast concrete and volcanic basalt. Massing: the lidar
// roof, averaged over a 5x5 window and snapped to 4-block storeys (8 low, 24 main, 28 and 32 setbacks), each tier standing
// on a solid slab. Every column is solid from y 0 to its ground (basalt foundation), so the downhill side shows the extra
// storeys. The shell is the outer ring of each tier; glass sits in the bays with an air gap behind; interiors are air
// between floor slabs. A canopy and two lanterns mark the entrance; a plant room sits on the tallest tier.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${HERE}/way_23906761.cells.json`, "utf8"));
const g = new Voxels([75, 44, 95]);

const key = (x, z) => `${x},${z}`;
const groundAt = new Map(), roofAt = new Map();              // "x,z" -> the lidar ground and roof heights
for (const [x, z, gr, r] of cells) { groundAt.set(key(x, z), gr); roofAt.set(key(x, z), r); }

// Tier per cell: the roof averaged over a 5x5 window of footprint cells, snapped to 4-block storeys
function tierAt(x, z) {
  let s = 0, n = 0;
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
    const r = roofAt.get(key(x + dx, z + dz)); if (r !== undefined) { s += r; n++; }
  }
  return Math.min(32, Math.max(8, Math.round(s / n / 4) * 4));
}
const tierOf = new Map();
for (const k of roofAt.keys()) { const [x, z] = k.split(",").map(Number); tierOf.set(k, tierAt(x, z)); }

const T = (x, z) => tierOf.get(key(x, z)) ?? 0;             // 0 outside the footprint
const G = (x, z) => groundAt.get(key(x, z)) ?? 0;
const inFoot = (x, z) => tierOf.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const inRegion = (x, z, y) => T(x, z) > y;                  // the massing still rises at height y
const shellAt = (x, z, y) => inRegion(x, z, y) && DIRS.some(([dx, dz]) => !inRegion(x + dx, z + dz, y));
const outward = (x, z, y) => DIRS.find(([dx, dz]) => !inRegion(x + dx, z + dz, y));
const hash = (x, y, z) => ((x * 73856093) ^ (y * 83492791) ^ (z * 19349663)) >>> 0;

const FOUNDATION = "polished_basalt", PLINTH = "polished_basalt";
const PIER = "light_gray_concrete", BAND = "white_concrete", FLOOR = "smooth_stone", ROOF = "smooth_stone";

// 1. the massing: foundation to each ground; the ground course; slabs at storey lines; shell and interior between them
const panes = [];
for (const [k, t] of tierOf) {
  const [x, z] = k.split(",").map(Number), gr = G(x, z);
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUNDATION);
  for (let y = gr; y < t; y++) {
    const shell = shellAt(x, z, y);
    if (y === t - 1) { g.set(x, y, z, shell ? PIER : ROOF); continue; }                 // parapet, or the roof
    if (y === gr) { g.set(x, y, z, shell ? PLINTH : FLOOR); continue; }                  // ground course, ground floor slab
    if (y % 4 === 0 || y % 4 === 3) { g.set(x, y, z, shell ? BAND : FLOOR); continue; }  // string courses, slabs
    if (!shell) continue;                                                                // air behind the glass
    const [dx, dz] = outward(x, z, y);
    const u = dz !== 0 ? x : z, bay = ((u % 4) + 4) % 4;                                 // bay: pier, glass, glass, pier
    if (bay === 0 || bay === 3) g.set(x, y, z, PIER);
    else panes.push([x, y, z, dx, dz]);
  }
}

// 2. glass panes, connected along their facade with blue-grey tint, and warm lights a couple of cells behind some
for (const [x, y, z, dx, dz] of panes) {
  const st = dz !== 0
    ? { north: "false", south: "false", east: String(shellAt(x + 1, z, y)), west: String(shellAt(x - 1, z, y)) }
    : { north: String(shellAt(x, z - 1, y)), south: String(shellAt(x, z + 1, y)), east: "false", west: "false" };
  g.set(x, y, z, "light_blue_stained_glass_pane", { ...st, waterlogged: "false" });
}
for (const [x, y, z, dx, dz] of panes) {
  if (y % 4 !== 1 || hash(x, y, z) % 5 !== 0) continue;
  const ix = x - 2 * dx, iz = z - 2 * dz;                                                // two cells in: an air gap
  if (!inRegion(ix, iz, y) || shellAt(ix, iz, y)) continue;
  g.set(ix, y, iz, hash(x, y, z) % 13 === 0 ? "shroomlight" : "glowstone");
}

// 3. the entrance: on the outward face with the most shell cells at street level, mid-run, in a glass bay
const faceCount = new Map(), faceCells = new Map();
for (const k of tierOf.keys()) {
  const [x, z] = k.split(",").map(Number), gr = G(x, z);
  if (!shellAt(x, z, gr + 1)) continue;
  const [dx, dz] = outward(x, z, gr + 1), f = FACING[`${dx},${dz}`];
  faceCount.set(f, (faceCount.get(f) ?? 0) + 1);
  if (!faceCells.has(f)) faceCells.set(f, []);
  faceCells.get(f).push([x, z]);
}
const front = [...faceCount.entries()].sort((a, b) => b[1] - a[1])[0][0];
const [fdx, fdz] = Object.entries(FACING).find(([, v]) => v === front)[0].split(",").map(Number);
const along = (x, z) => (fdz !== 0 ? x : z);
const onFront = faceCells.get(front).filter(([x, z]) => {
  const bay = ((along(x, z) % 4) + 4) % 4;
  const [dx, dz] = outward(x, z, G(x, z) + 1); return dx === fdx && dz === fdz && bay !== 0 && bay !== 3;
});
const mid = onFront.reduce((s, [x, z]) => s + along(x, z), 0) / onFront.length;
const [dx0, dz0] = onFront.reduce((best, c) => Math.abs(along(...c) - mid) < Math.abs(along(...best) - mid) ? c : best);
const gr0 = G(dx0, dz0);
const door = { facing: front, hinge: "left", open: "false", powered: "false" };
g.set(dx0, gr0 + 1, dz0, "dark_oak_door", { ...door, half: "lower" });
g.set(dx0, gr0 + 2, dz0, "dark_oak_door", { ...door, half: "upper" });
// two lanterns hang from the ceiling inside the entrance
for (const off of [0, -1]) {
  const ix = dx0 - fdx + (fdz !== 0 ? off : 0), iz = dz0 - fdz + (fdx !== 0 ? off : 0);
  if (inRegion(ix, iz, gr0 + 2) && !shellAt(ix, iz, gr0 + 2)) g.set(ix, gr0 + 2, iz, "lantern", { hanging: "true", waterlogged: "false" });
}
// the canopy: a slab roof two cells out from the face, on two posts, with two lanterns standing on it
const cy = gr0 + 3, outCell = (d, t) => [dx0 + fdx * d + (fdz !== 0 ? t : 0), dz0 + fdz * d + (fdx !== 0 ? t : 0)];
for (let d = 1; d <= 2; d++) for (let t = -2; t <= 2; t++) {
  const [x, z] = outCell(d, t); if (!inFoot(x, z)) g.set(x, cy, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}
for (const t of [-2, 2]) for (let y = gr0; y < cy; y++) { const [x, z] = outCell(2, t); g.set(x, y, z, PIER); }
for (const t of [-1, 1]) { const [x, z] = outCell(1, t); g.set(x, cy + 1, z, "lantern", { hanging: "false", waterlogged: "false" }); }

// 4. the roof: a 7x5 plant room on the tallest tier, set in from the parapet on a cell with roof under it
const maxT = Math.max(...tierOf.values());
const top = [...tierOf].filter(([, t]) => t === maxT).map(([k]) => k.split(",").map(Number));
const cx = top.reduce((s, [x]) => s + x, 0) / top.length, cz = top.reduce((s, [, z]) => s + z, 0) / top.length;
let best = null;
for (const [x, z] of top) {
  let ok = true;
  for (let i = -3; i <= 3 && ok; i++) for (let j = -2; j <= 2 && ok; j++) {
    if (T(x + i, z + j) !== maxT || shellAt(x + i, z + j, maxT - 1)) ok = false;
  }
  if (ok && (!best || Math.hypot(x - cx, z - cz) < Math.hypot(best[0] - cx, best[1] - cz))) best = [x, z];
}
if (best) {
  const [bx, bz] = best;
  for (let i = -3; i <= 3; i++) for (let j = -2; j <= 2; j++) {
    const x = bx + i, z = bz + j;
    g.set(x, maxT, z, "gray_concrete"); g.set(x, maxT + 1, z, PIER);                    // a solid plinth and louvred walls
    g.set(x, maxT + 2, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

const info = g.save(`${HERE}/way_23906761.nbt`);
const tiers = {}; for (const t of tierOf.values()) tiers[t] = (tiers[t] ?? 0) + 1;
console.log(JSON.stringify({ front, door: [dx0, dz0, gr0], plant: best, tiers, panes: panes.length, ...info }));
