// 18 East 48th Street, 1928 commercial and office building: a 1920s setback office block of buff stone and glazed
// terracotta on a granite base, with a shopfront on the 48th Street frontage (the north, low-z edge) and a recessed
// entrance at x 10-11. The lidar roof (lidar 0 is open ground: the court to the south-east is left open) is quantised
// into six flat tiers (7, 14, 47, 65, 74, 83 blocks, about 2, 5, 16, 22, 25 and 28 storeys) and smoothed by a 3 x 3
// majority, so each setback stands on the one below it: every cell is solid from y 0 to its tier. Facades are a
// granite base course, a ground-floor shopfront, then a 3-block storey rhythm (a chiselled spandrel course over two
// rows of glass, with white terracotta piers every third column). The glass sits in the facade with air behind it and
// a floor slab in each storey (no interiors); some panes have a glowstone light in the air behind them. The tallest
// tier carries a stone penthouse with a glass band. Glass panes are set to connect along their own face.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035422.cells.json`, "utf8"));
const X = 21, Y = 95, Z = 26;

const lidar = new Map(cells.map(([x, z, , roof]) => [`${x},${z}`, roof]));
const inFoot = (x, z) => lidar.has(`${x},${z}`);

// Tiers: quantise each lidar roof, then take the majority tier of the 3 x 3 around it (ties keep the cell's own tier).
const tierOf = (L) => (L <= 12 ? 7 : L <= 24 ? 14 : L <= 55 ? 47 : L <= 71 ? 65 : L <= 79 ? 74 : 83);
const raw = new Map();
for (const [k, L] of lidar) if (L > 0) raw.set(k, tierOf(L));
const tier = new Map();
for (const [k, t] of raw) {
  const [x, z] = k.split(",").map(Number);
  const n = new Map();
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const v = raw.get(`${x + dx},${z + dz}`); if (v) n.set(v, (n.get(v) || 0) + 1);
  }
  let best = t, bc = n.get(t) || 0;
  for (const [v, c] of n) if (c > bc) { best = v; bc = c; }
  tier.set(k, best);
}

// The penthouse: a stone box on the 83-block roof, x 7-13 and z 9-10, rising to 87.
const PENT_TOP = 87;
const pent = (x, z) => x >= 7 && x <= 13 && z >= 9 && z <= 10 && tier.get(`${x},${z}`) === 83;
const T = (x, z) => tier.get(`${x},${z}`) ?? 0;          // building top of the cell (0 = open ground or outside)
const H = (x, z) => (!inFoot(x, z) ? 0 : pent(x, z) ? PENT_TOP : T(x, z));
const open = (x, y, z) => H(x, z) <= y;

// Exterior faces: N = low z (48th Street), S = rear, W/E = the sides. The first open neighbour gives the face.
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const faceOf = (x, y, z) => {
  for (const d of ["N", "S", "W", "E"]) { const [dx, dz] = DIRS[d]; if (open(x + dx, y, z + dz)) return d; }
  return null;
};
// Along-face position: x on the N and S faces, z on the W and E faces. Piers stand every third column.
const along = (d, x, z) => (d === "N" || d === "S" ? x : z);
const pier = (u) => u % 3 === 0;
// A pane connects to its neighbours along its own face (sibling convention: a pane facing N/S runs along x).
const pane = (d) => (d === "N" || d === "S"
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
const lit = (u, y, k) => (u * 5 + y * 7 + k * 3) % 11 === 0;   // sparse, deterministic warm windows

const cols = [...lidar.keys()].map((k) => k.split(",").map(Number));
const g = new Voxels([X, Y, Z]);

// 1. Mass and facades. Open ground (lidar 0) is paved at y 0. Every built cell is a granite base course at y 0, a
// roof slab at its tier top (a cornice on the outside, grey roof felt inside), storey floors inside (air otherwise),
// and facade blocks on the faces.
const lights = [];
for (const [x, z] of cols) {
  const t = T(x, z), h = H(x, z);
  if (h === 0) { g.set(x, 0, z, "smooth_stone"); continue; }
  for (let y = 0; y < h; y++) {
    const d = faceOf(x, y, z);
    if (y === 0) { g.set(x, y, z, "polished_granite"); continue; }
    if (y === h - 1) { g.set(x, y, z, d ? "polished_granite" : "gray_concrete"); continue; }
    if (y === t - 1) { g.set(x, y, z, d ? "polished_granite" : "gray_concrete"); continue; }
    if (y >= t) {                                         // penthouse: a stone box with a glass band at y 84-85
      if (!d) continue;
      const u = along(d, x, z);
      if (pier(u)) g.set(x, y, z, "smooth_sandstone");
      else if (y >= 84 && y <= 85) g.set(x, y, z, "light_blue_stained_glass_pane", pane(d));
      else g.set(x, y, z, "smooth_sandstone");
      continue;
    }
    if (!d) { if (y % 3 === 0) g.set(x, y, z, "smooth_stone"); continue; }   // storey floor slab, air otherwise
    const u = along(d, x, z);
    if (y < 3) {                                          // ground floor: shopfront glass between piers
      g.set(x, y, z, pier(u) ? "white_terracotta" : "glass_pane", pier(u) ? undefined : pane(d));
      continue;
    }
    if (pier(u)) { g.set(x, y, z, "white_terracotta"); continue; }
    if (y % 3 === 0) { g.set(x, y, z, "chiseled_sandstone"); continue; }   // storey spandrel course
    g.set(x, y, z, "light_blue_stained_glass_pane", pane(d));
    if (lit(u, y, z + x)) lights.push([x, y, z, d]);
  }
}

// 2. Warm light: a glowstone in the air behind a lit pane (only where that cell is inside the building).
for (const [x, y, z, d] of lights) {
  const [dx, dz] = DIRS[d], bx = x - dx, bz = z - dz;
  if (inFoot(bx, bz) && !faceOf(bx, y, bz) && H(bx, bz) > y) g.set(bx, y, bz, "glowstone");
}

// 3. Recessed entrance on 48th Street, x 10-11: the cells at z 0 above the base are air, a lintel stands at y 3 between
// the piers at x 9 and x 12, two lanterns hang from it, and a double iron door sits in the recess at z 1.
for (const x of [10, 11]) {
  g.set(x, 1, 0, "air"); g.set(x, 2, 0, "lantern", { hanging: "true", waterlogged: "false" });
  g.set(x, 3, 0, "polished_granite");
  for (const y of [1, 2]) {
    const half = y === 1 ? "lower" : "upper";
    g.set(x, y, 1, "iron_door", { facing: "north", half, hinge: x === 10 ? "left" : "right", open: "false", powered: "false" });
  }
}

const { blocks, palette } = g.save(`${DIR}/NYC1035422.nbt`);
console.log(`NYC1035422.nbt: ${blocks} blocks, ${palette} palette entries`);
