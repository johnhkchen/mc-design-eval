// 1825 Connecticut Ave NW: an 8-storey red-brick apartment block (c. 1920s Washington walk-up / elevator block) with
// limestone string courses, quoins, a cornice and a granite base. The lidar gives a 17-block core, 14-block shoulders
// and 4-block low wings: each is one flat tier, so the massing steps in rather than rolling with the noise. One storey
// is two rows: a limestone string course on the even rows, a window row on the odd rows. Every column is solid from
// y 0 to its top (foundation below grade), so nothing floats. The only air is the one-block gap behind each pane,
// and a few of those gaps hold a glowstone. The entrance is on the north face, with a glazed transom, lanterns and a
// roof penthouse on the core.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC80339.cells.json`, "utf8"));
const OUT = `${DIR}/DC80339.nbt`;

const W = 28, H = 19, D = 22;
const g = new Voxels([W, H, D]);

const WALL = "bricks", TRIM = "calcite", BASE = "polished_granite", CORNICE = "calcite", FILL = "stone";
const DECK = "smooth_stone", GLASS = "light_blue_stained_glass_pane";
const key = (x, z) => `${x},${z}`;
const pk = (x, y, z) => `${x},${y},${z}`;

// ---- massing: 3x3 median of the lidar roof, snapped to three flat tiers ----
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const tierOf = (m) => (m >= 16 ? 17 : m >= 10 ? 14 : 4);
const raw = new Map(), TOP = new Map(), GR = new Map();
for (const [x, z, gr, roof] of cells) raw.set(key(x, z), { gr, roof });
for (const [x, z, gr] of cells) {
  const near = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const c = raw.get(key(x + dx, z + dz)); if (c) near.push(c.roof);
  }
  TOP.set(key(x, z), tierOf(median(near)));
  GR.set(key(x, z), gr);
}
const T = (x, z) => TOP.get(key(x, z)) ?? -1;               // -1 = outside the footprint
const base = (x, z) => Math.max((GR.get(key(x, z)) ?? 0) - 1, 0);   // the grade course, above the foundation

// Sides on which a cell at row y faces open air: outside the footprint, or the neighbour stands lower than y.
const DIRS = [["W", -1, 0], ["E", 1, 0], ["N", 0, -1], ["S", 0, 1]];
const INWARD = { W: [1, 0], E: [-1, 0], N: [0, 1], S: [0, -1] };
const openSides = (x, z, y) => DIRS.filter(([, dx, dz]) => T(x + dx, z + dz) <= y).map(([d]) => d);

// ---- the penthouse: a 7 x 5 box on the core, clear of the core's edges by one cell ----
const coreCells = [...TOP.entries()].filter(([, t]) => t === 17).map(([k]) => k.split(",").map(Number));
const cx = coreCells.reduce((s, [x]) => s + x, 0) / coreCells.length;
const cz = coreCells.reduce((s, [, z]) => s + z, 0) / coreCells.length;
let pent = null;
for (let x0 = 1; x0 + 7 <= W - 1; x0++) for (let z0 = 1; z0 + 5 <= D - 1; z0++) {
  let ok = true;
  for (let x = x0 - 1; x <= x0 + 7 && ok; x++) for (let z = z0 - 1; z <= z0 + 5 && ok; z++) if (T(x, z) !== 17) ok = false;
  if (!ok) continue;
  const d = Math.hypot(x0 + 3 - cx, z0 + 2 - cz);
  if (!pent || d < pent.d) pent = { x0, z0, x1: x0 + 6, z1: z0 + 4, d };
}

// ---- a chimney on each of two shoulder roofs (cells whose 8 neighbours share the tier) ----
const chimneys = [];
for (const [x, z] of [...TOP.keys()].map((k) => k.split(",").map(Number))) {
  if (T(x, z) !== 14) continue;
  let ring = true;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (T(x + dx, z + dz) !== 14) ring = false;
  if (!ring) continue;
  if (chimneys.every(([a, b]) => Math.hypot(a - x, b - z) >= 6)) chimneys.push([x, z]);
  if (chimneys.length === 2) break;
}

// ---- the air gap behind each window pane: the cell one step inward is air, all others solid ----
const air = new Set();
const isExt = (x, z, y) => openSides(x, z, y).length > 0;
for (const k of TOP.keys()) {
  const [x, z] = k.split(",").map(Number), t = T(x, z), b = base(x, z);
  for (let y = b + 1; y < t - 1; y += 2) {
    const sides = openSides(x, z, y);
    if (sides.length === 0) continue;
    const ew = sides.some((s) => s === "E" || s === "W"), ns = sides.some((s) => s === "N" || s === "S");
    if (ew && ns) continue;                                      // quoins: solid
    const idx = ew ? z : x;
    if (idx % 3 === 0) continue;                                 // piers: solid
    const [ix, iz] = INWARD[sides[0]];
    const nx = x + ix, nz = z + iz;
    if (T(nx, nz) > y && !isExt(nx, nz, y)) air.add(pk(nx, y, nz));
  }
}
// a penthouse pane's air gap, inside the box
const penthouseAir = new Set();
if (pent) {
  const { x0, z0, x1, z1 } = pent;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const ring = x === x0 || x === x1 || z === z0 || z === z1;
    if (!ring || x === x0 && z === z0 || x === x1 && z === z0 || x === x0 && z === z1 || x === x1 && z === z1) continue;
    const idx = (x === x0 || x === x1) ? z : x;
    if (idx % 3 === 0) continue;
    const ix = x === x0 ? 1 : x === x1 ? -1 : 0, iz = z === z0 ? 1 : z === z1 ? -1 : 0;
    penthouseAir.add(pk(x + ix, 17, z + iz));
  }
}

// deterministic, so the same build comes out every run: about one air gap in five is lit from behind
const lit = (x, y, z) => (((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0) % 5 === 0;

// ---- main pass: base, string courses on the even rows, windows on the odd rows, cornice on the top row ----
for (const k of TOP.keys()) {
  const [x, z] = k.split(",").map(Number), t = T(x, z), b = base(x, z);
  for (let y = 0; y < t; y++) {
    const sides = openSides(x, z, y), ext = sides.length > 0;
    if (y < b) { g.set(x, y, z, FILL); continue; }                // foundation under grade
    if (y === b) { g.set(x, y, z, ext ? BASE : FILL); continue; }  // granite base course
    if (y === t - 1) { g.set(x, y, z, ext ? CORNICE : DECK); continue; }
    if (y % 2 === 0) { g.set(x, y, z, ext ? (y % 4 === 2 ? TRIM : WALL) : FILL); continue; }  // brick, with a limestone string course every other storey
    if (!ext) { g.set(x, y, z, FILL); continue; }                  // interior: solid, air only behind panes below
    if (air.has(pk(x, y, z))) { if (lit(x, y, z)) g.set(x, y, z, "glowstone"); continue; }
    const ew = sides.some((s) => s === "E" || s === "W"), ns = sides.some((s) => s === "N" || s === "S");
    if (ew && ns) { g.set(x, y, z, TRIM); continue; }              // quoins at the corners
    const idx = ew ? z : x;
    g.set(x, y, z, idx % 3 === 0 ? WALL : GLASS);                  // bays of two panes between brick piers
  }
}

// ---- foundation shows where the ground is lower: nothing to do, the fill above is solid to y 0 ----

// ---- entrance on the north face: pilasters, a glazed transom, a door, lanterns hung under the string course ----
for (const [x, y] of [[11, 1], [11, 2], [11, 3], [14, 1], [14, 2], [14, 3]]) g.set(x, y, 0, TRIM);
for (const x of [12, 13]) {
  g.set(x, 1, 0, "oak_door", { facing: "north", half: "lower", hinge: x === 12 ? "left" : "right", open: "false", powered: "false" });
  g.set(x, 2, 0, "oak_door", { facing: "north", half: "upper", hinge: x === 12 ? "left" : "right", open: "false", powered: "false" });
  g.set(x, 3, 0, GLASS);
}
for (const x of [10, 15]) g.set(x, 3, 0, "lantern", { hanging: "true", waterlogged: "false" });

// ---- penthouse on the core: brick walls with panes, a limestone cap, a smooth roof ----
if (pent) {
  const { x0, z0, x1, z1 } = pent;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const ring = x === x0 || x === x1 || z === z0 || z === z1;
    const corner = (x === x0 || x === x1) && (z === z0 || z === z1);
    for (let y = 17; y <= 18; y++) {
      if (!ring) { if (y === 18) g.set(x, y, z, DECK); else if (!penthouseAir.has(pk(x, y, z))) g.set(x, y, z, FILL); continue; }
      if (y === 18) { g.set(x, y, z, TRIM); continue; }
      if (corner) { g.set(x, y, z, TRIM); continue; }
      const idx = (x === x0 || x === x1) ? z : x;
      if (penthouseAir.has(pk(x, y, z))) { continue; }
      g.set(x, y, z, idx % 3 === 0 ? WALL : GLASS);
    }
  }
  for (const k of penthouseAir) {
    const [x, y, z] = k.split(",").map(Number);
    if (lit(x, y, z)) g.set(x, y, z, "glowstone");
  }
}

// ---- two brick chimneys on the shoulder roofs ----
for (const [x, z] of chimneys) {
  g.set(x, 14, z, WALL); g.set(x, 15, z, WALL); g.set(x, 16, z, TRIM);
}

g.save(OUT);
console.log(`built ${OUT}: ${g.count()} blocks, penthouse ${pent ? `${pent.x0}..${pent.x1} x ${pent.z0}..${pent.z1}` : "none"}, chimneys ${chimneys.length}`);
