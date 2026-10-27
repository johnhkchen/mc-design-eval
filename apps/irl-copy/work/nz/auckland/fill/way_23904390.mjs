// Chief Post Office, Auckland: an Edwardian Baroque block (stone base, cream render, quartz trims, slate roof).
// Massing: the lidar roof, smoothed and snapped to 4-block storeys (24 wings, 28 and 32 setbacks, a 36 tower).
// Each tier stands on a solid ceiling layer of the one below; the shell is the outer ring of each tier; interiors are air
// behind the glass with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${HERE}/way_23904390.cells.json`, "utf8"));
const g = new Voxels([70, 48, 77]);

const key = (x, z) => `${x},${z}`;
const roofAt = new Map();                                   // "x,z" -> the lidar roof height above y 0
for (const [x, z, , r] of cells) roofAt.set(key(x, z), r);

// Tier per cell: the roof averaged over a 7x7 window (zero edge noise left out), snapped to 4-block storeys
function tierAt(x, z) {
  let s = 0, n = 0;
  for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) {
    const r = roofAt.get(key(x + dx, z + dz)); if (r !== undefined && r >= 15) { s += r; n++; }
  }
  const m = n ? s / n : 24;
  return m < 27 ? 24 : m < 30 ? 28 : m < 32.5 ? 32 : 36;
}
const tierOf = new Map();
for (const k of roofAt.keys()) { const [x, z] = k.split(",").map(Number); tierOf.set(k, tierAt(x, z)); }

const T = (x, z) => tierOf.get(key(x, z)) ?? 0;           // 0 outside the footprint
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const inRegion = (x, z, y) => T(x, z) > y;                 // the massing still rises at height y
const shellAt = (x, z, y) => inRegion(x, z, y) && DIRS.some(([dx, dz]) => !inRegion(x + dx, z + dz, y));
const outward = (x, z, y) => DIRS.find(([dx, dz]) => !inRegion(x + dx, z + dz, y));
const hash = (x, y, z) => ((x * 73856093) ^ (y * 83492791) ^ (z * 19349663)) >>> 0;

const PIER = "smooth_quartz", BAND = "smooth_quartz", WALL = "calcite", BASE = "stone_bricks";
const ROOF = "deepslate_tiles", FLOOR = "smooth_stone";

// 1. the massing: every column solid from y 0 to its tier; floor and ceiling slabs each storey; shell and interior
const panes = [];
for (const [k, t] of tierOf) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < t; y++) {
    const shell = shellAt(x, z, y);
    if (y === t - 1) { g.set(x, y, z, shell ? PIER : ROOF); continue; }                 // parapet, or the roof
    if (y % 4 === 0 || y % 4 === 3) {                                                    // base, string course, slabs
      g.set(x, y, z, shell ? (y === 0 ? BASE : BAND) : FLOOR); continue;
    }
    if (!shell) continue;                                                                // air behind the glass
    const [dx, dz] = outward(x, z, y);
    const u = dz !== 0 ? x : z, bay = ((u % 4) + 4) % 4;                                 // bay: pier, glass, glass, wall
    if (bay === 0) g.set(x, y, z, PIER);
    else if (bay === 3) g.set(x, y, z, WALL);
    else panes.push([x, y, z, dx, dz]);
  }
}

// 2. glass panes, connected along their facade, and the warm lights a few cells behind some of them
for (const [x, y, z, dx, dz] of panes) {
  const st = dz !== 0
    ? { north: "false", south: "false", east: String(shellAt(x + 1, z, y)), west: String(shellAt(x - 1, z, y)) }
    : { north: String(shellAt(x, z - 1, y)), south: String(shellAt(x, z + 1, y)), east: "false", west: "false" };
  g.set(x, y, z, "glass_pane", { ...st, waterlogged: "false" });
}
for (const [x, y, z, dx, dz] of panes) {
  if (y % 4 !== 1 || hash(x, y, z) % 5 !== 0) continue;
  const ix = x - 2 * dx, iz = z - 2 * dz;                                                // two cells in: an air gap
  if (!inRegion(ix, iz, y) || shellAt(ix, iz, y)) continue;
  g.set(ix, y, iz, hash(x, y, z) % 13 === 0 ? "shroomlight" : "glowstone");
}

// 3. the entrance: on the longest street-facing run at ground level (the outward face with most shell cells)
const faceCount = new Map(), faceCells = new Map();
for (const k of tierOf.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (!shellAt(x, z, 1)) continue;
  const [dx, dz] = outward(x, z, 1), f = FACING[`${dx},${dz}`];
  faceCount.set(f, (faceCount.get(f) ?? 0) + 1);
  if (!faceCells.has(f)) faceCells.set(f, []);
  faceCells.get(f).push([x, z]);
}
const front = [...faceCount.entries()].sort((a, b) => b[1] - a[1])[0][0];
const [fdx, fdz] = Object.entries(FACING).find(([, v]) => v === front)[0].split(",").map(Number);
const onFront = faceCells.get(front).filter(([x, z]) => {
  const [dx, dz] = outward(x, z, 1); return dx === fdx && dz === fdz && ((fdz !== 0 ? x : z) % 4 + 4) % 4 !== 0 && ((fdz !== 0 ? x : z) % 4 + 4) % 4 !== 3;
});
const mid = onFront.reduce((s, [x, z]) => s + (fdz !== 0 ? x : z), 0) / onFront.length;
const [dx0, dz0] = onFront.reduce((best, c) => Math.abs((fdz !== 0 ? c[0] : c[1]) - mid) < Math.abs((fdz !== 0 ? best[0] : best[1]) - mid) ? c : best);
const door = { facing: front, hinge: "left", open: "false", powered: "false" };
g.set(dx0, 1, dz0, "dark_oak_door", { ...door, half: "lower" });
g.set(dx0, 2, dz0, "dark_oak_door", { ...door, half: "upper" });
// two lanterns hang from the ceiling inside the entrance
for (const off of [0, -1]) {
  const ix = dx0 - fdx * 1 + (fdz !== 0 ? off : 0), iz = dz0 - fdz * 1 + (fdx !== 0 ? off : 0);
  if (inRegion(ix, iz, 2) && !shellAt(ix, iz, 2)) g.set(ix, 2, iz, "lantern", { hanging: "true", waterlogged: "false" });
}

// 4. the roof: a 3x3 cupola on the tallest tier, where the 36 cells are interior
const top = [...tierOf].filter(([, t]) => t === 36).map(([k]) => k.split(",").map(Number));
const cx = top.reduce((s, [x]) => s + x, 0) / top.length, cz = top.reduce((s, [, z]) => s + z, 0) / top.length;
let best = null;
for (const [x, z] of top) {
  let ok = true;
  for (let i = -1; i <= 1 && ok; i++) for (let j = -1; j <= 1 && ok; j++) if (T(x + i, z + j) !== 36 || shellAt(x + i, z + j, 35)) ok = false;
  if (ok && (!best || Math.hypot(x - cx, z - cz) < Math.hypot(best[0] - cx, best[1] - cz))) best = [x, z];
}
if (best) {
  const [bx, bz] = best;
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
    const x = bx + i, z = bz + j, ring = Math.abs(i) === 1 || Math.abs(j) === 1;
    if (ring) { g.set(x, 36, z, "smooth_quartz"); g.set(x, 37, z, "smooth_quartz"); }
    g.set(x, 38, z, "oxidized_copper");
  }
}

const info = g.save(`${HERE}/way_23904390.nbt`);
const tiers = {}; for (const t of tierOf.values()) tiers[t] = (tiers[t] ?? 0) + 1;
console.log(JSON.stringify({ front, door: [dx0, dz0], cupola: best, tiers, panes: panes.length, ...info }));
