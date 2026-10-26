import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 700 K St NW: a 1980s-style Washington office block. Pale precast and quartz piers,
// granite base and shopfront, tinted glass in bays, a 6-storey core stepping down
// to 5 and 3 storeys on the wings, and a plant penthouse on the core.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC53951.cells.json`, "utf8"));

const W = 36, D = 31, H = 32;
const STOREY = 3;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const raw = new Map();
for (const [x, z, gr, roof] of cells) raw.set(key(x, z), { gr, roof });
const has = (x, z) => raw.has(key(x, z));
const faces = (x, z) => ({ n: !has(x, z - 1), s: !has(x, z + 1), w: !has(x - 1, z), e: !has(x + 1, z) });

// Lidar roof: median over a 5x5 window (noise out, the notch of near-zero roof becomes a low court),
// then snapped to two-storey tiers (6 blocks), at least two storeys, so the massing is three clean tiers.
const TOP = new Map();
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const vals = [];
  for (let dz = -2; dz <= 2; dz++)
    for (let dx = -2; dx <= 2; dx++) {
      const c = raw.get(key(x + dx, z + dz));
      if (c) vals.push(c.roof);
    }
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  TOP.set(key(x, z), Math.max(2 * STOREY, Math.round((med - 1) / (2 * STOREY)) * 2 * STOREY));
}
const top = (x, z) => TOP.get(key(x, z));
const gr = (x, z) => raw.get(key(x, z)).gr;
const TMAX = Math.max(...TOP.values());

// The main entrance: the north (K Street) face, near the middle of its run
const DOOR_X = 22;

// Penthouse: the plant box on the highest tier, central, only where the roof is the top tier
const PH_X = [12, 23], PH_Z = [7, 14];
const PH = new Set();
for (const [x, z] of cells.map((c) => [c[0], c[1]]))
  if (x >= PH_X[0] && x <= PH_X[1] && z >= PH_Z[0] && z <= PH_Z[1] && top(x, z) === TMAX) PH.add(key(x, z));
const inPH = (x, z) => PH.has(key(x, z));

// The room behind a facade bay: the one cell inward from a single exposed face, if it is interior
function warmLight(x, y, z, f) {
  const inward = f.n && !f.s && !f.w && !f.e ? [0, 1]
    : f.s && !f.n && !f.w && !f.e ? [0, -1]
    : f.w && !f.n && !f.s && !f.e ? [1, 0]
    : f.e && !f.n && !f.s && !f.w ? [-1, 0] : null;
  if (!inward) return;
  const ix = x + inward[0], iz = z + inward[1];
  const fi = faces(ix, iz);
  if (!has(ix, iz) || fi.n || fi.s || fi.w || fi.e) return;
  const hsh = (x * 31 + z * 17 + y * 7) % 7;
  if (hsh === 0) g.set(ix, y, iz, "glowstone");
  else if (hsh === 3) g.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
}

for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const T = top(x, z), G = gr(x, z);
  const f = faces(x, z);
  const fac = f.n || f.s || f.w || f.e;
  const pier = ((f.n || f.s) && (f.w || f.e)) || (f.n || f.s ? x : z) % 3 === 0;   // corners and every third bay
  const isDoor = f.n && z === 0 && x === DOOR_X;

  // Foundation: solid from y 0 up to this cell's ground, so the walls stand on it
  for (let y = 0; y < G; y++) g.set(x, y, z, "polished_granite");

  for (let y = G; y < T; y++) {
    if (!fac) {
      // Interior: a floor slab per storey, a roof deck on top, air between (behind the glass)
      if (y === G || (y % STOREY === 0 && y >= STOREY && y <= T - STOREY)) g.set(x, y, z, "light_gray_concrete");
      else if (y === T - 1) g.set(x, y, z, "light_gray_concrete");
      continue;
    }
    if (y === 0) { g.set(x, y, z, "polished_granite"); continue; }        // base course
    if (y === T - 1) { g.set(x, y, z, "smooth_quartz"); continue; }       // cornice band
    if (isDoor && (y === G || y === G + 1)) {
      g.set(x, y, z, "dark_oak_door", {
        facing: "north", half: y === G ? "lower" : "upper", hinge: "left", open: "false", powered: "false",
      });
      continue;
    }
    const storey = Math.floor(y / STOREY), rel = y % STOREY;
    if (storey === 0) {
      // Shopfront: granite piers, glass bays
      g.set(x, y, z, pier ? "polished_granite" : "light_blue_stained_glass");
    } else if (rel === 0) {
      g.set(x, y, z, pier ? "smooth_quartz" : "light_gray_concrete");     // spandrel and pier
    } else {
      g.set(x, y, z, pier ? "smooth_quartz" : "light_blue_stained_glass");
    }
    // Warm light in a few bays: glowstone or a standing lantern in the air gap behind the glass
    const glassRow = storey === 0 ? y === G + 1 : rel === 1;
    if (glassRow && !pier && !isDoor && y <= T - 2) warmLight(x, y, z, f);
  }

  if (fac) g.set(x, T, z, "smooth_quartz");                               // parapet
}

// Penthouse plant box on the top tier: walls, a band of glass, a roof deck
for (const k of PH) {
  const [x, z] = k.split(",").map(Number);
  const T = top(x, z);
  const edge = !PH.has(key(x - 1, z)) || !PH.has(key(x + 1, z)) || !PH.has(key(x, z - 1)) || !PH.has(key(x, z + 1));
  for (let y = T; y <= T + 2; y++) {
    if (y === T + 2) { g.set(x, y, z, "light_gray_concrete"); continue; }
    if (!edge) continue;                                                   // interior: air
    if (y === T) g.set(x, y, z, "white_concrete");
    else g.set(x, y, z, x % 3 === 0 || z % 3 === 0 ? "smooth_quartz" : "light_blue_stained_glass");
  }
}

g.save(`${DIR}/DC53951.nbt`);
