import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// DC87504 - Southern Railway Company, 1500 K St NW.
// Commercial office, large. Read as a mid-century (c. 1960s) modern office block:
// light precast concrete piers and spandrels, tinted glass bands, a granite base,
// a quartz cornice, a recessed glass entrance with lintel and lanterns, and one
// central mechanical penthouse. Storeys are 2 blocks (one glass row plus one spandrel).

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC87504.cells.json`, "utf8"));

const W = 29, H = 32, D = 27;
const g = new Voxels([W, H, D]);

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const key = (x, z) => `${x},${z}`;

// Raw per-cell values from lidar.
const raw = new Map();
for (const row of cells) {
  const [x, z, gr, roof] = row;
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  raw.set(key(x, z), { x, z, gr, roof });
}
const has = (x, z) => raw.has(key(x, z));

// Smooth ground and roof over the 3x3 neighbourhood to get clean tiers.
const map = new Map();
for (const { x, z } of raw.values()) {
  let sg = 0, sr = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const c = raw.get(key(x + dx, z + dz));
    if (!c) continue;
    sg += c.gr; sr += c.roof; n++;
  }
  const G = clamp(Math.round(sg / n), 0, H - 10);
  let T = Math.round((sr / n) / 2) * 2;
  T = clamp(T, G + 2, H - 6);
  map.set(key(x, z), { x, z, G, T });
}

const S = (x, y, z, id) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  g.set(x, y, z, id);
};

const exposure = (x, z) => ({
  N: !has(x, z - 1),
  S: !has(x, z + 1),
  W: !has(x - 1, z),
  E: !has(x + 1, z),
});

// Entrance centred on the south-exposed (K Street-facing) cells.
const sXs = [...map.values()].filter(c => exposure(c.x, c.z).S).map(c => c.x).sort((a, b) => a - b);
const entranceX = sXs.length ? sXs[Math.floor(sXs.length / 2)] : Math.floor(W / 2);

const isPier = (x, z, ex) => {
  if ((ex.N || ex.S) && (ex.W || ex.E)) return true; // corner fins
  if ((ex.N || ex.S) && x % 3 === 0) return true;
  if ((ex.W || ex.E) && z % 3 === 0) return true;
  return false;
};

const inward = (x, z, ex) => {
  if (ex.N) return [x, z + 1];
  if (ex.S) return [x, z - 1];
  if (ex.W) return [x + 1, z];
  if (ex.E) return [x - 1, z];
  return null;
};

// Penthouse core: centre cell's roof level is the base.
const core = map.get(key(14, 13));
const PB = core ? core.T : Math.max(...[...map.values()].map(c => c.T));
const inPenthouse = (x, z) => Math.abs(x - 14) <= 3 && Math.abs(z - 13) <= 3;

for (const { x, z, G, T } of map.values()) {
  const ex = exposure(x, z);
  const perim = ex.N || ex.S || ex.W || ex.E;

  // Foundation.
  for (let y = 0; y < G; y++) S(x, y, z, perim ? "polished_granite" : "granite");

  if (!perim) {
    // Interior: slabs every storey, air between, solid top two courses and roof.
    for (let y = G; y < T; y++) {
      const off = y - G;
      if (off % 2 === 0 || y >= T - 2) S(x, y, z, "light_gray_concrete");
    }
    continue;
  }

  // Facade.
  const entrance = ex.S && Math.abs(x - entranceX) <= 1 && T > G + 6;
  const pier = isPier(x, z, ex);

  for (let y = G; y < T; y++) {
    const off = y - G;
    if (entrance) {
      let id = null;
      if (y === G) id = "polished_granite";
      else if (y <= G + 2) id = (Math.abs(x - entranceX) === 1) ? "polished_granite" : "glass";
      else if (y === G + 3) id = "smooth_quartz";
      else if (y === T - 1) id = "smooth_quartz";
      if (id) S(x, y, z, id);
      continue;
    }
    let id;
    if (y === G) id = "polished_granite";              // granite base course
    else if (y === T - 1) id = "smooth_quartz";        // quartz cornice
    else if (pier) id = "white_concrete";              // precast piers / corner fins
    else if (off % 2 === 0) id = "light_gray_concrete";// spandrel / storey line
    else id = "light_blue_stained_glass";              // tinted glazing
    S(x, y, z, id);

    // Warm light behind some windows.
    if (!pier && off % 2 === 1 && y < T - 2 && (x + z + y) % 7 === 0) {
      const inn = inward(x, z, ex);
      if (inn && has(inn[0], inn[1])) {
        const ic = map.get(key(inn[0], inn[1]));
        if (ic && y >= ic.G && y < ic.T - 2 && (y - ic.G) % 2 === 1) {
          S(inn[0], y, inn[1], "lantern");
        }
      }
    }
  }

  // Entrance lanterns above the lintel.
  if (entrance && x === entranceX && G + 4 < T - 1) S(x, G + 4, z, "lantern");
}

// Central mechanical penthouse: one clean box, standing on cells whose roof is PB.
for (const { x, z, T } of map.values()) {
  const ex = exposure(x, z);
  if (ex.N || ex.S || ex.W || ex.E) continue;
  if (!inPenthouse(x, z) || T !== PB || PB + 3 > H) continue;
  const ring = Math.abs(x - 14) === 3 || Math.abs(z - 13) === 3;
  S(x, PB, z, "light_gray_concrete");
  S(x, PB + 1, z, ring ? "light_blue_stained_glass" : null);
  S(x, PB + 2, z, "smooth_quartz");
}

g.save(`${DIR}/DC87504.nbt`);
