// NYC1035399: 6 East 46th Street, 1948 midblock commercial and office building, 11 x 27 blocks. Lidar puts its roof at
// 19 to 24 blocks, so it reads as a 1940s Midtown office block of six to eight storeys: buff limestone (smooth quartz)
// spandrels and quartz piers, a granite base and shopfront on the street face (north, z 0), clear glass below and
// blue-tinted steel-sash glass above, a stone cornice and a parapet. The lidar roofs are snapped to 18, 21 or 24 blocks
// (6, 7 or 8 storeys of three blocks) so the setbacks are flat tiers, and the one dropped-out cell in each of two
// spots takes its neighbours' height. Every block stands on the one below; the only air is the gap behind each window.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const W = 11, D = 27, YMAX = 30;
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035399.cells.json`, "utf8"));

// Lidar roof heights per footprint cell (null = outside the lot).
const raw = Array.from({ length: D }, () => Array(W).fill(null));
for (const [x, z, , r] of cells) raw[z][x] = r;
const inFoot = (x, z) => x >= 0 && z >= 0 && x < W && z < D && raw[z][x] !== null;
const median = (a) => { const s = [...a].sort((p, q) => p - q), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const around = (x, z) => { const v = []; for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dz) continue; if (inFoot(x + dx, z + dz) && raw[z + dz][x + dx] > 0) v.push(raw[z + dz][x + dx]); } return v; };

// 1. Dropped-out lidar cells (roof 0 inside the lot) take the median of their live neighbours.
const filled = raw.map((row, z) => row.map((r, x) => (r !== null && r === 0 ? median(around(x, z)) : r)));

// 2. Smooth each cell over its 3 x 3 neighbourhood, then snap to a whole number of 3-block storeys (18, 21 or 24).
const TIER = (m) => (m < 19.5 ? 18 : m < 22.5 ? 21 : 24);
const H = Array.from({ length: D }, () => Array(W).fill(0));
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inFoot(x, z)) continue;
  const nb = [filled[z][x]];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    if ((!dx && !dz) || !inFoot(x + dx, z + dz)) continue;
    nb.push(filled[z + dz][x + dx]);
  }
  H[z][x] = TIER(median(nb));
}
// 2b. Two more median passes over the tiers: a lone 24 or 18 among 21s is lidar speckle, not a setback, and would
// leave a notched parapet on the roof. The median keeps every value on a storey tier.
for (let pass = 0; pass < 2; pass++) {
  const prev = H.map((row) => [...row]);
  for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    if (!inFoot(x, z)) continue;
    const nb = [];
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inFoot(x + dx, z + dz)) nb.push(prev[z + dz][x + dx]);
    H[z][x] = nb.sort((p, q) => p - q)[nb.length >> 1];   // a value already on the tier list, never an average
  }
}

const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
const h = (x, z) => (inFoot(x, z) ? H[z][x] : 0);
const sidesAt = (x, z, y) => Object.keys(DIRS).filter((d) => h(x + DIRS[d][0], z + DIRS[d][1]) <= y);
const isCorner = (sides) => sides.some((d) => d === "N" || d === "S") && sides.some((d) => d === "E" || d === "W");
const primary = (sides) => ["N", "S", "E", "W"].find((d) => sides.includes(d));
const key = (x, y, z) => `${x},${y},${z}`;

const pane = (d) => ({ north: String(d === "E" || d === "W"), south: String(d === "E" || d === "W"), east: String(d === "N" || d === "S"), west: String(d === "N" || d === "S"), waterlogged: "false" });
const door = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });

// 3. Window gaps: the cell behind each glazed opening (inside the lot, solid all round at that height) is air, or a warm light.
const gap = new Map();
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inFoot(x, z)) continue;
  for (let y = 0; y < H[z][x]; y++) {
    const sides = sidesAt(x, z, y);
    if (!sides.length || isCorner(sides)) continue;
    const d = primary(sides), [dx, dz] = DIRS[d];
    const k = Math.floor(y / 3), r = y % 3, u = d === "N" || d === "S" ? x : z, L = d === "N" || d === "S" ? W : D;
    if (r !== 1 || y === H[z][x] - 1) continue;
    const pier = u % 3 === 0 || u === L - 1;
    const isDoor = k === 0 && d === "N" && u === 5;
    if (pier || isDoor) continue;
    const ix = x - dx, iz = z - dz;
    if (!inFoot(ix, iz) || h(ix, iz) <= y || sidesAt(ix, iz, y).length) continue;
    const side = { N: 0, S: 1, E: 2, W: 3 }[d];
    const lit = k === 0 ? u === 2 || u === 8 : (u * 3 + k * 5 + side) % 7 === 2;
    gap.set(key(ix, y, iz), lit ? (k === 0 ? "glowstone" : "shroomlight") : null);
  }
}

// 4. Emit the massing, one storey line at a time.
const g = new Voxels([W, YMAX, D]);
const put = (x, y, z, b, s) => { g.set(x, y, z, b, s); };
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inFoot(x, z)) continue;
  const top = H[z][x];
  for (let y = 0; y < top; y++) {
    const gk = gap.get(key(x, y, z));
    if (gk !== undefined) { if (gk) put(x, y, z, gk); continue; }   // air behind glass, or a lamp in it
    const sides = sidesAt(x, z, y), k = Math.floor(y / 3), r = y % 3;
    if (!sides.length) { put(x, y, z, y === top - 1 ? "gray_concrete" : "stone"); continue; }   // core, and the tar roof
    if (y === top - 1) { put(x, y, z, "stone_bricks"); continue; }                             // cornice course
    if (isCorner(sides)) { put(x, y, z, k === 0 && r === 0 ? "polished_granite" : "quartz_pillar", { axis: "y" }); continue; }
    const d = primary(sides), [dx, dz] = DIRS[d];
    const u = d === "N" || d === "S" ? x : z, L = d === "N" || d === "S" ? W : D;
    if (k === 0 && r === 0) { put(x, y, z, "polished_granite"); continue; }                  // granite base course
    if (k === 0 && d === "N" && u === 5 && r >= 1) { put(x, y, z, "iron_door", door(r === 1 ? "lower" : "upper")); continue; }
    if (u % 3 === 0 || u === L - 1) { put(x, y, z, "quartz_pillar", { axis: "y" }); continue; }   // piers between the bays
    if (r === 1) {
      const glass = k === 0 ? "glass_pane" : "light_blue_stained_glass_pane";
      put(x, y, z, glass, pane(d)); continue;
    }
    put(x, y, z, "smooth_quartz");                                                             // sill and head spandrels
  }
  // Parapet: one course on the roof edge, where the cell has no neighbour as tall (outside the lot or a lower tier).
  if (Object.keys(DIRS).some((d) => h(x + DIRS[d][0], z + DIRS[d][1]) < top)) put(x, top, z, "smooth_quartz");
}

// 5. A penthouse on the tallest tier: a 2 x 2 bulkhead with blue glass on its north and south faces and a stone cap.
// Pick the 2 x 2 block on the 24-block tier nearest the middle of that tier.
const tall = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (h(x, z) === 24) tall.push([x, z]);
const cx = tall.reduce((s, [x]) => s + x, 0) / tall.length, cz = tall.reduce((s, [, z]) => s + z, 0) / tall.length;
const cand = [];
for (let z = 0; z < D - 1; z++) for (let x = 0; x < W - 1; x++) {
  if ([[0, 0], [1, 0], [0, 1], [1, 1]].every(([dx, dz]) => h(x + dx, z + dz) === 24)) cand.push([x, z]);
}
let bulk = null;
if (cand.length) {
  const [bx, bz] = cand.reduce((a, b) => (Math.hypot(a[0] - cx, a[1] - cz) <= Math.hypot(b[0] - cx, b[1] - cz) ? a : b));
  bulk = [bx, bz];
  for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 2; dx++) {
    const x = bx + dx, z = bz + dz, top = 24;
    put(x, top, z, "smooth_quartz");
    put(x, top + 1, z, "light_blue_stained_glass_pane", pane("N"));   // blue glass band, the penthouse's lit face
    put(x, top + 2, z, "stone_bricks");
  }
}

const info = g.save(`${DIR}/NYC1035399.nbt`);
const hist = {};
for (const row of H) for (const v of row) if (v) hist[v] = (hist[v] || 0) + 1;
console.log(JSON.stringify({ blocks: info.blocks, palette: info.palette, tiers: hist, gaps: gap.size, bulkhead: bulk }));
