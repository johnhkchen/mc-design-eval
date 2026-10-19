// NYC1090823: 145 West 47th Street, 2018 midtown commercial and office building. Seven storeys (about 21 blocks, 23 m)
// on a flat lot: a glass-and-precast curtain wall (white spandrel lines, tinted glass in dark-framed bays), a granite
// base with a shopfront and a recessed iron entrance on the street (north) face, a quartz parapet and a tar roof with a
// rooftop plant screen. Lidar tiers snap to storey heights: a 21-block north strip, an 18-block body, low wings to the south.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const W = 32, D = 29, YMAX = 33;
const cells = JSON.parse(readFileSync(`${DIR}/NYC1090823.cells.json`, "utf8"));

// Lidar roof heights per footprint cell (absent = outside the lot).
const raw = Array.from({ length: D }, () => Array(W).fill(-1));
for (const [x, z, , r] of cells) raw[z][x] = r;
const inLot = (x, z) => x >= 0 && z >= 0 && x < W && z < D && raw[z][x] >= 0;
const median = (a) => { const s = [...a].sort((p, q) => p - q), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const nb8 = (x, z) => { const out = []; for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if ((dx || dz) && inLot(x + dx, z + dz)) out.push([x + dx, z + dz]); return out; };

// 1. A zero with several tall neighbours is a lidar drop-out inside the mass; a lone zero is open ground.
const filled = raw.map((row, z) => row.map((r, x) => {
  if (r !== 0) return r;
  const tall = nb8(x, z).map(([a, b]) => raw[b][a]).filter((v) => v >= 8);
  return tall.length >= 3 ? median(tall) : 0;
}));

// 2. Median-smooth each cell over its 5 x 5 lot neighbourhood and snap to whole storeys (3 blocks, 3 to 21), then a
// mode pass over 3 x 3 so one noisy cell cannot make a stray course on a flat roof.
const near = (x, z, n) => { const out = []; for (let dz = -n; dz <= n; dz++) for (let dx = -n; dx <= n; dx++) if (inLot(x + dx, z + dz) && filled[z + dz][x + dx] > 0) out.push(filled[z + dz][x + dx]); return out; };
const snap = Array.from({ length: D }, () => Array(W).fill(0));
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!(filled[z][x] > 0)) continue;
  snap[z][x] = Math.min(21, Math.max(3, Math.round(median(near(x, z, 2)) / 3) * 3));
}
const H = Array.from({ length: D }, () => Array(W).fill(0));
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!snap[z][x]) continue;
  const v = [snap[z][x], ...nb8(x, z).map(([a, b]) => snap[b][a]).filter((q) => q > 0)];
  const count = new Map(); for (const q of v) count.set(q, (count.get(q) || 0) + 1);
  H[z][x] = [...count].sort((p, q) => q[1] - p[1] || Math.abs(p[0] - snap[z][x]) - Math.abs(q[0] - snap[z][x]))[0][0];
}

const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && H[z][x] > 0;
const top = (x, z) => (inside(x, z) ? H[z][x] : 0);
const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
const PRIORITY = ["N", "S", "E", "W"];

// The faces of cell (x, z) that are open to the air at height y (neighbour outside the lot or shorter than y).
const exposed = (x, z, y) => PRIORITY.filter((d) => top(x + DIRS[d][0], z + DIRS[d][1]) <= y);

// Materials. A curtain wall: white precast spandrel at each storey line, tinted glass between dark mullions.
const CORE = "white_concrete", SPANDREL = "white_concrete", FRAME = "gray_concrete", GLASS = "light_blue_stained_glass";
const LIT = "glowstone", BASE = "polished_granite", CAP = "smooth_quartz", ROOF = "gray_concrete", PLANT = "light_gray_concrete";
const STREET = "N", ENTRY_X = [21, 22];                                   // two-bay recessed entrance on the street face

// Warm lamps in a scatter of upper-storey windows; the lobby keeps two lit panes either side of the door.
const lit = (x, y, z) => (y >= 4 && (x * 5 + y * 3 + z * 7) % 19 === 0) || (y === 1 && z === 1 && (x === 19 || x === 25));

const blocks = new Map();   // "x,y,z" -> { b, s } or "air"
const put = (x, y, z, b, s) => blocks.set(`${x},${y},${z}`, s ? { b, s } : { b });
const AIR = "air";

// Pass 1: the wall, floors and roof of every cell, column by column from the ground up to its tier.
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const h = H[z][x]; if (!h) continue;
  for (let y = 0; y < h; y++) {
    const sides = exposed(x, z, y);
    const k = Math.floor(y / 3), r = y % 3;
    if (!sides.length) { put(x, y, z, y === h - 1 ? ROOF : CORE); continue; }   // core, or the tar roof
    const side = sides.includes(STREET) ? STREET : sides[0];
    const u = side === "N" || side === "S" ? x : z;                                  // position along the face
    if (y === h - 1) { put(x, y, z, CAP); continue; }                               // quartz parapet
    if (k === 0 && r === 0) { put(x, y, z, BASE); continue; }                        // granite plinth
    if (r === 0) { put(x, y, z, SPANDREL); continue; }                               // storey line / slab edge
    const isEntry = side === STREET && k === 0 && ENTRY_X.includes(x);
    if (isEntry) {
      put(x, y, z, "iron_door", { facing: "north", half: r === 1 ? "lower" : "upper", hinge: x === ENTRY_X[0] ? "left" : "right", open: "false", powered: "false" });
      continue;
    }
    if (u % 3 === 0) { put(x, y, z, FRAME); continue; }                              // mullion
    put(x, y, z, lit(x, y, z) ? LIT : GLASS);
  }
}

// Pass 2: air gaps behind the glass. Each window or door cell opens its inner neighbour (not on the roof, not
// under the slab), so the interior is a hollow pocket per storey between the floor slabs and no room is furnished.
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const h = H[z][x]; if (!h) continue;
  for (let y = 1; y < h - 1; y++) {
    const r = y % 3; if (r === 0) continue;
    const sides = exposed(x, z, y); if (!sides.length) continue;
    const side = sides.includes(STREET) ? STREET : sides[0];
    const u = side === "N" || side === "S" ? x : z;
    const g = blocks.get(`${x},${y},${z}`);
    if (!g || g.b === FRAME || g.b === CAP) continue;
    const [dx, dz] = DIRS[side];
    const ix = x - dx, iz = z - dz;                                             // one cell inward
    if (!inside(ix, iz) || top(ix, iz) <= y || exposed(ix, iz, y).length) continue;
    blocks.set(`${ix},${y},${iz}`, { air: true });
    void u;
  }
}

// Pass 3: rooftop plant. A screen of plant louvres stands on the tallest tier (H = 21) where it is supported.
for (let z = 5; z < 12; z++) for (let x = 8; x < 15; x++) {
  if (H[z][x] !== 21) continue;
  const edge = x === 8 || x === 14 || z === 5 || z === 11;
  for (let y = 21; y <= 22; y++) put(x, y, z, edge ? PLANT : ROOF, undefined);
}

// Pass 4: the lobby canopy, a quartz lintel over the entrance bays, on the street face of the spandrel line.
for (const x of ENTRY_X) for (let z = 0; z < D; z++) {
  if (!inside(x, z) || H[z][x] <= 3 || !exposed(x, z, 3).includes(STREET)) continue;
  put(x, 3, z, CAP);
}

// Write the structure. Air cells are left out of the file (missing cells are air).
const g = new Voxels([W, YMAX, D]);
for (const [key, v] of blocks) {
  if (v.air) continue;
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, v.b, v.s);
}
const out = g.save(`${DIR}/NYC1090823.nbt`);
console.log(JSON.stringify({ ...out, height: Math.max(...H.flat()) }));
