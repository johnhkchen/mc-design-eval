// Rihga Royal Hotel, 151 W 54th St (1987): a 1980s Midtown hotel tower. Tinted grey glass in quartz mullions over
// light-grey spandrels, a polished-granite base course, a shopfront and entrance on the street (north, low z) face,
// a stepped crown (155 tower, 144 setback, 108 wing, low street wing) and a lit penthouse on top.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const FILL = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${FILL}/NYC1069590.cells.json`, "utf8"));
const W = 40, D = 22, H = 167;

// Lidar roof heights -> clean flat tiers (0 = no building on that cell).
const tierOf = (r) => {
  if (r <= 0) return 0;
  if (r >= 148) return 155;                       // tower top (lidar cluster 150-165)
  if (r >= 136) return 144;                       // setback tier
  if (r >= 100) return 108;                       // east wing
  return Math.max(3, Math.round(r / 3) * 3);      // low street wing, on storey lines
};

const grid = (fill) => Array.from({ length: D }, () => Array(W).fill(fill));
const T0 = grid(0), G0 = grid(0);
for (const [x, z, ground, roof] of cells) { T0[z][x] = tierOf(roof); G0[z][x] = ground; }

const at = (g, x, z) => (x >= 0 && x < W && z >= 0 && z < D ? g[z][x] : 0);
const NB8 = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
const median = (a) => a.slice().sort((p, q) => p - q)[a.length >> 1];

// Drop lone lidar spikes (fewer than 3 standing neighbours); fill pinholes ringed by 6+ standing cells.
const T = grid(0);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const t = T0[z][x];
  const n = NB8.map(([dx, dz]) => at(T0, x + dx, z + dz)).filter((v) => v > 0);
  T[z][x] = t > 0 ? (n.length < 3 ? 0 : t) : (n.length >= 6 ? median(n) : 0);
}
const top = (x, z) => at(T, x, z);

const SIDES = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };
const OPP = { n: "s", s: "n", e: "w", w: "e" };
// A side is exposed at height y when the neighbour has no solid there (missing, or its top is at or below y).
const exposed = (x, z, y) => Object.keys(SIDES).filter((k) => { const [dx, dz] = SIDES[k]; return top(x + dx, z + dz) <= y; });
const interior = (x, z, y) => top(x, z) > y && exposed(x, z, y).length === 0;
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const t = top(x, z); if (!t) continue;
  for (let y = 0; y < at(G0, x, z); y++) put(x, y, z, "polished_granite");   // foundation (none: lidar ground is 0 here)
  for (let y = 0; y < t; y++) {
    if (y === t - 1) { put(x, y, z, "smooth_quartz"); continue; }             // roof slab / terrace
    const ex = exposed(x, z, y);
    if (!ex.length) { if (y % 3 === 0) put(x, y, z, "light_gray_concrete"); continue; }   // storey slab, interior air
    const idx = ex.includes("n") || ex.includes("s") ? x : z;                // mullion rhythm along the face
    let block;
    if (y >= t - 3) block = "smooth_quartz";                                 // parapet
    else if (y === 0) block = "polished_granite";                            // base course
    else if (y % 3 === 0) block = "light_gray_concrete";                     // spandrel on the storey line
    else if (ex.length > 1 || idx % 3 === 0) block = "smooth_quartz";        // corner and mullion
    else block = y <= 2 ? "light_blue_stained_glass" : "gray_stained_glass";  // storefront / office glass
    // Street entrance: a double iron door under a granite canopy band on the north face.
    if (z === 0 && (x === 17 || x === 18) && (y === 1 || y === 2)) {
      put(x, y, z, "iron_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: x === 17 ? "left" : "right", open: "false", powered: "false" });
      continue;
    }
    if (z === 0 && x >= 15 && x <= 20 && y === 3) block = "polished_granite";   // canopy band
    put(x, y, z, block);
    // Warm light in some windows: a lamp one cell inside the glass (only on single-face glass, inside air).
    if (block.includes("glass") && ex.length === 1 && hash(x, y, z) % 100 < 16) {
      const [dx, dz] = SIDES[OPP[ex[0]]];
      const ix = x + dx, iz = z + dz;
      if (interior(ix, iz, y)) put(ix, y, iz, hash(x, y, z) % 4 ? "glowstone" : "shroomlight");
    }
  }
}

// Rooftop penthouse on the tower top: quartz box with grey glass band, glowing crown lamps.
for (let z = 6; z <= 12; z++) for (let x = 6; x <= 13; x++) {
  if (top(x, z) !== 155) continue;
  const rim = x === 6 || x === 13 || z === 6 || z === 12;
  for (let y = 155; y <= 157; y++) {
    const b = y === 156 && rim ? "gray_stained_glass" : y === 157 || (y === 155 && rim) ? "smooth_quartz" : "light_gray_concrete";
    put(x, y, z, b);
  }
  if ((x === 6 || x === 13) && (z === 6 || z === 12)) put(x, 158, z, "glowstone");
}

// Mechanical boxes on the setback terrace and the east wing roof.
for (let z = 7; z <= 9; z++) for (let x = 27; x <= 29; x++) if (top(x, z) === 144) for (const y of [144, 145]) put(x, y, z, "gray_concrete");
for (let z = 6; z <= 7; z++) for (let x = 36; x <= 37; x++) if (top(x, z) === 108) for (const y of [108, 109]) put(x, y, z, "gray_concrete");

const tiers = {};
for (const row of T) for (const t of row) if (t) tiers[t] = (tiers[t] || 0) + 1;
const res = g.save(`${FILL}/NYC1069590.nbt`);
console.log("tiers (cells per tier):", JSON.stringify(tiers));
console.log("saved:", JSON.stringify(res));
